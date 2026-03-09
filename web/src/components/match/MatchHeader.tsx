import React from 'react';

import Badge from '@/components/ui/Badge';
import { formatKickoff } from '@/lib/format';
import type { MatchDetail } from '@/lib/detail';

function tone(status?: string) {
  if (status === 'inprogress') return 'live' as const;
  if (status === 'finished') return 'neutral' as const;
  return 'accent' as const;
}

export default function MatchHeader({ d }: { d: MatchDetail }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(13,18,28,1) 100%)',
        border: '1px solid #1F2937',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {d.leagueLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.leagueLogo} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.leagueName || 'League'}
                {d.round ? ` · ${d.round}` : ''}
              </div>
              <div style={{ fontWeight: 950, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {d.homeBadge ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.homeBadge} alt="" width={22} height={22} style={{ borderRadius: 999 }} />
                ) : null}
                <div style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.homeName || 'Home'}</div>
              </div>
              <div style={{ fontWeight: 950, fontSize: 18, color: d.status === 'inprogress' ? '#22C55E' : '#E5E7EB' }}>
                {d.scoreDisplay || (d.kickoff ? formatKickoff(d.kickoff) : '')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {d.awayBadge ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.awayBadge} alt="" width={22} height={22} style={{ borderRadius: 999 }} />
                ) : null}
                <div style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.awayName || 'Away'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge tone={tone(d.status)}>{(d.status ?? 'upcoming').toUpperCase()}</Badge>
                {d.statusDetail ? <span style={{ fontSize: 12, color: '#9CA3AF' }}>{d.statusDetail}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#9CA3AF' }}>
        {d.period1 ? <span>HT: {d.period1}</span> : null}
        {d.period2 ? <span>2H: {d.period2}</span> : null}
        {d.venueName ? <span>🏟 {d.venueName}{d.venueCity ? `, ${d.venueCity}` : ''}</span> : null}
        {d.refereeName ? <span>👤 {d.refereeName}</span> : null}
      </div>
    </div>
  );
}
