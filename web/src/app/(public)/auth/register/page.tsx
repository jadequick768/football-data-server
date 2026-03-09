import { Suspense } from 'react';
import RegisterClient from '@/components/auth/RegisterClient';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: '#9CA3AF' }}>Loading…</div>}>
      <RegisterClient />
    </Suspense>
  );
}
