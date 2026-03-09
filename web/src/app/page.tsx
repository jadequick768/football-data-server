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

function score(m: any): string {
  const sh = m?.score_home ?? m?.home_score ?? m?.scores?.home;
  const sa = m?.score_away ?? m?.away_score ?? m?.scores?.away;
  if (sh !== undefined && sa !== undefined) return `${sh}-${sa}`;
  return '';
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {s.data.slice(0, 20).map((m) => {
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontWeight: 800 }}>{title(m)}</div>
                      <div style={{ fontWeight: 900, color: s.key === 'inprogress' ? '#22C55E' : '#E5E7EB' }}>{score(m)}</div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>id: {id}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
