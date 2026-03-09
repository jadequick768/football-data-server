import Fastify from 'fastify';
import Redis from 'ioredis';

const {
  PORT = '3000',
  SPORTSRC_API_KEY,
  SPORTSRC_BASE_URL = 'https://api.sportsrc.org/v2/',
  REDIS_URL = 'redis://127.0.0.1:6379',
  CACHE_PREFIX = 'sportsrc:v1',
} = process.env;

if (!SPORTSRC_API_KEY) {
  // Fail fast in prod; in dev you can still start but endpoints will error.
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

const redis = new Redis(REDIS_URL);

function cacheKey(parts) {
  return `${CACHE_PREFIX}:${parts.filter(Boolean).join(':')}`;
}

function ttlFor({ type, status }) {
  // Conservative defaults; tune later.
  // Live-ish types should refresh faster.
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

app.get('/health', async () => ({ ok: true }));

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

  return cached(
    { type, id },
    { ttlSec, keyParts: ['detail', id] }
  );
});

app.get('/v1/matches/:id/streams', async (req) => {
  const { id } = req.params;
  const detail = await cached(
    { type: 'detail', id },
    { ttlSec: 30, keyParts: ['detail', id] }
  );

  // We don't know exact schema; return best-effort.
  // Client can inspect `streams` or `stream` fields.
  const streams =
    detail?.streams ??
    detail?.stream ??
    detail?.data?.streams ??
    detail?.data?.stream ??
    null;

  return { match_id: id, streams, detail }; // include detail for debugging MVP
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
  return cached(
    { type: deepType, id },
    { ttlSec, keyParts: ['deep', deepType, id] }
  );
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
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
