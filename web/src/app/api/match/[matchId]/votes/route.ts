import { NextResponse } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.tintuc360.net').replace(/\/+$/, '');

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const upstream = `${API_BASE}/v1/matches/${encodeURIComponent(matchId)}/deep/votes`;

  const r = await fetch(upstream, { cache: 'no-store' });
  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      'content-type': r.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}
