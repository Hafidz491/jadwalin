import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jadwalin — Booking Lapangan Otomatis, Tanpa Double-Booking & Ghosting',
  description:
    'Halaman booking online untuk venue olahraga. Jadwal real-time, DP otomatis via QRIS & Midtrans, tiket WhatsApp, dan laporan kasir dalam satu dasbor. Coba gratis 7 hari.',
  keywords: [
    'booking lapangan',
    'futsal',
    'badminton',
    'padel',
    'mini soccer',
    'jadwalin',
    'aplikasi booking lapangan',
    'midtrans booking',
    'anti ghosting',
    'anti double booking',
  ],
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090c',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-200">
        {children}
      </body>
    </html>
  );
}
