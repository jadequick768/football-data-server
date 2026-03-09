import Link from 'next/link';
import { cookies } from 'next/headers';

import { apiGet } from '@/lib/api';
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
  leagueName?: string;
  scoreText?: string;
};

function extractMatches(res: any): NormalMatch[] {
  const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
  if (!data) return [];

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
          leagueName,
          scoreText: String(m?.score?.display ?? m?.score?.normal_time ?? ''),
        });
      }
    }
    return out;
  }

  return data
    .map((m: any) => {
      const id = String(m?.id ?? m?.match_id ?? m?.event_id ?? '');
      return {
        id,
        title: String(m?.title ?? m?.name ?? `Match ${id}`),
        leagueName: m?.league?.name,
        scoreText: String(m?.score?.display ?? ''),
      } as NormalMatch;
    })
    .filter((m: NormalMatch) => Boolean(m.id));
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string }> }) {
  const sp = await searchParams;
  const locale = getLocaleFromCookie((await cookies()).toString());

  const date = sp.date ?? yyyyMmDd();
  const status = (sp.status as any) ?? 'upcoming';

  const res = await apiGet<any>(`/v1/matches?date=${encodeURIComponent(date)}&status=${encodeURIComponent(status)}`)
    .catch((e) => ({ __error: String(e?.message ?? e) }));
  const matches = extractMatches(res);
  const err = (res as any)?.__error as string | undefined;

  const statuses: { key: string; label: string }[] = [
    { key: 'inprogress', label: t(locale, 'live') },
    { key: 'upcoming', label: t(locale, 'upcoming') },
    { key: 'finished', label: t(locale, 'finished') },
  ];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '10px 0 14px' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>{t(locale, 'schedule')}</h1>
        <div style={{ color: '#9CA3AF', fontSize: 12 }}>{date}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={`/schedule?date=${encodeURIComponent(date)}&status=${encodeURIComponent(s.key)}`}
            style={{
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid #1F2937',
              background: status === s.key ? '#F5C400' : '#111827',
              color: status === s.key ? '#0B0F14' : '#fff',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {err ? (
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
          {err}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {matches.map((m) => {
            return (
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
                  <div style={{ fontWeight: 900, color: '#E5E7EB' }}>{m.scoreText ?? ''}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                  {m.leagueName ? `${m.leagueName} · ` : ''}id: {m.id}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
