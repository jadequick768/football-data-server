import Link from 'next/link';
import { cookies } from 'next/headers';

import { apiGet, type MatchStatus } from '@/lib/api';
import { getLocaleFromCookie, t } from '@/lib/i18n';

function yyyyMmDd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type NormalMatch = {
  id: string;
  title: string;
  status?: string;
  leagueName?: string;
  scoreText?: string;
};

function extractMatches(res: any): NormalMatch[] {
  const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
  if (!data) return [];

  // SportSRC often returns: data: [{ league: {...}, matches: [...] }, ...]
  if (data.length && data[0]?.matches && Array.isArray(data[0].matches)) {
    const out: NormalMatch[] = [];
    for (const block of data) {
      const leagueName = block?.league?.name;
      for (const m of block.matches ?? []) {
        const id = String(m?.id ?? '');
        if (!id) continue;
        out.push({
          id,
          title: String(m?.title ?? `Match ${id}`),
          status: m?.status,
          leagueName,
          scoreText: String(m?.score?.display ?? m?.score?.normal_time ?? ''),
        });
      }
    }
    return out;
  }

  // fallback: already a flat list
  return data
    .map((m: any) => {
      const id = String(m?.id ?? m?.match_id ?? m?.event_id ?? '');
      return {
        id,
        title: String(m?.title ?? m?.name ?? `Match ${id}`),
        status: m?.status,
        leagueName: m?.league?.name,
        scoreText: String(m?.score?.display ?? ''),
      } as NormalMatch;
    })
    .filter((m: NormalMatch) => Boolean(m.id));
}

async function load(date: string, status: MatchStatus) {
  return apiGet<any>(`/v1/matches?date=${encodeURIComponent(date)}&status=${encodeURIComponent(status)}`);
}

export default async function TodayHub() {
  const locale = getLocaleFromCookie((await cookies()).toString());
  const date = yyyyMmDd();

  const [live, upcoming, finished] = await Promise.all([
    load(date, 'inprogress').catch((e) => ({ __error: String(e?.message ?? e) })),
    load(date, 'upcoming').catch((e) => ({ __error: String(e?.message ?? e) })),
    load(date, 'finished').catch((e) => ({ __error: String(e?.message ?? e) })),
  ]);

  const sections: { key: MatchStatus; label: string; data: any[]; err?: string }[] = [
    { key: 'inprogress', label: t(locale, 'live'), data: extractMatches(live), err: (live as any)?.__error },
    { key: 'upcoming', label: t(locale, 'upcoming'), data: extractMatches(upcoming), err: (upcoming as any)?.__error },
    { key: 'finished', label: t(locale, 'finished'), data: extractMatches(finished), err: (finished as any)?.__error },
  ];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '10px 0 14px' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{t(locale, 'today')}</h1>
        <Link href={`/schedule?date=${date}`} style={{ color: '#F5C400', textDecoration: 'none', fontWeight: 800 }}>
          {t(locale, 'schedule')} →
        </Link>
      </div>

      {sections.map((s) => (
        <section key={s.key} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, color: '#E5E7EB' }}>{s.label}</h2>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{s.data.length}</span>
          </div>

          {s.err ? (
            <div
              style={{
                background: '#111827',
                border: '1px solid #7f1d1d',
                borderRadius: 14,
                padding: 12,
                color: '#FCA5A5',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
              }}
            >
              {s.err}
            </div>
          ) : s.data.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 12, padding: 8 }}>No matches</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {s.data.slice(0, 30).map((m) => (
                <Link
                  key={m.id}
                  href={`/match/${encodeURIComponent(m.id)}`}
                  style={{
                    textDecoration: 'none',
                    background: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: 14,
                    padding: 12,
                    color: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: 800 }}>{m.title}</div>
                    <div style={{ fontWeight: 900, color: s.key === 'inprogress' ? '#22C55E' : '#E5E7EB' }}>{m.scoreText ?? ''}</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                    {m.leagueName ? `${m.leagueName} · ` : ''}id: {m.id}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
