import { cookies } from 'next/headers';

import MatchHeader from '@/components/match/MatchHeader';
import MatchTabsClient from '@/components/match/MatchTabsClient';
import { apiGet } from '@/lib/api';
import { normalizeDetail } from '@/lib/detail';
import { getLocaleFromCookie, t } from '@/lib/i18n';

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const locale = getLocaleFromCookie((await cookies()).toString());

  const raw = await apiGet<any>(`/v1/matches/${encodeURIComponent(matchId)}`).catch((e) => ({ __error: String(e?.message ?? e) }));
  const err = (raw as any)?.__error as string | undefined;

  if (err) {
    return (
      <main style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
        <h1 style={{ margin: '10px 0 12px', fontSize: 18 }}>{t(locale, 'matchCenter')}</h1>
        <div style={{ background: '#111827', border: '1px solid #7f1d1d', borderRadius: 16, padding: 12, color: '#FCA5A5', whiteSpace: 'pre-wrap' }}>{err}</div>
      </main>
    );
  }

  const detail = normalizeDetail(raw, matchId);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '10px 0 12px' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>{t(locale, 'matchCenter')}</h1>
      </div>

      <MatchHeader d={detail} />
      <MatchTabsClient detail={detail} />
    </main>
  );
}
