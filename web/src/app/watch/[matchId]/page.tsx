import { headers } from 'next/headers';

type Params = { matchId: string };

type StreamResult = {
  match_id: string;
  streams: unknown;
  detail?: any;
};

function pickFirstUrl(streams: any): string | null {
  if (!streams) return null;
  if (typeof streams === 'string') return streams;

  // Common patterns: array of urls/objects
  if (Array.isArray(streams)) {
    for (const s of streams) {
      const u = pickFirstUrl(s);
      if (u) return u;
    }
  }

  if (typeof streams === 'object') {
    // try common keys
    for (const key of ['url', 'embed', 'src', 'stream_url', 'link']) {
      if (typeof streams[key] === 'string') return streams[key];
    }

    // fallback: any string value
    for (const v of Object.values(streams)) {
      const u = pickFirstUrl(v);
      if (u) return u;
    }
  }

  return null;
}

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { matchId } = await params;
  const h = await headers();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    return (
      <main style={{ padding: 16, fontFamily: 'system-ui' }}>
        Missing NEXT_PUBLIC_API_BASE_URL
      </main>
    );
  }

  const url = `${apiBase.replace(/\/$/, '')}/v1/matches/${encodeURIComponent(matchId)}/streams`;

  const res = await fetch(url, {
    // avoid caching on CDN; we want fresh-ish
    cache: 'no-store',
    headers: {
      // pass user agent / accept-language to help providers sometimes
      'accept-language': h.get('accept-language') ?? 'vi',
      'user-agent': h.get('user-agent') ?? 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return (
      <main style={{ padding: 16, fontFamily: 'system-ui' }}>
        <h2>Failed to load stream</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      </main>
    );
  }

  const data = (await res.json()) as StreamResult;
  const streamUrl = pickFirstUrl(data.streams);

  if (!streamUrl) {
    return (
      <main style={{ padding: 16, fontFamily: 'system-ui' }}>
        <h2>No stream URL found for match {matchId}</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.streams, null, 2)}</pre>
      </main>
    );
  }

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <iframe
        src={streamUrl}
        width="100%"
        height="100%"
        frameBorder={0}
        scrolling="no"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </main>
  );
}
