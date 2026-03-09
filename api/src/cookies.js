const {
  COOKIE_DOMAIN = '.tintuc360.net',
  COOKIE_SECURE = 'true',
} = process.env;

export function setRefreshCookie(reply, token) {
  // Fastify reply.setCookie requires plugin; we keep it manual via header.
  const secure = String(COOKIE_SECURE).toLowerCase() === 'true';
  const parts = [
    `refresh_token=${encodeURIComponent(token)}`,
    'Path=/v1/auth',
    'HttpOnly',
    'SameSite=None',
    `Domain=${COOKIE_DOMAIN}`,
    `Max-Age=${30 * 24 * 60 * 60}`,
  ];
  if (secure) parts.push('Secure');
  reply.header('Set-Cookie', parts.join('; '));
}

export function clearRefreshCookie(reply) {
  const secure = String(COOKIE_SECURE).toLowerCase() === 'true';
  const parts = [
    `refresh_token=`,
    'Path=/v1/auth',
    'HttpOnly',
    'SameSite=None',
    `Domain=${COOKIE_DOMAIN}`,
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  reply.header('Set-Cookie', parts.join('; '));
}

export function getRefreshCookie(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  const m = cookie.match(/(?:^|; )refresh_token=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}
