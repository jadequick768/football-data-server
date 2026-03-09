import { Suspense } from 'react';
import RegisterClient from '@/components/auth/RegisterClient';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
