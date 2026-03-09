import type { Metadata } from 'next';
import { Suspense } from 'react';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Live Bóng Đá',
  description: 'Lịch thi đấu, bảng kèo, stream, h2h, standings (SportSRC)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, background: '#0B0F14', color: '#fff' }}>
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
