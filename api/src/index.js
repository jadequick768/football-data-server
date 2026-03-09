import Fastify from 'fastify';
import Redis from 'ioredis';

import { pool, migrate } from './db.js';
import {
  hashPassword,
  newId,
  refreshExpiryDate,
  sha256Base64url,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken,
} from './auth.js';
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from './cookies.js';

const {
  PORT = '3000',
  SPORTSRC_API_KEY,
  SPORTSRC_BASE_URL = 'https://api.sportsrc.org/v2/',
  REDIS_URL = 'redis://127.0.0.1:6379',
  CACHE_PREFIX = 'sportsrc:v1',
  WEB_ORIGIN = 'https://app.tintuc360.net',
} = process.env;

if (!SPORTSRC_API_KEY) {
  console.warn('[WARN] SPORTSRC_API_KEY is not set');
}

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
          },
  },
});

// Minimal CORS for cookie-based auth
app.addHook('onRequest', async (req, reply) => {
  const origin = req.headers.origin;
  if (origin && origin === WEB_ORIGIN) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    reply.code(204).send();
  }
});

const redis = new Redis(REDIS_URL);

function cacheKey(parts) {
  return `${CACHE_PREFIX}:${parts.filter(Boolean).join(':')}`;
}

function ttlFor({ type, status }) {
  const fastTypes = new Set(['detail', 'stats', 'incidents', 'graph', 'odds', 'scores']);
  if (status === 'inprogress') return fastTypes.has(type) ? 20 : 60;
  if (status === 'upcoming') return 300;
  if (status === 'finished') return 1800;
  return 120;
}

async function sportsrcFetch(query) {
  const url = new URL(SPORTSRC_BASE_URL);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': SPORTSRC_API_KEY ?? '',
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`SportSRC error ${res.status}`);
    err.statusCode = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

async function cached(query, { ttlSec, keyParts }) {
  const key = cacheKey(keyParts);
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);

  const data = await sportsrcFetch(query);
  await redis.set(key, JSON.stringify(data), 'EX', ttlSec);
  return data;
}

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function requireUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

app.get('/health', async () => ({ ok: true }));

// --- AUTH ---
app.post('/v1/auth/register', async (req, reply) => {
  const { email, password, display_name } = req.body ?? {};
  if (!email || !password) return reply.code(400).send({ error: 'email and password are required' });

  const id = newId();
  const passwordHash = await hashPassword(password);

  try {
    await pool.query(
      'insert into users (id, email, password_hash, display_name) values ($1,$2,$3,$4)',
      [id, String(email).toLowerCase(), passwordHash, display_name ?? null]
    );
  } catch (e) {
    if (String(e?.message ?? '').includes('duplicate')) {
      return reply.code(409).send({ error: 'email already exists' });
    }
    throw e;
  }

  const access = await signAccessToken({ userId: id, email: String(email).toLowerCase() });
  const refresh = await signRefreshToken({ userId: id });
  await pool.query(
    'insert into refresh_tokens (id, user_id, token_hash, expires_at) values ($1,$2,$3,$4)',
    [newId(), id, sha256Base64url(refresh), refreshExpiryDate()]
  );

  setRefreshCookie(reply, refresh);
  return { access_token: access, token_type: 'Bearer' };
});

app.post('/v1/auth/login', async (req, reply) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return reply.code(400).send({ error: 'email and password are required' });

  const { rows } = await pool.query('select id, email, password_hash from users where email=$1', [
    String(email).toLowerCase(),
  ]);
  const user = rows[0];
  if (!user) return reply.code(401).send({ error: 'invalid credentials' });

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) return reply.code(401).send({ error: 'invalid credentials' });

  const access = await signAccessToken({ userId: user.id, email: user.email });
  const refresh = await signRefreshToken({ userId: user.id });
  await pool.query(
    'insert into refresh_tokens (id, user_id, token_hash, expires_at) values ($1,$2,$3,$4)',
    [newId(), user.id, sha256Base64url(refresh), refreshExpiryDate()]
  );

  setRefreshCookie(reply, refresh);
  return { access_token: access, token_type: 'Bearer' };
});

app.post('/v1/auth/refresh', async (req, reply) => {
  const refresh = getRefreshCookie(req) ?? req.body?.refresh_token;
  if (!refresh) return reply.code(401).send({ error: 'missing refresh token' });

  let payload;
  try {
    payload = await verifyRefreshToken(refresh);
  } catch {
    return reply.code(401).send({ error: 'invalid refresh token' });
  }

  const tokenHash = sha256Base64url(refresh);
  const { rows } = await pool.query(
    'select id, user_id, revoked_at, expires_at from refresh_tokens where token_hash=$1',
    [tokenHash]
  );
  const row = rows[0];
  if (!row || row.revoked_at) return reply.code(401).send({ error: 'refresh token revoked' });
  if (new Date(row.expires_at).getTime() < Date.now()) return reply.code(401).send({ error: 'refresh token expired' });

  const { rows: urows } = await pool.query('select id, email from users where id=$1', [payload.sub]);
  const user = urows[0];
  if (!user) return reply.code(401).send({ error: 'user not found' });

  const access = await signAccessToken({ userId: user.id, email: user.email });
  return { access_token: access, token_type: 'Bearer' };
});

app.post('/v1/auth/logout', async (req, reply) => {
  const refresh = getRefreshCookie(req) ?? req.body?.refresh_token;
  if (refresh) {
    await pool.query('update refresh_tokens set revoked_at=now() where token_hash=$1', [sha256Base64url(refresh)]);
  }
  clearRefreshCookie(reply);
  return { ok: true };
});

app.get('/v1/me', async (req, reply) => {
  const u = await requireUser(req);
  if (!u) return reply.code(401).send({ error: 'unauthorized' });

  const { rows } = await pool.query('select id, email, display_name, created_at from users where id=$1', [u.userId]);
  return { user: rows[0] };
});

app.get('/v1/me/favorites', async (req, reply) => {
  const u = await requireUser(req);
  if (!u) return reply.code(401).send({ error: 'unauthorized' });

  const { rows } = await pool.query(
    'select type, entity_id, created_at from favorites where user_id=$1 order by created_at desc',
    [u.userId]
  );
  return { favorites: rows };
});

app.post('/v1/me/favorites', async (req, reply) => {
  const u = await requireUser(req);
  if (!u) return reply.code(401).send({ error: 'unauthorized' });

  const { type, entity_id } = req.body ?? {};
  if (!type || !entity_id) return reply.code(400).send({ error: 'type and entity_id are required' });

  await pool.query(
    'insert into favorites (id, user_id, type, entity_id) values ($1,$2,$3,$4) on conflict do nothing',
    [newId(), u.userId, type, String(entity_id)]
  );

  return { ok: true };
});

app.delete('/v1/me/favorites', async (req, reply) => {
  const u = await requireUser(req);
  if (!u) return reply.code(401).send({ error: 'unauthorized' });

  const { type, entity_id } = req.body ?? {};
  if (!type || !entity_id) return reply.code(400).send({ error: 'type and entity_id are required' });

  await pool.query('delete from favorites where user_id=$1 and type=$2 and entity_id=$3', [
    u.userId,
    type,
    String(entity_id),
  ]);

  return { ok: true };
});

// --- SPORT DATA ---
app.get('/v1/matches', async (req, reply) => {
  const { date, status = 'inprogress', sport = 'football' } = req.query;
  if (!date) return reply.code(400).send({ error: 'date is required (YYYY-MM-DD)' });

  const type = 'matches';
  const ttlSec = ttlFor({ type, status });

  const data = await cached(
    { type, sport, status, date },
    { ttlSec, keyParts: ['matches', sport, status, date] }
  );
  return data;
});

app.get('/v1/matches/:id', async (req) => {
  const { id } = req.params;
  const status = req.query?.status; // optional hint
  const type = 'detail';
  const ttlSec = ttlFor({ type, status });

  return cached({ type, id }, { ttlSec, keyParts: ['detail', id] });
});

app.get('/v1/matches/:id/streams', async (req) => {
  const { id } = req.params;
  const detail = await cached({ type: 'detail', id }, { ttlSec: 30, keyParts: ['detail', id] });

  const streams =
    detail?.streams ??
    detail?.stream ??
    detail?.data?.streams ??
    detail?.data?.stream ??
    null;

  return { match_id: id, streams, detail };
});

app.get('/v1/matches/:id/deep/:deepType', async (req, reply) => {
  const { id, deepType } = req.params;

  const allowed = new Set([
    'scores',
    'lineups',
    'stats',
    'incidents',
    'h2h',
    'standing',
    'graph',
    'odds',
    'votes',
    'shotmap',
    'last_matches',
  ]);

  if (!allowed.has(deepType)) return reply.code(400).send({ error: 'Invalid deepType' });

  const ttlSec = ttlFor({ type: deepType, status: req.query?.status });
  return cached({ type: deepType, id }, { ttlSec, keyParts: ['deep', deepType, id] });
});

app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode && Number.isFinite(err.statusCode) ? err.statusCode : 500;
  req.log.error({ err }, 'request failed');
  reply.code(status).send({
    error: err.message,
    status,
    payload: err.payload,
  });
});

const start = async () => {
  try {
    await migrate();
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
