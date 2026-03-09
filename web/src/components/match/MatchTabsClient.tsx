'use client';

import React from 'react';

import OddsPanel from '@/components/match/OddsPanel';
import type { MatchDetail } from '@/lib/detail';

type Tab = 'stream' | 'overview' | 'timeline' | 'lineups' | 'stats' | 'odds' | 'h2h' | 'standing';

export default function MatchTabsClient({ detail }: { detail: MatchDetail }) {
  const [tab, setTab] = React.useState<Tab>('stream');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stream', label: 'Stream' },
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'lineups', label: 'Lineups' },
    { key: 'stats', label: 'Stats' },
    { key: 'odds', label: 'Odds' },
    { key: 'h2h', label: 'H2H' },
    { key: 'standing', label: 'Standing' },
  ];

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: '1px solid #1F2937',
              background: tab === t.key ? '#F5C400' : '#111827',
              color: tab === t.key ? '#0B0F14' : '#E5E7EB',
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stream' ? (
        <div
          style={{
            marginTop: 12,
            border: '1px solid #1F2937',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#000',
            height: '65vh',
            minHeight: 420,
          }}
        >
          <iframe
            src={`/watch/${encodeURIComponent(detail.id)}`}
            width="100%"
            height="100%"
            frameBorder={0}
            scrolling="no"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        </div>
      ) : tab === 'odds' ? (
        <OddsPanel matchId={detail.id} />
      ) : (
        <div
          style={{
            marginTop: 12,
            background: '#111827',
            border: '1px solid #1F2937',
            borderRadius: 16,
            padding: 12,
            color: '#E5E7EB',
          }}
        >
          <div style={{ fontWeight: 950, marginBottom: 8 }}>{tab.toUpperCase()}</div>
          <div style={{ color: '#9CA3AF', fontSize: 13 }}>
            Tab này mình sẽ render dạng bảng/thông tin thể thao từ endpoints deep tương ứng (incidents/lineups/stats/h2h/standing).
          </div>
        </div>
      )}
    </div>
  );
}
