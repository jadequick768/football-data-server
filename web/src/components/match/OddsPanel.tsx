'use client';

import React from 'react';

import Badge from '@/components/ui/Badge';

type Choice = {
  name?: string;
  fraction?: string;
  decimal?: number;
  trend?: string;
  updated_at?: string;
  updatedAt?: string;
  [k: string]: any;
};

type Market = {
  market_id?: number;
  market_name?: string;
  name?: string;
  is_live?: boolean;
  suspended?: boolean;
  choices?: Choice[];
  updated_at?: string;
  updatedAt?: string;
  [k: string]: any;
};

type Bookmaker = {
  bookmaker_id?: number;
  bookmaker_name?: string;
  name?: string;
  markets?: Market[];
  updated_at?: string;
  updatedAt?: string;
  [k: string]: any;
};

function toBookmakers(raw: any): Bookmaker[] {
  const d = raw?.data ?? raw;
  if (!d) return [];

  // Patterns we have seen / might see
  // - { bookmaker_id, bookmaker_name, markets: [...] }
  // - [{...bookmaker}, ...]
  // - { bookmakers: [...] }
  if (Array.isArray(d)) return d as Bookmaker[];
  if (Array.isArray(d?.bookmakers)) return d.bookmakers as Bookmaker[];
  if (Array.isArray(d?.odds)) return d.odds as Bookmaker[];
  if (Array.isArray(d?.markets)) return [{ bookmaker_name: d?.bookmaker_name ?? d?.name ?? 'Bookmaker', markets: d.markets }];

  if (typeof d === 'object' && (d.bookmaker_id || d.bookmaker_name || d.markets)) return [d as Bookmaker];

  return [];
}

function labelBookmaker(b: Bookmaker): string {
  return String(b.bookmaker_name ?? b.name ?? b.bookmaker_id ?? 'Bookmaker');
}

function fmtOdd(v: any): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2).replace(/\.00$/, '') : '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

function pickChoiceOdd(c: Choice): string {
  // Prefer decimal if present
  if (typeof c?.decimal === 'number') return fmtOdd(c.decimal);
  if (c?.fraction) return String(c.fraction);
  if (c?.odd) return fmtOdd(c.odd);
  if (c?.odds) return fmtOdd(c.odds);
  if (c?.value) return fmtOdd(c.value);
  return '—';
}

function normName(x: any): string {
  return String(x ?? '').trim();
}

function is1x2Market(m: Market): boolean {
  const names = (m?.choices ?? []).map((c) => normName(c?.name)).filter(Boolean);
  const set = new Set(names.map((s) => s.toUpperCase()));
  return set.has('1') && (set.has('X') || set.has('DRAW')) && set.has('2');
}

function isOuMarket(m: Market): boolean {
  const names = (m?.choices ?? []).map((c) => normName(c?.name)).filter(Boolean);
  return names.some((n) => /^O\b|^OVER\b/i.test(n)) && names.some((n) => /^U\b|^UNDER\b/i.test(n));
}

function isHandicapMarket(m: Market): boolean {
  const title = normName(m?.market_name ?? m?.name).toLowerCase();
  if (title.includes('handicap') || title.includes('asian')) return true;
  // fallback: choices like "1 (-0.25)" / "2 (+0.25)" etc.
  const names = (m?.choices ?? []).map((c) => normName(c?.name)).filter(Boolean);
  return names.some((n) => /\(|\+|\-|\d+\.\d+/.test(n)) && names.some((n) => /^1\b/i.test(n)) && names.some((n) => /^2\b/i.test(n));
}

function splitPeriods(markets: Market[]): { ht: Market[]; ft: Market[]; other: Market[] } {
  const ht: Market[] = [];
  const ft: Market[] = [];
  const other: Market[] = [];

  for (const m of markets) {
    const title = normName(m?.market_name ?? m?.name).toLowerCase();
    // Best-effort period detection
    if (title.includes('1st') || title.includes('first half') || title.includes('half 1') || title.includes('hiệp 1')) ht.push(m);
    else if (title.includes('full') || title.includes('toàn trận') || title.includes('match') || title.includes('ft')) ft.push(m);
    else other.push(m);
  }

  // If nothing classified, treat all as FT
  if (!ht.length && !ft.length && other.length) {
    return { ht: [], ft: other, other: [] };
  }

  return { ht, ft, other };
}

function pickTop2(lines: { label: string; left?: string; mid?: string; right?: string }[]) {
  const out = lines.filter((x) => x.left || x.mid || x.right);
  if (!out.length) return [
    { label: '', left: '—', mid: '—', right: '—' },
    { label: '', left: '—', mid: '—', right: '—' },
  ];
  if (out.length === 1) return [out[0], { label: '', left: '—', mid: '—', right: '—' }];
  return out.slice(0, 2);
}

function mapHandicap(m: Market) {
  // We try to render as: leftOdd | line | rightOdd
  const choices = m?.choices ?? [];
  const lines: { label: string; left?: string; mid?: string; right?: string }[] = [];

  // Group by line extracted from "name" or "handicap" fields
  function extractLine(n: string) {
    const m = n.match(/\(([^)]+)\)/);
    if (m?.[1]) return m[1];
    const m2 = n.match(/([+-]?\d+(?:\.\d+)?)/);
    return m2?.[1] ?? '';
  }

  const byLine = new Map<string, { home?: Choice; away?: Choice }>();
  for (const c of choices) {
    const n = normName(c?.name);
    const line = extractLine(n);
    if (!line) continue;
    const key = line;
    const cur = byLine.get(key) ?? {};
    if (/^1\b/i.test(n) || /home|chủ/i.test(n)) cur.home = c;
    else if (/^2\b/i.test(n) || /away|khách/i.test(n)) cur.away = c;
    byLine.set(key, cur);
  }

  for (const [line, v] of byLine.entries()) {
    lines.push({ label: '', left: v.home ? pickChoiceOdd(v.home) : '—', mid: line, right: v.away ? pickChoiceOdd(v.away) : '—' });
  }

  return pickTop2(lines);
}

function mapOu(m: Market) {
  const choices = m?.choices ?? [];
  const lines: { label: string; left?: string; mid?: string; right?: string }[] = [];

  function extractLine(n: string) {
    const m = n.match(/\b(\d+(?:\.\d+)?)\b/);
    return m?.[1] ?? '';
  }

  const byLine = new Map<string, { over?: Choice; under?: Choice }>();
  for (const c of choices) {
    const n = normName(c?.name);
    const line = extractLine(n);
    const key = line || '—';
    const cur = byLine.get(key) ?? {};
    if (/^O\b|^OVER\b/i.test(n)) cur.over = c;
    if (/^U\b|^UNDER\b/i.test(n)) cur.under = c;
    byLine.set(key, cur);
  }

  for (const [line, v] of byLine.entries()) {
    lines.push({ label: '', left: v.over ? pickChoiceOdd(v.over) : '—', mid: line === '—' ? 'O/U' : line, right: v.under ? pickChoiceOdd(v.under) : '—' });
  }

  return pickTop2(lines);
}

function map1x2(m: Market) {
  const choices = m?.choices ?? [];
  const c1 = choices.find((c) => normName(c?.name).toUpperCase() === '1');
  const cx = choices.find((c) => {
    const n = normName(c?.name).toUpperCase();
    return n === 'X' || n === 'DRAW';
  });
  const c2 = choices.find((c) => normName(c?.name).toUpperCase() === '2');
  return {
    home: c1 ? pickChoiceOdd(c1) : '—',
    away: c2 ? pickChoiceOdd(c2) : '—',
    draw: cx ? pickChoiceOdd(cx) : '—',
  };
}

function MarketGrid({ title, markets }: { title: string; markets: Market[] }) {
  const handicap = markets.find(isHandicapMarket);
  const ou = markets.find(isOuMarket);
  const oneXTwo = markets.find(is1x2Market);

  const hLines = handicap ? mapHandicap(handicap) : pickTop2([]);
  const ouLines = ou ? mapOu(ou) : pickTop2([]);
  const x12 = oneXTwo ? map1x2(oneXTwo) : { home: '—', away: '—', draw: '—' };

  const boxBg = '#141E30';
  const boxBorder = '#22314A';

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ fontWeight: 950 }}>{title}</div>
        <Badge tone="neutral">Odds</Badge>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }}
      >
        {/* Handicap */}
        <div style={{ background: boxBg, border: `1px solid ${boxBorder}`, borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Cược chấp</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[0].left}</div>
            <div style={{ color: '#E5E7EB', opacity: 0.9, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[0].mid}</div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[0].right}</div>
          </div>
          <div style={{ height: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', opacity: 0.95 }}>
            <div style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[1].left}</div>
            <div style={{ color: '#E5E7EB', opacity: 0.9, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[1].mid}</div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{hLines[1].right}</div>
          </div>
        </div>

        {/* O/U */}
        <div style={{ background: boxBg, border: `1px solid ${boxBorder}`, borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Tài/Xỉu</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[0].left}</div>
            <div style={{ color: '#E5E7EB', opacity: 0.9, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[0].mid}</div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[0].right}</div>
          </div>
          <div style={{ height: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', opacity: 0.95 }}>
            <div style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[1].left}</div>
            <div style={{ color: '#E5E7EB', opacity: 0.9, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[1].mid}</div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>{ouLines[1].right}</div>
          </div>
        </div>

        {/* 1x2 */}
        <div style={{ background: boxBg, border: `1px solid ${boxBorder}`, borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900, marginBottom: 8, textAlign: 'right' }}>1x2</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900 }}>Chủ</div>
            <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900, textAlign: 'center' }}>Khách</div>
            <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900, textAlign: 'right' }}>Hòa</div>

            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 950 }}>{x12.home}</div>
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 950, textAlign: 'center' }}>{x12.away}</div>
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 950, textAlign: 'right' }}>{x12.draw}</div>

            <div style={{ opacity: 0.4 }}>—</div>
            <div style={{ opacity: 0.4, textAlign: 'center' }}>—</div>
            <div style={{ opacity: 0.4, textAlign: 'right' }}>—</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OddsPanel({ matchId }: { matchId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [oddsRaw, setOddsRaw] = React.useState<any>(null);
  const [votesRaw, setVotesRaw] = React.useState<any>(null);
  const [selected, setSelected] = React.useState<string>('');

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

  const bookmakers = toBookmakers(oddsRaw);
  React.useEffect(() => {
    if (!bookmakers.length) return;
    const labels = bookmakers.map(labelBookmaker);
    if (!selected || !labels.includes(selected)) setSelected(labels[0]);
  }, [bookmakers, selected]);

  const b = bookmakers.find((x) => labelBookmaker(x) === selected) ?? bookmakers[0];
  const markets = (b?.markets ?? []) as Market[];
  const periods = splitPeriods(markets);

  return (
    <div
      style={{
        marginTop: 12,
        background: '#0F1623',
        border: '1px solid #1F2937',
        borderRadius: 16,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 950 }}>Bảng kèo</div>
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
      {error ? <div style={{ color: '#FCA5A5', fontSize: 12, whiteSpace: 'pre-wrap' }}>{error}</div> : null}

      {!loading && !error && bookmakers.length === 0 ? (
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>Chưa có kèo cho trận này.</div>
      ) : null}

      {!loading && !error && bookmakers.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 900 }}>Bookmaker</div>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                background: '#0B0F14',
                border: '1px solid #1F2937',
                color: '#E5E7EB',
                padding: '8px 10px',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 12,
                minWidth: 180,
              }}
            >
              {bookmakers.map((x) => {
                const lbl = labelBookmaker(x);
                return (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                );
              })}
            </select>
            <Badge tone="neutral">{(b?.markets?.length ?? 0).toString()} markets</Badge>
          </div>

          {periods.ht.length ? <MarketGrid title="Hiệp 1" markets={periods.ht} /> : null}
          {periods.ft.length ? <MarketGrid title="Toàn trận" markets={periods.ft} /> : null}

          {/* If still has other markets, show in FT block to keep UX simple */}
          {!periods.ft.length && periods.other.length ? <MarketGrid title="Toàn trận" markets={periods.other} /> : null}

          {votesRaw ? (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #1F2937' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Votes (debug)</div>
              <pre style={{ margin: 0, color: '#9CA3AF', fontSize: 11, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(votesRaw?.data ?? votesRaw, null, 2).slice(0, 1200)}
              </pre>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
