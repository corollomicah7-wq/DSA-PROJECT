import type { Metadata } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-title',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-body',
});

export const metadata: Metadata = {
  title: 'Binary Tree | 90s Pixel Arcade',
  description: 'Interactive 90s Retro Pixel Binary Tree & Expression Tree Game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}