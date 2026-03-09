import crypto from 'node:crypto';
import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';

const enc = new TextEncoder();

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL_SEC = '1800',
  JWT_REFRESH_TTL_SEC = '2592000',
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.warn('[WARN] JWT secrets are not set');
}

const accessKey = () => enc.encode(JWT_ACCESS_SECRET ?? '');
const refreshKey = () => enc.encode(JWT_REFRESH_SECRET ?? '');

export async function hashPassword(password) {
  return argon2.hash(password);
}

export async function verifyPassword(hash, password) {
  if (!hash) return false;
  return argon2.verify(hash, password);
}

export function sha256Base64url(input) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

export function newId() {
  return crypto.randomUUID();
}

export async function signAccessToken({ userId, email }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Number(JWT_ACCESS_TTL_SEC);
  return new SignJWT({ sub: userId, email, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(accessKey());
}

export async function signRefreshToken({ userId }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Number(JWT_REFRESH_TTL_SEC);
  // Include jti so each refresh token is unique
  return new SignJWT({ sub: userId, typ: 'refresh', jti: newId() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(refreshKey());
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, accessKey());
  if (payload.typ !== 'access') throw new Error('Invalid token type');
  return payload;
}

export async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, refreshKey());
  if (payload.typ !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

export function refreshExpiryDate() {
  const ttl = Number(JWT_REFRESH_TTL_SEC);
  return new Date(Date.now() + ttl * 1000);
}
