import React from 'react';

export default function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'live' | 'danger' | 'accent';
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { background: '#0B0F14', borderColor: '#1F2937', color: '#E5E7EB' },
    live: { background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.35)', color: '#86EFAC' },
    danger: { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)', color: '#FCA5A5' },
    accent: { background: 'rgba(245,196,0,0.12)', borderColor: 'rgba(245,196,0,0.35)', color: '#FDE68A' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 800,
        padding: '4px 8px',
        borderRadius: 999,
        border: '1px solid',
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}
