'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Flame,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  TrendingDown,
  Wallet,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BrandLogo } from '@/components/BrandLogo';
import { Reveal } from '@/components/Reveal';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_PACKAGES, PackageConfig, loadPackages } from '@/lib/packages';
import { getCurrentUser, setCurrentUser } from '@/lib/auth';

const formatShortPrice = (price: number) =>
  price >= 1000 ? `Rp ${Math.round(price / 1000)}rb` : formatCurrency(price);

const HERO_HIGHLIGHTS = [
  { text: 'Slot terkunci real-time', icon: ShieldCheck },
  { text: 'DP via QRIS & Virtual Account', icon: QrCode },
  { text: 'Tiket otomatis ke WhatsApp', icon: Smartphone },
  { text: 'Gratis 7 hari di paket Starter', icon: Sparkles },
  { text: 'Anti-ghosting', icon: CircleCheck },
  { text: 'Kalender jadwal interaktif', icon: CalendarCheck2 },
  { text: 'Laporan kasir & owner', icon: Banknote },
  { text: 'Nol double-booking', icon: Zap },
];

const SPORTS = ['Futsal', 'Badminton', 'Padel', 'Mini Soccer', 'Tenis', 'Basket', 'Voli'];

const MOCK_SLOTS = [
  { time: '15.00', state: 'open', label: 'Tersedia', meta: 'Rp 150rb' },
  { time: '16.00', state: 'open', label: 'Tersedia', meta: 'Rp 150rb' },
  { time: '17.00', state: 'walkin', label: 'Walk-in kasir', meta: 'Lunas tunai' },
  { time: '18.00', state: 'booked', label: 'FC Mandiri', meta: 'DP lunas' },
  { time: '19.00', state: 'selected', label: 'Dipilih · Prime', meta: 'DP 30% · Rp 54rb' },
  { time: '20.00', state: 'booked', label: 'Garuda FC', meta: 'DP lunas' },
  { time: '21.00', state: 'open', label: 'Tersedia', meta: 'Rp 180rb' },
  { time: '22.00', state: 'open', label: 'Tersedia', meta: 'Rp 180rb' },
] as const;

const SLOT_STYLES: Record<(typeof MOCK_SLOTS)[number]['state'], string> = {
  open: 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:border-emerald-400/40',
  selected: 'bg-emerald-400 border-emerald-300 text-slate-950 shadow-[0_8px_30px_-6px_rgba(52,211,153,0.7)]',
  booked: 'bg-white/[0.015] border-white/[0.04] text-slate-500',
  walkin: 'bg-amber-400/10 border-amber-400/25 text-amber-200',
};

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto space-y-4">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
        {title}{' '}
        {accent && <span className="text-emerald-400 pr-1">{accent}</span>}
      </h2>
      <p className="text-[15px] sm:text-base text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function SaaSMarketingLandingPage() {
  const [lostHoursPerWeek, setLostHoursPerWeek] = useState(4);
  const [hourlyPrice, setHourlyPrice] = useState(150000);

  const [packages, setPackages] = useState<PackageConfig[]>(DEFAULT_PACKAGES);
  useEffect(() => {
    setPackages(loadPackages());
    
    // Clear demo session when returning to landing page
    const currentUser = getCurrentUser();
    if (currentUser?.isDemo) {
      setCurrentUser(null);
    }
  }, []);
  const starter = packages.find((p) => p.id === 'STARTER') ?? DEFAULT_PACKAGES[0];
  const pro = packages.find((p) => p.id === 'PRO') ?? DEFAULT_PACKAGES[1];
  const enterprise = packages.find((p) => p.id === 'ENTERPRISE') ?? DEFAULT_PACKAGES[2];

  const monthlyLostRevenue = lostHoursPerWeek * hourlyPrice * 4;
  const saasSubscriptionCost = pro.price;
  const netSavings = monthlyLostRevenue - saasSubscriptionCost;
  const roiMultiple = monthlyLostRevenue / saasSubscriptionCost;

  return (
    <div className="min-h-screen bg-landing-mesh text-slate-300 flex flex-col relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 noise-overlay -z-10" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-grid-lines -z-10" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-emerald-500/20 blur-[140px] -z-10 animate-pulse-subtle" aria-hidden />
      <div className="pointer-events-none absolute top-[420px] -right-40 w-[520px] h-[520px] rounded-full bg-violet-500/10 blur-[130px] -z-10 animate-float-reverse" aria-hidden />
      <div className="pointer-events-none absolute top-[1500px] -left-40 w-[560px] h-[560px] rounded-full bg-teal-500/10 blur-[130px] -z-10 animate-float-slow" aria-hidden />

      <Navbar />

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 lg:pt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/gor-nusantara"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur text-[13px] text-slate-300 hover:border-emerald-400/30 hover:bg-white/[0.05] transition-colors animate-hero-badge"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-blink" />
              Baru
            </span>
            Tiket booking kini terkirim otomatis ke WhatsApp
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-8 text-[44px] leading-[1.02] sm:text-7xl lg:text-[88px] font-semibold tracking-[-0.045em] animate-hero-title">
            <span className="text-gradient-silver">Lapangan penuh.</span>
            <br />
            <span className="text-gradient-silver">Jadwal rapi. </span>
            <span className="tracking-[-0.02em] text-gradient-brand pr-2">Tanpa drama.</span>
          </h1>

          <p className="mt-7 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed animate-hero-subtitle">
            Jadwalin memberi venue Anda halaman booking online sendiri. Tamu pilih jam, bayar DP lewat QRIS,
            dan slot langsung terkunci. <span className="text-slate-200">Tidak ada lagi double-booking atau tamu yang menghilang.</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-hero-cta">
            <Link
              href="/gor-nusantara"
              target="_blank"
              rel="noreferrer"
              className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-[15px] hover:bg-emerald-300 transition-colors glow-brand"
            >
              Lihat demo halaman tamu
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="/admin?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-100 font-medium text-[15px] hover:bg-white/[0.07] hover:border-white/20 transition-colors"
            >
              Jelajahi dasbor owner
              <span className="text-slate-500 text-sm font-normal">— tanpa daftar</span>
            </a>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 animate-hero-cta">
            Gratis 7 hari · Tanpa kartu kredit · Batal kapan saja
          </p>

          {/* Marquee */}
          <div className="mt-14 w-full max-w-4xl mx-auto overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] animate-hero-marquee">
            <div className="animate-marquee-infinite flex items-center gap-8 py-1">
              {[...HERO_HIGHLIGHTS, ...HERO_HIGHLIGHTS].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="inline-flex items-center gap-2 text-[13px] text-slate-400 whitespace-nowrap">
                    <Icon className="w-4 h-4 text-emerald-400/80 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative mt-16 max-w-5xl mx-auto animate-hero-mockup">
            <div className="absolute -inset-x-10 -top-10 bottom-10 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-3xl -z-10" aria-hidden />

            <div className="rounded-[22px] p-[1px] bg-gradient-to-b from-white/20 via-white/[0.06] to-transparent">
              <div className="rounded-[21px] bg-slate-900/90 backdrop-blur-xl overflow-hidden text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
                {/* Window chrome */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                  </div>
                  <div className="flex-1 max-w-xs mx-auto flex items-center justify-center gap-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-1 font-mono text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    jadwalin.id/gor-nusantara
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-blink" />
                    Live sync
                  </div>
                </div>

                <div className="grid md:grid-cols-[220px_1fr]">
                  {/* Sidebar */}
                  <div className="hidden md:block border-r border-white/[0.06] p-4 space-y-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">Lapangan</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between rounded-lg bg-emerald-400/10 border border-emerald-400/25 px-3 py-2 text-xs text-emerald-200">
                          <span className="font-medium">Futsal A · Vinyl</span>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="rounded-lg px-3 py-2 text-xs text-slate-400 border border-transparent">Futsal B · Sintetis</div>
                        <div className="rounded-lg px-3 py-2 text-xs text-slate-400 border border-transparent">Badminton 1</div>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">Tanggal</p>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {['Sen', 'Sel', 'Rab', 'Kam'].map((d, i) => (
                          <div
                            key={d}
                            className={`rounded-lg py-1.5 border text-[10px] ${
                              i === 1
                                ? 'bg-white text-slate-950 border-white font-semibold'
                                : 'border-white/[0.06] text-slate-400'
                            }`}
                          >
                            <div>{d}</div>
                            <div className="text-xs font-semibold">{12 + i}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Slots */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Futsal A · Selasa, 13 Okt</p>
                        <p className="text-xs text-slate-500">Pilih jam main, bayar DP, selesai.</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-white/20" />Tersedia</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Dipilih</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/60" />Walk-in</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {MOCK_SLOTS.map((slot) => (
                        <div
                          key={slot.time}
                          className={`rounded-xl border px-3 py-2.5 transition-colors ${SLOT_STYLES[slot.state]}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] opacity-80">{slot.time}</span>
                            {slot.state === 'selected' && <Check className="w-3.5 h-3.5" />}
                            {slot.state === 'booked' && <Lock className="w-3 h-3" />}
                          </div>
                          <p className={`mt-1 text-[12px] font-semibold ${slot.state === 'booked' ? 'line-through decoration-white/20' : ''}`}>
                            {slot.label}
                          </p>
                          <p className="text-[10px] opacity-70">{slot.meta}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <div className="text-xs">
                        <span className="text-slate-500">Total · </span>
                        <span className="text-white font-semibold">Rp 180.000</span>
                        <span className="text-slate-500"> · DP sekarang </span>
                        <span className="text-emerald-300 font-semibold">Rp 54.000</span>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-slate-950">
                        <QrCode className="w-3.5 h-3.5" /> Bayar DP via QRIS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating toasts */}
            <div className="hidden lg:flex absolute -left-16 top-1/3 items-center gap-3 rounded-2xl glass-panel px-4 py-3 shadow-2xl animate-float text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <Wallet className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">DP diterima</p>
                <p className="text-[11px] text-slate-400">Rp 54.000 · QRIS</p>
              </div>
            </div>
            <div className="hidden lg:flex absolute -right-14 bottom-16 items-center gap-3 rounded-2xl glass-panel px-4 py-3 shadow-2xl animate-float-reverse text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
                <MessageCircle className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Tiket terkirim</p>
                <p className="text-[11px] text-slate-400">WhatsApp · 19.00–20.00</p>
              </div>
            </div>
          </div>

          {/* Sports strip */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Dibuat untuk semua jenis venue</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-lg sm:text-xl font-semibold tracking-tight text-slate-600">
              {SPORTS.map((s) => (
                <span key={s} className="hover:text-slate-300 transition-colors">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── BEFORE / AFTER ──────────────────────── */}
      <section className="relative py-24 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <Reveal direction="up">
            <SectionHeading
              eyebrow="Sebelum vs sesudah"
              title="Masih kelola booking lewat"
              accent="chat WhatsApp?"
              description="Setiap pesan yang terlewat adalah jam sewa yang hilang. Saatnya sistem yang bekerja, bukan admin yang begadang."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Reveal direction="left" delay={120}>
              <div className="h-full rounded-3xl border border-white/[0.06] bg-white/[0.015] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Cara lama</span>
                  <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                    Chat + buku tulis
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-200">Ramai, tapi bocor di mana-mana.</h3>
                <ul className="mt-7 space-y-5">
                  {[
                    ['Double-booking', 'Dua admin membalas chat bersamaan. Dua tim datang di jam yang sama.'],
                    ['Ghosting', 'Tamu pesan jam prime time tanpa DP, lalu batal 15 menit sebelum main.'],
                    ['Rekap manual', 'Tiap malam mencocokkan nota kasir dengan mutasi bank satu per satu.'],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex gap-3.5">
                      <CircleX className="w-5 h-5 text-rose-400/80 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-300">{title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal direction="right" delay={220}>
              <div className="relative h-full rounded-3xl border-glow bg-gradient-to-b from-emerald-500/[0.08] to-slate-900/60 p-7 sm:p-9 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-300">Dengan Jadwalin</span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                    Otomatis
                  </span>
                </div>
                <h3 className="relative mt-5 text-xl font-semibold text-white">Rapi, terkunci, dan terbayar.</h3>
                <ul className="relative mt-7 space-y-5">
                  {[
                    ['Slot terkunci otomatis', 'Begitu dibayar, jadwal langsung terkunci untuk semua orang secara real-time.'],
                    ['DP wajib di muka', 'Tamu bayar DP via QRIS atau VA untuk mengamankan jam. Yang bayar, pasti datang.'],
                    ['Laporan jadi sendiri', 'Tiket ber-QR terkirim ke WhatsApp, omzet harian tercatat tanpa input manual.'],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex gap-3.5">
                      <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FEATURES ─────────────────────────── */}
      <section id="fitur" className="relative py-24 sm:py-28 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <Reveal direction="up">
            <SectionHeading
              eyebrow="Fitur utama"
              title="Tiga alat. Satu sistem."
              accent="Nol pusing."
              description="Mudah dipakai pelanggan, mudah dipahami staf kasir. Tanpa instalasi, langsung jalan di browser."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <Reveal direction="up" delay={80}>
              <div className="card-soft group h-full rounded-3xl p-2 flex flex-col">
                <div className="relative h-44 rounded-[20px] bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-white/[0.05] overflow-hidden p-5 flex flex-col justify-end">
                  <div className="absolute inset-0 bg-dot-grid opacity-60" aria-hidden />
                  <div className="relative rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-[11px] text-slate-300 flex items-center gap-2 w-fit shadow-xl">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    jadwalin.id/<span className="text-emerald-300">gor-nusantara</span>
                  </div>
                  <div className="relative mt-2.5 flex gap-1.5">
                    {['07', '08', '09', '10', '11'].map((h, i) => (
                      <span
                        key={h}
                        className={`rounded-md px-2 py-1 font-mono text-[10px] border ${
                          i === 2 ? 'bg-emerald-400 text-slate-950 border-emerald-300' : 'border-white/10 text-slate-400 bg-white/[0.03]'
                        }`}
                      >
                        {h}.00
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em]">01 · Halaman booking</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">Halaman booking milik venue Anda</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">
                    Satu link untuk bio Instagram dan WhatsApp. Kalender 07.00–23.00, foto lapangan, dan status slot yang selalu real-time.
                  </p>
                  <p className="mt-5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Pasang di bio Instagram & WhatsApp
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 2 */}
            <Reveal direction="up" delay={160}>
              <div className="card-soft group h-full rounded-3xl p-2 flex flex-col">
                <div className="relative h-44 rounded-[20px] bg-gradient-to-br from-violet-500/15 via-slate-900 to-slate-900 border border-white/[0.05] overflow-hidden p-5 flex flex-col justify-center gap-2.5">
                  <div className="absolute inset-0 bg-dot-grid opacity-60" aria-hidden />
                  <div className="relative ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-emerald-500/90 px-3.5 py-2 text-[11px] text-slate-950 shadow-lg">
                    <p className="font-semibold flex items-center gap-1"><Ticket className="w-3 h-3" /> Booking terkonfirmasi</p>
                    <p className="opacity-80">Futsal A · Sel 13 Okt · 19.00</p>
                  </div>
                  <div className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 w-fit shadow-xl">
                    <QrCode className="w-4 h-4 text-violet-300" />
                    <span className="text-[11px] text-slate-300">DP 30% · <span className="text-white font-semibold">Rp 54.000</span></span>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-violet-300">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em]">02 · Pembayaran</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">DP otomatis & tiket WhatsApp</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">
                    Tamu bayar DP (misal 30%) lewat QRIS, BCA Virtual Account, atau GoPay. Begitu lunas, tiket dan konfirmasi terkirim sendiri.
                  </p>
                  <p className="mt-5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Terhubung dengan Fonnte & Wablas
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 3 */}
            <Reveal direction="up" delay={240}>
              <div className="card-soft group h-full rounded-3xl p-2 flex flex-col">
                <div className="relative h-44 rounded-[20px] bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-white/[0.05] overflow-hidden p-5 flex items-end">
                  <div className="absolute inset-0 bg-dot-grid opacity-60" aria-hidden />
                  <div className="relative w-full flex items-end gap-1.5 h-24">
                    {[38, 55, 42, 70, 62, 88, 76].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-md ${i === 5 ? 'bg-gradient-to-t from-amber-500 to-amber-300' : 'bg-white/[0.08]'}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-300 shadow-xl">
                    Omzet hari ini <span className="text-amber-300 font-semibold">Rp 2,4jt</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em]">03 · Dasbor kasir</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">Dasbor kasir & walk-in</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">
                    Tamu datang langsung atau pesan lewat telepon? Klik slot kosong, jadwal tertutup. Laporan pendapatan siap dicetak kapan saja.
                  </p>
                  <p className="mt-5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Tandai lunas tunai dalam satu klik
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ────────────────────────── CALCULATOR ────────────────────────── */}
      <section id="kalkulator" className="relative py-24 sm:py-28 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <Reveal direction="up">
            <SectionHeading
              eyebrow="Kalkulator ghosting"
              title="Berapa omzet yang hilang karena tamu"
              accent="ghosting?"
              description="Geser untuk menghitung estimasi uang sewa yang lenyap tiap bulan akibat booking tanpa DP."
            />
          </Reveal>

          <Reveal direction="pop" delay={120}>
            <div className="relative rounded-[28px] p-[1px] bg-gradient-to-b from-white/15 via-white/[0.05] to-transparent">
              <div className="relative rounded-[27px] bg-slate-900/80 backdrop-blur-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" aria-hidden />
                <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" aria-hidden />

                {/* Inputs */}
                <div className="relative p-7 sm:p-10 space-y-9 border-b md:border-b-0 md:border-r border-white/[0.06]">
                  <div>
                    <div className="flex items-end justify-between gap-4 mb-4">
                      <label htmlFor="lost-hours" className="text-sm text-slate-400">Jam kosong karena ghosting<br className="sm:hidden" /> per minggu</label>
                      <span className="font-mono text-2xl font-semibold text-white tabular-nums">
                        {lostHoursPerWeek}<span className="text-sm text-slate-500 font-normal"> jam</span>
                      </span>
                    </div>
                    <input
                      id="lost-hours"
                      type="range"
                      min={1}
                      max={20}
                      value={lostHoursPerWeek}
                      onChange={(e) => setLostHoursPerWeek(Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-white/10 rounded-full cursor-pointer"
                    />
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600"><span>1</span><span>20</span></div>
                  </div>

                  <div>
                    <div className="flex items-end justify-between gap-4 mb-4">
                      <label htmlFor="hourly-price" className="text-sm text-slate-400">Rata-rata tarif<br className="sm:hidden" /> per jam</label>
                      <span className="font-mono text-2xl font-semibold text-white tabular-nums">{formatCurrency(hourlyPrice)}</span>
                    </div>
                    <input
                      id="hourly-price"
                      type="range"
                      min={50000}
                      max={350000}
                      step={10000}
                      value={hourlyPrice}
                      onChange={(e) => setHourlyPrice(Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-white/10 rounded-full cursor-pointer"
                    />
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600"><span>Rp 50rb</span><span>Rp 350rb</span></div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Rumus: jam kosong × tarif × 4 minggu. Estimasi kasar, tapi biasanya angka aslinya lebih besar.
                  </p>
                </div>

                {/* Results */}
                <div className="relative p-7 sm:p-10 flex flex-col justify-center space-y-6">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-slate-400">
                      <TrendingDown className="w-4 h-4 text-rose-400" /> Omzet yang hilang per bulan
                    </p>
                    <p className="mt-2 font-mono text-4xl sm:text-5xl font-semibold tracking-tight text-rose-300 tabular-nums">
                      {formatCurrency(monthlyLostRevenue)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm">
                    <span className="text-slate-400">Biaya Jadwalin {pro.name}</span>
                    <span className="font-mono text-slate-200 tabular-nums">{formatCurrency(saasSubscriptionCost)}/bln</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.08] p-5">
                    <p className="text-sm text-emerald-200/80">Yang bisa Anda selamatkan</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-emerald-300 tabular-nums">
                      {netSavings > 0 ? `+${formatCurrency(netSavings)}` : formatCurrency(monthlyLostRevenue)}<span className="text-base text-emerald-300/60 font-normal">/bln</span>
                    </p>
                    <p className="mt-2 text-xs text-emerald-200/60">
                      {roiMultiple >= 1 ? `Setara ${roiMultiple.toFixed(1)}× biaya langganan Anda.` : 'Cocok dimulai dengan paket Starter UMKM gratis.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────── PRICING ─────────────────────────── */}
      <section id="pricing" className="relative py-24 sm:py-28 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <Reveal direction="up">
            <SectionHeading
              eyebrow="Harga"
              title="Harga jujur."
              accent="Tanpa biaya tersembunyi."
              description="Mulai gratis 7 hari di paket Starter, atau langsung aktifkan Juara Pro untuk fitur lengkap."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Starter */}
            <Reveal direction="up" delay={80}>
              <div className="card-soft h-full rounded-3xl p-7 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{starter.name}</h3>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                    Trial 7 hari
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Untuk venue kecil dengan 1–2 lapangan.</p>

                <div className="mt-7 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight text-white">Rp 0</span>
                  <span className="text-sm text-slate-500">/ 7 hari pertama</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Setelah itu {formatCurrency(starter.price)} / bulan · tanpa kartu kredit</p>

                <Link
                  href="/login?mode=register&plan=STARTER"
                  className="mt-7 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                >
                  Mulai trial gratis <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="mt-8 pt-7 border-t border-white/[0.06] space-y-3.5 text-sm text-slate-300">
                  {starter.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal direction="up" delay={160}>
              <div className="relative h-full rounded-3xl border-glow bg-gradient-to-b from-emerald-500/[0.12] via-slate-900/90 to-slate-900/90 p-7 flex flex-col shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-[0_8px_24px_-6px_rgba(52,211,153,0.8)] whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5" /> Paling populer
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{pro.name}</h3>
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                    Fitur lengkap
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Untuk venue aktif dengan 3–6 lapangan.</p>

                <div className="mt-7 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight text-white">{formatShortPrice(pro.price)}</span>
                  <span className="text-sm text-slate-500">/ bulan</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{formatCurrency(pro.price)} / bulan · langsung aktif</p>

                <Link
                  href="/login?mode=register&plan=PRO"
                  className="btn-shine mt-7 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 transition-colors"
                >
                  Pilih {pro.name} <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="mt-8 pt-7 border-t border-white/[0.08] space-y-3.5 text-sm text-slate-200">
                  {pro.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Enterprise */}
            <Reveal direction="up" delay={240}>
              <div className="card-soft h-full rounded-3xl p-7 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{enterprise.name}</h3>
                  <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                    Multi-cabang
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Untuk sport center, franchise, dan klub padel premium.</p>

                <div className="mt-7 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight text-white">{formatShortPrice(enterprise.price)}</span>
                  <span className="text-sm text-slate-500">/ bulan</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{formatCurrency(enterprise.price)} / bulan · pendampingan setup</p>

                <Link
                  href="/login?mode=register&plan=ENTERPRISE"
                  className="mt-7 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                >
                  Pilih Enterprise <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="mt-8 pt-7 border-t border-white/[0.06] space-y-3.5 text-sm text-slate-300">
                  {enterprise.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FINAL CTA ─────────────────────────── */}
      <section className="relative py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="pop">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-violet-500/15 px-6 py-16 sm:px-16 text-center">
              <div className="absolute inset-0 bg-grid-lines opacity-60" aria-hidden />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-400/20 blur-[100px]" aria-hidden />
              <div className="relative">
                <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-gradient-silver leading-[1.08]">
                  Biarkan sistem yang jaga jadwal.<br />
                  <span className="text-gradient-brand">Anda fokus kembangkan venue.</span>
                </h2>
                <p className="mt-5 text-slate-400 max-w-xl mx-auto">
                  Aktifkan halaman booking Anda hari ini. Gratis 7 hari, tanpa kartu kredit.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/login?mode=register&plan=STARTER"
                    className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 font-semibold text-[15px] hover:bg-emerald-200 transition-colors"
                  >
                    Mulai gratis sekarang
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/gor-nusantara"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl border border-white/15 text-slate-100 font-medium text-[15px] hover:bg-white/[0.06] transition-colors"
                  >
                    Lihat demo dulu <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ─────────────────────────── */}
      <footer className="mt-auto border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr] gap-10">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <BrandLogo size={28} />
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Sistem booking lapangan olahraga yang anti double-booking dan anti ghosting.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Produk</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/#fitur" className="hover:text-white transition-colors">Fitur</Link></li>
                <li><Link href="/#kalkulator" className="hover:text-white transition-colors">Kalkulator ghosting</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Harga</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Coba sekarang</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/gor-nusantara" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Demo halaman tamu</Link></li>
                <li><a href="/admin?demo=true" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Demo dasbor owner</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Masuk</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>© 2026 Jadwalin Indonesia. Hak cipta dilindungi.</p>
            <p className="font-mono">Next.js · Midtrans · PostgreSQL</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
