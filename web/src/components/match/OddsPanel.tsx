'use client';

import React from 'react';

import Badge from '@/components/ui/Badge';

function pickOddsRows(raw: any): any[] {
  const d = raw?.data ?? raw;
  if (!d) return [];

  // Common patterns:
  // - data: { odds: [...] }
  // - data: [...]
  // - data: { bookmakers: [...] }
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.odds)) return d.odds;
  if (Array.isArray(d?.bookmakers)) return d.bookmakers;
  if (Array.isArray(d?.markets)) return d.markets;
  if (Array.isArray(d?.rows)) return d.rows;

  return [];
}

function formatCell(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '';
}

export default function OddsPanel({ matchId }: { matchId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [oddsRaw, setOddsRaw] = React.useState<any>(null);
  const [votesRaw, setVotesRaw] = React.useState<any>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [odds, votes] = await Promise.all([
        fetch(`/api/match/${encodeURIComponent(matchId)}/odds`).then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        }),
        fetch(`/api/match/${encodeURIComponent(matchId)}/votes`).then(async (r) => {
          if (!r.ok) return null;
          return r.json();
        }),
      ]);
      setOddsRaw(odds);
      setVotesRaw(votes);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const rows = pickOddsRows(oddsRaw);

  // Best-effort columns; adjust later once we lock schema
  const columns = [
    { key: 'bookmaker', label: 'Bookmaker' },
    { key: 'market', label: 'Market' },
    { key: 'home', label: 'Home' },
    { key: 'draw', label: 'Draw' },
    { key: 'away', label: 'Away' },
    { key: 'over', label: 'Over' },
    { key: 'under', label: 'Under' },
    { key: 'handicap', label: 'Handicap' },
    { key: 'updated', label: 'Updated' },
  ];

  function cell(row: any, key: string): string {
    // Try common nesting
    if (row?.[key] !== undefined) return formatCell(row[key]);

    const alt: Record<string, string[]> = {
      bookmaker: ['provider', 'site', 'name'],
      market: ['type', 'market_name', 'bet_type'],
      home: ['1', 'home_odds', 'odds_home'],
      draw: ['x', 'draw_odds', 'odds_draw'],
      away: ['2', 'away_odds', 'odds_away'],
      over: ['o', 'over_odds'],
      under: ['u', 'under_odds'],
      updated: ['ts', 'time', 'updated_at'],
    };

    for (const k of alt[key] ?? []) {
      if (row?.[k] !== undefined) return formatCell(row[k]);
    }

    // Sometimes odds are grouped
    if (row?.odds?.[key] !== undefined) return formatCell(row.odds[key]);
    if (row?.values?.[key] !== undefined) return formatCell(row.values[key]);

    return '';
  }

  return (
    <div
      style={{
        marginTop: 12,
        background: '#111827',
        border: '1px solid #1F2937',
        borderRadius: 16,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 950 }}>Odds</div>
        <button
          onClick={load}
          style={{
            border: '1px solid #1F2937',
            background: '#0B0F14',
            color: '#E5E7EB',
            padding: '6px 10px',
            borderRadius: 10,
            fontWeight: 900,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Reload
        </button>
      </div>

      {loading ? <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</div> : null}
      {error ? (
        <div style={{ color: '#FCA5A5', fontSize: 12, whiteSpace: 'pre-wrap' }}>{error}</div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>No odds data for this match.</div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      textAlign: 'left',
                      color: '#9CA3AF',
                      padding: '10px 10px',
                      borderBottom: '1px solid #1F2937',
                      position: 'sticky',
                      top: 0,
                      background: '#111827',
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1F2937' }}>
                  {columns.map((c) => {
                    const v = cell(r, c.key);
                    const tone = c.key === 'market' ? 'accent' : 'neutral';
                    return (
                      <td key={c.key} style={{ padding: '10px 10px', borderBottom: '1px solid #1F2937', color: '#E5E7EB' }}>
                        {c.key === 'market' && v ? <Badge tone={tone}>{v}</Badge> : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {votesRaw ? (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #1F2937' }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Votes</div>
          <pre style={{ margin: 0, color: '#9CA3AF', fontSize: 11, whiteSpace: 'pre-wrap' }}>{JSON.stringify(votesRaw?.data ?? votesRaw, null, 2).slice(0, 1200)}</pre>
        </div>
      ) : null}
    </div>
  );
}
