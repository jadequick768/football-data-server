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

function extractMatches(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.matches)) return res.matches;
  return [];
}

function getId(m: any): string {
  return String(m?.id ?? m?.match_id ?? m?.event_id ?? '');
}

function teamName(t: any): string {
  return t?.name ?? t?.short_name ?? t?.title ?? String(t ?? '');
}

function title(m: any): string {
  const home = teamName(m?.home ?? m?.home_team);
  const away = teamName(m?.away ?? m?.away_team);
  if (home && away && home !== '[object Object]' && away !== '[object Object]') return `${home} vs ${away}`;
  return m?.name ?? m?.title ?? `Match ${getId(m)}`;
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string }> }) {
  const sp = await searchParams;
  const locale = getLocaleFromCookie((await cookies()).toString());

  const date = sp.date ?? yyyyMmDd();
  const status = (sp.status as any) ?? 'upcoming';

  const res = await apiGet<any>(`/v1/matches?date=${encodeURIComponent(date)}&status=${encodeURIComponent(status)}`);
  const matches = extractMatches(res);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {matches.map((m) => {
          const id = getId(m);
          return (
            <Link
              key={id}
              href={`/match/${encodeURIComponent(id)}`}
              style={{
                textDecoration: 'none',
                background: '#111827',
                border: '1px solid #1F2937',
                borderRadius: 14,
                padding: 12,
                color: '#fff',
              }}
            >
              <div style={{ fontWeight: 800 }}>{title(m)}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>id: {id}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
