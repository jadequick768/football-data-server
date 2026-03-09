import Link from 'next/link';
import { cookies } from 'next/headers';

import LeagueSection from '@/components/matches/LeagueSection';
import { apiGet, type MatchStatus } from '@/lib/api';
import { getLocaleFromCookie, t } from '@/lib/i18n';
import { toUiLeagueBlocks, type MatchesResponse } from '@/lib/sportsrc';

function yyyyMmDd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractBlocks(res: any) {
  return toUiLeagueBlocks(res as MatchesResponse);
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

  const sections: { key: MatchStatus; label: string; blocks: ReturnType<typeof extractBlocks>; err?: string }[] = [
    { key: 'inprogress', label: t(locale, 'live'), blocks: extractBlocks(live), err: (live as any)?.__error },
    { key: 'upcoming', label: t(locale, 'upcoming'), blocks: extractBlocks(upcoming), err: (upcoming as any)?.__error },
    { key: 'finished', label: t(locale, 'finished'), blocks: extractBlocks(finished), err: (finished as any)?.__error },
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
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {s.blocks.reduce((acc, b) => acc + b.matches.length, 0)}
            </span>
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
          ) : s.blocks.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 12, padding: 8 }}>No matches</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {s.blocks.slice(0, 6).map((b) => (
                <LeagueSection key={b.leagueName} block={b} />
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
