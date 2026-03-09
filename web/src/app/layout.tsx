import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SportSRC Watch',
  description: 'Minimal watch page for embedding SportSRC streams',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, background: '#000', color: '#fff' }}>{children}</body>
    </html>
  );
}
