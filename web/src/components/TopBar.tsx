'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { LOCALES, type Locale, t } from '@/lib/i18n';

function getLocaleClient(): Locale {
  if (typeof document === 'undefined') return 'vi';
  const m = document.cookie.match(/(?:^|; )locale=(vi|en)(?:;|$)/);
  return (m?.[1] as Locale) ?? 'vi';
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const [locale, setLocale] = React.useState<Locale>('vi');
  React.useEffect(() => setLocale(getLocaleClient()), []);

  function setCookieLocale(l: Locale) {
    document.cookie = `locale=${l}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    setLocale(l);
    router.refresh();
  }

  const nav = [
    { href: '/', key: 'today' as const },
    { href: '/schedule', key: 'schedule' as const },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(11,15,20,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1F2937' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', gap: 12, maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: '#F5C400' }} />
          <strong style={{ color: '#fff' }}>Live Bóng Đá</strong>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  color: active ? '#0B0F14' : '#E5E7EB',
                  background: active ? '#F5C400' : 'transparent',
                  border: '1px solid #1F2937',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {t(locale, n.key)}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setCookieLocale(l.code)}
              style={{
                border: '1px solid #1F2937',
                background: locale === l.code ? '#111827' : 'transparent',
                color: '#E5E7EB',
                padding: '6px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {l.label}
            </button>
          ))}
          <Link
            href={`/auth/login?next=${encodeURIComponent(pathname + (sp?.toString() ? `?${sp.toString()}` : ''))}`}
            style={{
              border: '1px solid #1F2937',
              background: '#111827',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            {t(locale, 'login')}
          </Link>
        </div>
      </div>
    </header>
  );
}
