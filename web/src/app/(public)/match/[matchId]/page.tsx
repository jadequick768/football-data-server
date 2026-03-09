import Link from 'next/link';
import { cookies } from 'next/headers';

import { apiGet } from '@/lib/api';
import { getLocaleFromCookie, t } from '@/lib/i18n';

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const locale = getLocaleFromCookie((await cookies()).toString());

  const detail = await apiGet<any>(`/v1/matches/${encodeURIComponent(matchId)}`);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'lineups', label: 'Lineups', deep: 'lineups' },
    { key: 'stats', label: 'Stats', deep: 'stats' },
    { key: 'incidents', label: 'Timeline', deep: 'incidents' },
    { key: 'odds', label: 'Odds', deep: 'odds' },
    { key: 'votes', label: 'Votes', deep: 'votes' },
    { key: 'shotmap', label: 'Shotmap', deep: 'shotmap' },
    { key: 'h2h', label: 'H2H', deep: 'h2h' },
    { key: 'standing', label: 'Standing', deep: 'standing' },
    { key: 'last_matches', label: 'Last matches', deep: 'last_matches' },
  ];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '10px 0 12px' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>{t(locale, 'matchCenter')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/watch/${encodeURIComponent(matchId)}`}
            style={{
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 12,
              background: '#1d4ed8',
              color: '#fff',
              fontWeight: 900,
            }}
          >
            {t(locale, 'watch')}
          </Link>
        </div>
      </div>

      <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>matchId: {matchId}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.deep ? `/match/${encodeURIComponent(matchId)}?tab=${tab.deep}` : `/match/${encodeURIComponent(matchId)}`}
              style={{
                textDecoration: 'none',
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #1F2937',
                background: '#0B0F14',
                color: '#E5E7EB',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#0B0F14', border: '1px solid #1F2937', borderRadius: 14, padding: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: '#E5E7EB' }}>Detail (raw JSON)</h2>
        <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', color: '#D1D5DB', fontSize: 12 }}>{JSON.stringify(detail, null, 2)}</pre>
      </div>
    </main>
  );
}
