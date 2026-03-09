export type SportSrcLeague = {
  name?: string;
  country?: string;
  flag?: string;
  logo?: string;
};

export type SportSrcTeam = {
  name?: string;
  code?: string;
  color?: string;
  badge?: string;
};

export type SportSrcMatch = {
  id?: string;
  title?: string;
  timestamp?: number;
  status?: string;
  status_detail?: string;
  round?: string;
  teams?: { home?: SportSrcTeam; away?: SportSrcTeam };
  score?: {
    display?: string;
    normal_time?: string;
    current?: { home?: number; away?: number };
  };
};

export type SportSrcMatchesBlock = {
  league?: SportSrcLeague;
  matches?: SportSrcMatch[];
};

export type MatchesResponse = {
  success?: boolean;
  filters?: any;
  total_matches?: number;
  data?: SportSrcMatchesBlock[] | null;
  __error?: string;
};

export type UiMatch = {
  id: string;
  title: string;
  kickoff?: number;
  status?: string;
  statusDetail?: string;
  leagueName?: string;
  leagueLogo?: string;
  country?: string;
  homeName?: string;
  awayName?: string;
  homeBadge?: string;
  awayBadge?: string;
  scoreText?: string;
};

export type UiLeagueBlock = {
  leagueName: string;
  leagueLogo?: string;
  country?: string;
  matches: UiMatch[];
};

export function toUiLeagueBlocks(res: MatchesResponse): UiLeagueBlock[] {
  const blocks = Array.isArray(res?.data) ? res.data : [];

  return blocks
    .map((b) => {
      const leagueName = b?.league?.name ?? 'Unknown league';
      const leagueLogo = b?.league?.logo;
      const country = b?.league?.country;
      const matches = (b?.matches ?? [])
        .map((m) => {
          const id = String(m?.id ?? '');
          if (!id) return null;
          const home = m?.teams?.home;
          const away = m?.teams?.away;
          const scoreText = String(m?.score?.display ?? m?.score?.normal_time ?? '');
          const computedTitle = `${home?.name ?? ''} vs ${away?.name ?? ''}`.trim();
          return {
            id,
            title: String(m?.title ?? (computedTitle || `Match ${id}`)),
            kickoff: m?.timestamp,
            status: m?.status,
            statusDetail: m?.status_detail,
            leagueName,
            leagueLogo,
            country,
            homeName: home?.name,
            awayName: away?.name,
            homeBadge: home?.badge,
            awayBadge: away?.badge,
            scoreText,
          } as UiMatch;
        })
        .filter(Boolean) as UiMatch[];

      return { leagueName, leagueLogo, country, matches } as UiLeagueBlock;
    })
    .filter((b) => b.matches.length > 0);
}

export function flattenUiMatches(blocks: UiLeagueBlock[]): UiMatch[] {
  return blocks.flatMap((b) => b.matches);
}
