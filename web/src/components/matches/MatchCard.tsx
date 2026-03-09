import Link from 'next/link';
import React from 'react';

import Badge from '@/components/ui/Badge';
import { formatKickoff } from '@/lib/format';
import type { UiMatch } from '@/lib/sportsrc';

function statusTone(status?: string) {
  if (status === 'inprogress') return 'live' as const;
  if (status === 'finished') return 'neutral' as const;
  return 'accent' as const;
}

export default function MatchCard({ m }: { m: UiMatch }) {
  return (
    <Link
      href={`/match/${encodeURIComponent(m.id)}`}
      style={{
        textDecoration: 'none',
        background: 'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(13,18,28,1) 100%)',
        border: '1px solid #1F2937',
        borderRadius: 16,
        padding: 12,
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {m.homeBadge ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.homeBadge} alt="" width={18} height={18} style={{ borderRadius: 999 }} />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: 999, background: '#111827', border: '1px solid #1F2937' }} />
              )}
              <span style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.homeName ?? 'Home'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {m.awayBadge ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.awayBadge} alt="" width={18} height={18} style={{ borderRadius: 999 }} />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: 999, background: '#111827', border: '1px solid #1F2937' }} />
              )}
              <span style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.awayName ?? 'Away'}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'grid', gap: 6, flexShrink: 0 }}>
          <div style={{ fontWeight: 950, fontSize: 16, color: m.status === 'inprogress' ? '#22C55E' : '#E5E7EB' }}>
            {m.scoreText || formatKickoff(m.kickoff)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Badge tone={statusTone(m.status)}>{(m.status ?? 'upcoming').toUpperCase()}</Badge>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {m.leagueName ? (
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{m.leagueName}</span>
        ) : null}
        <span style={{ fontSize: 12, color: '#6B7280' }}>#{m.id}</span>
      </div>
    </Link>
  );
}
