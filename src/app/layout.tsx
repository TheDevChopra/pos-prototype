import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientGuard } from '@/components/ClientGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shake Era POS Demo',
  description: 'A modern, interactive POS prototype built for cafes and small restaurants.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        <ClientGuard>{children}</ClientGuard>
      </body>
    </html>
  );
}
