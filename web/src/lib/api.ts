export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.tintuc360.net').replace(/\/+$/, '');

export type MatchStatus = 'inprogress' | 'upcoming' | 'finished';

export async function apiGet<T>(path: string, opts?: { token?: string; credentials?: RequestCredentials }) {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        ...(opts?.token ? { authorization: `Bearer ${opts.token}` } : {}),
      },
      credentials: opts?.credentials,
      cache: 'no-store',
    });
  } catch (e: any) {
    throw new Error(`fetch failed: ${url} :: ${String(e?.message ?? e)}`);
  }
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: any, opts?: { credentials?: RequestCredentials }) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: opts?.credentials,
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiDelete<T>(path: string, body: any, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}
