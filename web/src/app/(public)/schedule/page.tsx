import Link from 'next/link';
import { cookies } from 'next/headers';

import LeagueSection from '@/components/matches/LeagueSection';
import { apiGet } from '@/lib/api';
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

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string }> }) {
  const sp = await searchParams;
  const locale = getLocaleFromCookie((await cookies()).toString());

  const date = sp.date ?? yyyyMmDd();
  const status = (sp.status as any) ?? 'upcoming';

  const res = await apiGet<any>(`/v1/matches?date=${encodeURIComponent(date)}&status=${encodeURIComponent(status)}`)
    .catch((e) => ({ __error: String(e?.message ?? e) }));
  const blocks = extractBlocks(res);
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
      ) : blocks.length === 0 ? (
        <div style={{ color: '#9CA3AF', fontSize: 12, padding: 8 }}>No matches</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {blocks.map((b) => (
            <LeagueSection key={b.leagueName} block={b} />
          ))}
        </div>
      )}
    </main>
  );
}
