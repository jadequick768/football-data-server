import React from 'react';

import type { UiLeagueBlock } from '@/lib/sportsrc';
import MatchCard from './MatchCard';

export default function LeagueSection({ block }: { block: UiLeagueBlock }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {block.leagueLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.leagueLogo} alt="" width={20} height={20} style={{ borderRadius: 6 }} />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: 6, background: '#111827', border: '1px solid #1F2937' }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, color: '#E5E7EB', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {block.leagueName}
            </div>
            {block.country ? <div style={{ fontSize: 11, color: '#6B7280' }}>{block.country}</div> : null}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{block.matches.length}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {block.matches.map((m) => (
          <MatchCard key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}
