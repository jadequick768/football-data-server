'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { apiPost } from '@/lib/api';

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ access_token: string }>(
        '/v1/auth/login',
        { email, password },
        { credentials: 'include' }
      );
      localStorage.setItem('access_token', res.access_token);
      router.push(next);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 16 }}>
      <h1 style={{ margin: '10px 0 16px', fontSize: 20 }}>Login</h1>

      <form
        onSubmit={submit}
        style={{
          background: '#111827',
          border: '1px solid #1F2937',
          borderRadius: 14,
          padding: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid #1F2937',
              background: '#0B0F14',
              color: '#fff',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid #1F2937',
              background: '#0B0F14',
              color: '#fff',
            }}
          />
        </label>

        {error ? (
          <div style={{ color: '#FCA5A5', fontSize: 12, whiteSpace: 'pre-wrap' }}>{error}</div>
        ) : null}

        <button
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            background: '#F5C400',
            color: '#0B0F14',
            fontWeight: 900,
            border: 0,
            cursor: 'pointer',
          }}
        >
          {loading ? '...' : 'Login'}
        </button>

        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          No account?{' '}
          <Link
            href={`/auth/register?next=${encodeURIComponent(next)}`}
            style={{ color: '#F5C400', textDecoration: 'none', fontWeight: 800 }}
          >
            Register
          </Link>
        </div>
      </form>
    </main>
  );
}
