import { safeText } from './format';

export type MatchDetail = {
  id: string;
  title: string;
  status?: string;
  statusDetail?: string;
  kickoff?: number;
  leagueName?: string;
  leagueLogo?: string;
  round?: string;
  homeName?: string;
  awayName?: string;
  homeBadge?: string;
  awayBadge?: string;
  scoreDisplay?: string;
  period1?: string;
  period2?: string;
  venueName?: string;
  venueCity?: string;
  refereeName?: string;
};

export function normalizeDetail(raw: any, matchId: string): MatchDetail {
  const d = raw?.data ?? raw;
  const mi = d?.match_info ?? d?.match ?? d?.matchInfo ?? d;
  const teams = mi?.teams ?? {};
  const home = teams?.home ?? mi?.home ?? {};
  const away = teams?.away ?? mi?.away ?? {};
  const score = mi?.score ?? d?.score ?? {};
  const info = mi?.info ?? d?.info ?? {};
  const venue = info?.venue ?? mi?.venue ?? {};
  const referee = info?.referee ?? mi?.referee ?? {};
  const league = mi?.league ?? d?.league ?? {};

  return {
    id: safeText(mi?.id) || matchId,
    title: safeText(mi?.title) || safeText(d?.title) || `Match ${matchId}`,
    kickoff: typeof mi?.timestamp === 'number' ? mi.timestamp : typeof d?.timestamp === 'number' ? d.timestamp : undefined,
    status: safeText(mi?.status),
    statusDetail: safeText(mi?.status_detail) || safeText(mi?.statusDetail),
    leagueName: safeText(league?.name),
    leagueLogo: safeText(league?.logo),
    round: safeText(mi?.round),
    homeName: safeText(home?.name),
    awayName: safeText(away?.name),
    homeBadge: safeText(home?.badge),
    awayBadge: safeText(away?.badge),
    scoreDisplay: safeText(score?.display) || safeText(score?.normal_time),
    period1: safeText(score?.period_1),
    period2: safeText(score?.period_2),
    venueName: safeText(venue?.stadium) || safeText(venue?.name),
    venueCity: safeText(venue?.city),
    refereeName: safeText(referee?.name),
  };
}
