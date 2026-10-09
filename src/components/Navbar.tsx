'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { getCurrentUser, setCurrentUser } from '@/lib/auth';

const NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#kalkulator', label: 'Kalkulator' },
  { href: '/#pricing', label: 'Harga' },
];

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 animate-nav-drop">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-3">
        <div
          className="rounded-2xl pl-3 pr-2 sm:pl-4 h-14 flex items-center justify-between transition-all duration-300 glass-panel shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
        >
          {/* Brand */}
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-90" aria-label="Jadwalin — Beranda">
            <BrandLogo size={28} priority />
          </Link>

          {/* Desktop nav */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-slate-400">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Link
              href="/gor-nusantara"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              Lihat demo
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <a
              href="/admin"
              onClick={() => {
                const currentUser = getCurrentUser();
                if (currentUser?.isDemo) setCurrentUser(null);
              }}
              className="group inline-flex items-center gap-1.5 pl-3.5 pr-3 py-2 text-[13px] font-semibold rounded-xl bg-white text-slate-950 hover:bg-emerald-300 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_-8px_rgba(255,255,255,0.35)]"
            >
              Masuk dasbor
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile toggle */}
          <div className="flex sm:hidden items-center gap-1.5">
            <a
              href="/admin"
              onClick={() => {
                const currentUser = getCurrentUser();
                if (currentUser?.isDemo) setCurrentUser(null);
              }}
              className="px-3 py-2 rounded-xl bg-white text-slate-950 text-xs font-semibold"
            >
              Masuk
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:bg-white/[0.06] transition-colors border border-white/10"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-2 glass-panel rounded-2xl p-3 shadow-2xl space-y-3 animate-scale-in origin-top">
            {!isAdmin && (
              <nav className="flex flex-col text-sm font-medium text-slate-300">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              <Link
                href="/gor-nusantara"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 text-slate-200 text-sm font-medium"
              >
                Lihat demo halaman tamu
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold"
              >
                Masuk dasbor pemilik
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
