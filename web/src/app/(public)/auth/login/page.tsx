import { Suspense } from 'react';
import LoginClient from '@/components/auth/LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: '#9CA3AF' }}>Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
