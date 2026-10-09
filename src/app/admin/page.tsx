'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  Layers,
  TrendingUp,
  Plus,
  ArrowUpRight,
  LogOut,
  Clock,
  Zap,
  ExternalLink,
  DollarSign,
  X,
  Phone,
  CalendarDays,
  Activity,
  Wallet,
  Building2,
  ArrowUp,
  Printer,
  CheckCircle2,
  Menu,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  Tag,
  ToggleLeft,
  ToggleRight,
  ImagePlus,
  ChevronDown,
  Sparkles,
  MapPin,
  Mail,
  Eye,
  Store,
  UserCircle,
  Lock,
  Globe,
  Crown,
  Info,
  Bell,
  Upload,
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ManualBookingModal } from '@/components/ManualBookingModal';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { NotificationInboxModal } from '@/components/NotificationInboxModal';
import { BookingToastAlert } from '@/components/BookingToastAlert';
import {
  getTenantData,
  saveTenantData,
  getCourtsData,
  saveCourtsData,
  getBookingsData,
  saveBookingsData,
  addBooking,
  getFinancialMetrics,
} from '@/lib/data';
import {
  getInboxNotifications,
  EVENT_NEW_BOOKING_NOTIFICATION,
  playNotificationSound,
  createNotificationFromBooking,
} from '@/lib/notifications';
import { getCurrentUser, logout, loginAsDemo, checkSubscriptionTrialStatus, simulateSetTrialDays } from '@/lib/auth';
import { Tenant, Court, Booking, AuthUser, SportType, InboxNotification } from '@/lib/types';
import {
  formatCurrency,
  getTodayDateString,
  formatDateIndo,
  isBookingActive,
} from '@/lib/utils';

// ─── Mini Barcode Component ─────────────────────────────────────────
function MiniBarcodeDisplay({ code }: { code: string }) {
  const bars = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < 32; i++) {
      const charCode = code.charCodeAt(i % code.length) + i;
      result.push((charCode % 4) + 1);
    }
    return result;
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-end gap-[1.5px] h-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-[0.5px]"
            style={{ width: i % 3 === 0 ? 2 : 1, height: `${h * 22}%`, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)' }}
          />
        ))}
      </div>
      <span className="text-[7px] font-mono text-indigo-400 tracking-widest leading-none">
        {code}
      </span>
    </div>
  );
}

// ─── Recharts custom tooltip ─────────────────────────────────────────
const ChartTooltipContent = ({ active, payload, label, isCurrency }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isCurrency?: boolean;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl px-3.5 py-2.5 shadow-2xl border border-slate-700/60 text-xs">
      <p className="text-slate-400 mb-1 text-[10px] font-semibold">Tgl {label}</p>
      <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
        {isCurrency ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-bold">{formatCurrency(payload[0].value)}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{payload[0].value} Pengguna Booking</span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sidebar types & component ───────────────────────────────────────
type SidebarTab = 'home' | 'courts' | 'finance' | 'account';

function Sidebar({
  active,
  onChange,
  tenantName,
  currentUser,
  onLogout,
  isMobileOpen,
  onMobileClose,
  tenantSlug,
  tierName,
  trialInfo,
  onOpenSubscriptionModal,
  unreadNotifsCount,
  onOpenInbox,
}: {
  active: SidebarTab;
  onChange: (t: SidebarTab) => void;
  tenantName: string;
  currentUser: AuthUser;
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  tenantSlug: string;
  tierName: string;
  trialInfo: { isTrial: boolean; isExpired: boolean; daysLeft: number; endsAt: string };
  onOpenSubscriptionModal: () => void;
  unreadNotifsCount: number;
  onOpenInbox: () => void;
}) {
  const navItems: { id: SidebarTab; icon: React.ReactNode; label: string; sub: string }[] = [
    { id: 'home', icon: <Home className="w-4 h-4" />, label: 'Home', sub: 'Ringkasan & Booking' },
    { id: 'courts', icon: <Layers className="w-4 h-4" />, label: 'Lapangan & Jadwal', sub: 'Kelola slot & lapangan' },
    { id: 'finance', icon: <TrendingUp className="w-4 h-4" />, label: 'Laporan Keuangan', sub: 'Pendapatan & rekap' },
    { id: 'account', icon: <Building2 className="w-4 h-4" />, label: 'Akun & Profil', sub: 'Profil usaha, foto & alamat' },
  ];

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={onMobileClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 w-64 flex flex-col bg-slate-900 border-r border-white/10/80 shadow-xl transition-transform duration-300 sidebar-root
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shadow-none shrink-0`}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center group" title="Ke Beranda Jadwalin">
              <Image
                src="/logo.png"
                alt="Jadwalin - Smart Booking"
                width={140}
                height={38}
                className="h-8 w-auto object-contain group-hover:scale-[1.02] transition-transform"
                priority
              />
            </a>
            <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Venue */}
        <div className="px-3.5 py-3 mx-3.5 mt-4 rounded-2xl bg-white/5 border border-white/10/80 shadow-xs shrink-0 space-y-3">
          <div>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Venue Aktif</p>
            <p className="text-xs font-bold text-slate-200 leading-tight mt-0.5 line-clamp-2">{tenantName}</p>
          </div>
          
          <div className="space-y-1.5">
            <button
              onClick={() => {
                onOpenSubscriptionModal();
                onMobileClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-left min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[10px] font-black text-white truncate">{tierName}</span>
              </div>
              {trialInfo.isTrial && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                  trialInfo.isExpired 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {trialInfo.isExpired ? 'Trial Habis' : `${trialInfo.daysLeft} Hari`}
                </span>
              )}
            </button>
            <Link
              href={`/b/${tenantSlug}`}
              target="_blank"
              onClick={onMobileClose}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all"
            >
              <div className="flex items-center gap-1.5 text-left text-[10px] font-semibold">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                <span>Buka Web Tamu</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-5 space-y-1 overflow-y-auto">
          {/* Kotak Masuk / Inbox */}
          <button
            onClick={() => { onOpenInbox(); onMobileClose(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group mb-4"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[12px] font-bold">Kotak Masuk</span>
            </div>
            {unreadNotifsCount > 0 && (
              <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                {unreadNotifsCount} Baru
              </span>
            )}
          </button>

          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 pb-1.5">Menu Utama</p>
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onChange(item.id); onMobileClose(); }}
                className={`nav-item w-full text-left ${isActive ? 'active' : ''}`}
              >
                <span className={`nav-icon shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-bold block">{item.label}</span>
                  <span className="text-[10px] text-slate-400 truncate block font-medium">{item.sub}</span>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 shadow-xs shadow-blue-500/50" />}
              </button>
            );
          })}
        </nav>

        {/* User & Logout - Pinned to the very bottom */}
        <div className="mt-auto p-4 border-t border-white/10 bg-white/5/70 shrink-0">
          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-900 border border-white/10/80 shadow-xs mb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-white text-xs font-black">{currentUser.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate font-medium">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 border border-rose-500/20/60 hover:border-rose-300 transition-all text-xs font-bold cursor-pointer bg-slate-900 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Home Tab ────────────────────────────────────────────────────────
function HomeTab({
  tenant, courts, bookings, metrics, onManualBooking,
}: {
  tenant: Tenant;
  courts: Court[];
  bookings: Booking[];
  metrics: ReturnType<typeof getFinancialMetrics>;
  onManualBooking: () => void;
}) {
  const today = getTodayDateString();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const calendarData = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset = firstDay.getDay();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayB = bookings.filter((b) => b.date === dateStr && isBookingActive(b));
      days.push({
        date: dateStr,
        day: d,
        bookingCount: dayB.length,
        revenue: dayB.reduce((s, b) => s + b.totalAmount, 0),
      });
    }
    return { days, offset };
  }, [bookings]);

  const revenueTrend = useMemo(() => {
    const data: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      data.push(bookings.filter((b) => b.date === ds && isBookingActive(b)).reduce((s, b) => s + b.totalAmount, 0));
      labels.push(String(d.getDate()));
    }
    return { data, labels };
  }, [bookings]);

  const bookingTrend = useMemo(() => {
    const data: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      data.push(bookings.filter((b) => b.date === ds && isBookingActive(b)).length);
      labels.push(String(d.getDate()));
    }
    return { data, labels };
  }, [bookings]);

  const totalRevenue = useMemo(
    () => bookings.filter((b) => isBookingActive(b)).reduce((s, b) => s + b.totalAmount, 0),
    [bookings]
  );

  const [chartView, setChartView] = useState<'both' | 'revenue' | 'booking'>('both');

  const total7DaysRev = useMemo(() => revenueTrend.data.reduce((a, b) => a + b, 0), [revenueTrend]);
  const total7DaysBookings = useMemo(() => bookingTrend.data.reduce((a, b) => a + b, 0), [bookingTrend]);
  const peakDay = useMemo(() => {
    let maxIdx = 0;
    let maxVal = 0;
    revenueTrend.data.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return { label: revenueTrend.labels[maxIdx] || '-', val: maxVal };
  }, [revenueTrend]);

  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-[24px] p-6 border border-white/10 group bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none transition-opacity group-hover:bg-blue-500/20" />
          
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 tracking-wide">Jumlah Lapangan</p>
          <p className="text-3xl font-medium text-white mt-1 font-instrument">{courts.filter((c) => c.isActive).length}</p>
          <p className="text-[11px] text-blue-400/80 font-medium mt-2">{courts.length} lapangan terdaftar</p>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-[24px] p-6 border border-white/10 group bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none transition-opacity group-hover:bg-emerald-500/20" />
          
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 tracking-wide">Pendapatan Bulan Ini</p>
          <p className="text-3xl font-medium text-white mt-1 font-instrument">{formatCurrency(metrics.monthRevenue)}</p>
          <p className="text-[11px] text-emerald-400/80 font-medium mt-2 flex items-center gap-1">
            <ArrowUp className="w-3 h-3" /> DP masuk: {formatCurrency(metrics.todayDp)}
          </p>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-[24px] p-6 border border-white/10 group bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-violet-500/10 blur-[50px] rounded-full pointer-events-none transition-opacity group-hover:bg-violet-500/20" />
          
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)] flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 tracking-wide">Total Pendapatan</p>
          <p className="text-3xl font-medium text-white mt-1 font-instrument">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-violet-400/80 font-medium mt-2">{metrics.totalBookings} total sesi booking</p>
        </div>
      </div>

      {/* ── Calendar + Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Compact Calendar */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-white">Kalender Booking</h3>
                <p className="text-[10px] text-slate-400 capitalize">{currentMonthName}</p>
              </div>
              <button
                onClick={onManualBooking}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/25 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Booking
              </button>
            </div>

            {/* Day headers */}
            <div className="max-w-[280px] mx-auto grid grid-cols-7 mb-2 text-center">
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map((d) => (
                <div key={d} className="text-[10px] font-bold text-slate-400 py-0.5">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="max-w-[280px] mx-auto grid grid-cols-7 gap-y-1.5 gap-x-1">
              {Array.from({ length: calendarData.offset }).map((_, i) => (
                <div key={`e-${i}`} className="w-8 h-8" />
              ))}
              {calendarData.days.map(({ date, day, bookingCount, revenue }) => {
                const isToday = date === today;
                const hasBookings = bookingCount > 0;
                return (
                  <div
                    key={date}
                    className="relative flex items-center justify-center"
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-default select-none
                        ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white' : ''}
                        ${hasBookings
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 font-black scale-105'
                          : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {day}
                    </div>
                    {hoveredDate === date && (
                      <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="rounded-2xl px-3 py-2.5 shadow-2xl whitespace-nowrap text-[11px] bg-slate-900 border border-slate-700/60 text-white">
                          <p className="font-extrabold text-slate-100 text-xs mb-1">
                            {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(date + 'T00:00:00'))}
                          </p>
                          <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-0.5">
                            <Activity className="w-3 h-3 text-blue-400" />
                            <span>{bookingCount} orang booking</span>
                          </div>
                          {bookingCount > 0 ? (
                            <p className="text-emerald-400 font-bold text-xs">
                              {formatCurrency(revenue)}
                            </p>
                          ) : (
                            <p className="text-slate-400 text-[10px]">Belum ada jadwal terisi</p>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 mt-4 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Terbooking</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span>Kosong</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-blue-500" />
              <span>Hari Ini</span>
            </span>
          </div>
        </div>

        {/* Charts column */}
        <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          {/* Header with Switcher */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Analisis Performa Lapangan</h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-2.5 h-2.5 animate-pulse" /> Realtime
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Grafik dinamika pendapatan & volume pengguna booking 7 hari terakhir</p>
              </div>

              {/* View toggle */}
              <div className="flex items-center p-1 bg-white/10 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setChartView('both')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    chartView === 'both' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setChartView('revenue')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    chartView === 'revenue' ? 'bg-slate-900 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pendapatan
                </button>
                <button
                  onClick={() => setChartView('booking')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    chartView === 'booking' ? 'bg-slate-900 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Booking
                </button>
              </div>
            </div>

            {/* Quick KPI pill highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Total 7 Hari</span>
                <span className="text-xs sm:text-sm font-black text-white truncate block">
                  {formatCurrency(total7DaysRev)}
                </span>
              </div>
              <div className="border-x border-white/10/70 px-2 sm:px-3">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Sesi</span>
                <span className="text-xs sm:text-sm font-black text-indigo-700 block">
                  {total7DaysBookings} booking
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Puncak (Tgl {peakDay.label})</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 truncate block">
                  {formatCurrency(peakDay.val)}
                </span>
              </div>
            </div>
          </div>

          {/* Charts area */}
          <div className="space-y-4">
            {(chartView === 'both' || chartView === 'revenue') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Tren Pendapatan (Rp)
                  </span>
                  <span className="text-[10px] text-slate-400">7 hari terakhir</span>
                </div>
                <div className={chartView === 'revenue' ? 'h-[200px]' : 'h-[110px]'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend.data.map((v, i) => ({ label: revenueTrend.labels[i], value: v }))} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="60%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : `${v}`} />
                      <Tooltip content={<ChartTooltipContent isCurrency />} />
                      <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#4f46e5', r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {(chartView === 'both' || chartView === 'booking') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Jumlah Pengguna Booking
                  </span>
                  <span className="text-[10px] text-slate-400">Total reservasi harian</span>
                </div>
                <div className={chartView === 'booking' ? 'h-[200px]' : 'h-[110px]'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingTrend.data.map((v, i) => ({ label: bookingTrend.labels[i], value: v }))} margin={{ top: 6, right: 6, left: -24, bottom: 0 }} barSize={chartView === 'booking' ? 28 : 18}>
                      <defs>
                        <linearGradient id="bookingBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="url(#bookingBarGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Table */}

      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white">Daftar Booking</h3>
            <p className="text-[10px] text-slate-400">Semua reservasi aktif dari database</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
            {bookings.filter((b) => isBookingActive(b)).length} Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Nama Pemesan</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Tiket / Barcode</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Nomor HP</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Jam Booking</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Tanggal</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px]">Status</th>
                <th className="px-5 py-3 font-bold text-slate-400 text-[11px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings
                .filter((b) => isBookingActive(b))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((b) => (
                  <tr key={b.id} className="hover:bg-blue-500/10/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[9px] font-black">{b.customerName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{b.customerName}</p>
                          <p className="text-[10px] text-slate-400">{b.courtName.split(' (')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2">
                      <MiniBarcodeDisplay code={b.bookingCode} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{b.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono font-semibold text-slate-200 text-[11px]">
                          {String(b.startHour).padStart(2, '0')}:00 – {String(b.endHour).padStart(2, '0')}:00
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-300 font-medium">
                          {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(b.date + 'T00:00:00'))}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {b.paymentStatus === 'SETTLEMENT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Lunas
                        </span>
                      ) : b.isManualBooking ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Walk-In
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-400 border border-white/10">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/booking/${b.bookingCode}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 transition-all text-[10px] font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> Tiket
                      </Link>
                    </td>
                  </tr>
                ))}
              {bookings.filter((b) => isBookingActive(b)).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-xs">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-extrabold text-slate-200">Belum Ada Reservasi</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Dashboard bersih & siap digunakan dari awal! Reservasi baru dari tamu secara online atau input kasir manual akan otomatis muncul secara realtime di sini.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Court Form Panel (Add / Edit) ──────────────────────────────────
const SPORT_TYPES: SportType[] = ['Futsal', 'Badminton', 'Padel', 'Mini Soccer', 'Tennis', 'Basket', 'Studio'];

const SPORT_COLORS: Record<SportType, string> = {
  Futsal: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  Badminton: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  Padel: 'bg-violet-500/20 text-violet-400 border-violet-500/20',
  'Mini Soccer': 'bg-green-100 text-green-700 border-green-200',
  Tennis: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  Basket: 'bg-orange-100 text-orange-700 border-orange-200',
  Studio: 'bg-pink-100 text-pink-700 border-pink-200',
};

type CourtForm = {
  name: string;
  sportType: SportType;
  description: string;
  imageUrl: string;
  pricePerHour: number;
  peakPricePerHour: number;
  peakStartHour: number;
  features: string;
  isActive: boolean;
};

const EMPTY_FORM: CourtForm = {
  name: '',
  sportType: 'Futsal',
  description: '',
  imageUrl: '',
  pricePerHour: 100000,
  peakPricePerHour: 0,
  peakStartHour: 18,
  features: '',
  isActive: true,
};

function CourtFormPanel({
  court,
  tenantId,
  onSave,
  onClose,
}: {
  court?: Court;
  tenantId: string;
  onSave: (court: Court) => void;
  onClose: () => void;
}) {
  const isEdit = !!court;
  const [form, setForm] = useState<CourtForm>(
    court
      ? {
          name: court.name,
          sportType: court.sportType,
          description: court.description,
          imageUrl: court.imageUrl,
          pricePerHour: court.pricePerHour,
          peakPricePerHour: court.peakPricePerHour ?? 0,
          peakStartHour: court.peakStartHour ?? 18,
          features: court.features.join(', '),
          isActive: court.isActive,
        }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CourtForm, string>>>({});

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const SPORT_IMAGE_MAP: Record<string, string> = {
    Futsal: 'https://images.unsplash.com/photo-1518063319808-c89b2dbfc31c?w=800&auto=format&fit=crop&q=80',
    Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    Padel: 'https://images.unsplash.com/photo-1629851613917-0d32c0d8d5fb?w=800&auto=format&fit=crop&q=80',
    'Mini Soccer': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    Tennis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=80',
  };

  const validate = () => {
    const e: Partial<Record<keyof CourtForm, string>> = {};
    if (!form.name.trim()) e.name = 'Nama lapangan wajib diisi';
    if (!form.pricePerHour || form.pricePerHour < 1000) e.pricePerHour = 'Harga minimal Rp 1.000';
    if (form.peakPricePerHour && form.peakPricePerHour < form.pricePerHour)
      e.peakPricePerHour = 'Harga peak harus >= harga reguler';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const features = form.features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    const saved: Court = {
      id: court?.id ?? `court-${Date.now()}`,
      tenantId,
      name: form.name.trim(),
      sportType: form.sportType,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim() || SPORT_IMAGE_MAP[form.sportType] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      pricePerHour: form.pricePerHour,
      peakPricePerHour: form.peakPricePerHour || undefined,
      peakStartHour: form.peakPricePerHour ? form.peakStartHour : undefined,
      features,
      isActive: form.isActive,
    };
    onSave(saved);
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:bg-slate-900 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all';
  const errCls = 'text-[10px] text-rose-400 mt-1 font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {isEdit ? 'Detail & Edit Lapangan' : 'Tambah Lapangan Baru'}
                </h2>
                {isEdit && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    form.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}>
                    {form.isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Atur deskripsi, foto fasilitas, dan harga sewa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - scrollable inside card */}
        <form id="court-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Nama */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Nama Lapangan <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="Contoh: Lapangan Futsal A (Vinyl)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
            {errors.name && <p className={errCls}>{errors.name}</p>}
          </div>

          {/* Jenis Olahraga */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Jenis Olahraga <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {SPORT_TYPES.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setForm({ ...form, sportType: sport })}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    form.sportType === sport
                      ? SPORT_COLORS[sport] + ' ring-2 ring-offset-1 ring-emerald-400 shadow-sm'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Deskripsi Lapangan</label>
            <textarea
              rows={2}
              placeholder="Ceritakan keunggulan lapangan (lantai interlock, pencahayaan pro, dll)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Foto Lapangan */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-slate-400" /> Foto Lapangan (Opsional)
            </label>
            <div className="flex gap-2 items-start">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert('Ukuran gambar maksimal 2MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setForm({ ...form, imageUrl: ev.target.result as string });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="court-image-upload"
              />
              <label
                htmlFor="court-image-upload"
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm text-[11px] font-bold flex items-center gap-2 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </label>
              <input
                type="url"
                placeholder="Atau tempel URL gambar..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className={inputCls + ' flex-1 min-w-0'}
              />
            </div>
            {form.imageUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10 h-28 w-full group bg-slate-800">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
                  title="Hapus gambar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!form.imageUrl && (
               <p className="text-[10px] text-slate-400 mt-1">Jika dikosongkan, gambar otomatis disesuaikan dengan jenis olahraga.</p>
            )}
          </div>

          {/* Harga */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10/80 space-y-3">
            <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Pengaturan Harga Sewa
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Harga Reguler / Jam <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  placeholder="Contoh: 75000 atau 100000"
                  value={form.pricePerHour || ''}
                  onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                  className={inputCls + ' pl-9 font-bold text-slate-200'}
                />
              </div>
              {errors.pricePerHour && <p className={errCls}>{errors.pricePerHour}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Harga Peak Hour / Jam</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="0 = tidak ada"
                    value={form.peakPricePerHour || ''}
                    onChange={(e) => setForm({ ...form, peakPricePerHour: Number(e.target.value) })}
                    className={inputCls + ' pl-9 font-bold text-slate-200'}
                  />
                </div>
                {errors.peakPricePerHour && <p className={errCls}>{errors.peakPricePerHour}</p>}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Mulai Jam Peak</label>
                <div className="relative">
                  <select
                    value={form.peakStartHour}
                    onChange={(e) => setForm({ ...form, peakStartHour: Number(e.target.value) })}
                    disabled={!form.peakPricePerHour}
                    className={inputCls + ' appearance-none pr-7 disabled:opacity-40'}
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Fasilitas */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">Fasilitas Lapangan</label>
            <input
              type="text"
              placeholder="Contoh: AC, Shower, Parkir Luas, Bola Disediakan (pisahkan koma)"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className={inputCls}
            />
            {form.features && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.features.split(',').map((f, i) =>
                  f.trim() ? (
                    <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg font-medium">
                      ✓ {f.trim()}
                    </span>
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* Status Aktif */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10/80">
            <div>
              <p className="text-[11px] font-bold text-slate-200">Status Aktif Lapangan</p>
              <p className="text-[10px] text-slate-400">Hanya lapangan aktif yang dapat dipesan pelanggan</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className="cursor-pointer transition-transform active:scale-95"
            >
              {form.isActive ? (
                <ToggleRight className="w-9 h-9 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-400" />
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-white/5/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="court-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 cursor-pointer transition-all active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            {isEdit ? 'Simpan Perubahan' : 'Tambah Lapangan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────
function DeleteConfirmDialog({
  court,
  onConfirm,
  onCancel,
}: {
  court: Court;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-white/10 animate-in zoom-in-95 duration-200 z-10">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-extrabold text-white text-sm">Hapus Lapangan?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lapangan <strong className="text-slate-200">{court.name.split(' (')[0]}</strong> akan dihapus permanen.
            Data booking yang sudah ada tidak akan terpengaruh.
          </p>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5 cursor-pointer transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer transition-all shadow-sm shadow-rose-600/20"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Courts & Schedule Tab ───────────────────────────────────────────
function CourtsTab({
  courts,
  bookings,
  onManualBooking,
  onCourtsChange,
  tenantId,
  tenant,
  courtLimit = 2,
  onOpenSubscription,
}: {
  courts: Court[];
  bookings: Booking[];
  onManualBooking: (courtId?: string, hour?: number, date?: string) => void;
  onCourtsChange: (courts: Court[]) => void;
  tenantId: string;
  tenant: Tenant;
  courtLimit?: number;
  onOpenSubscription?: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [panelOpen, setPanelOpen] = useState<'add' | Court | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Court | null>(null);
  const [activeSection, setActiveSection] = useState<'schedule' | 'courts'>('courts');
  
  const openH = tenant.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
  let closeH = tenant.closeTime ? parseInt(tenant.closeTime.split(':')[0], 10) : 23;
  if (closeH <= openH) closeH += 24;
  const hoursList = Array.from({ length: closeH - openH }, (_, i) => i + openH);

  const handleAddCourtClick = () => {
    const u = getCurrentUser();
    if (u?.isDemo || u?.role === 'DEMO') {
      alert("Mode Demo: Data lapangan tidak bisa ditambah.");
      return;
    }
    if (courts.length >= courtLimit) {
      if (onOpenSubscription) {
        onOpenSubscription();
      }
      return;
    }
    setPanelOpen('add');
  };

  const handleSaveCourt = async (saved: Court) => {
    const u = getCurrentUser();
    if (u?.isDemo || u?.role === 'DEMO') {
      alert("Mode Demo: Data lapangan tidak bisa diubah.");
      return;
    }
    const existing = courts.findIndex((c) => c.id === saved.id);
    let updated: Court[];
    if (existing >= 0) {
      updated = courts.map((c) => (c.id === saved.id ? saved : c));
    } else {
      updated = [...courts, saved];
    }
    await saveCourtsData(updated);
    onCourtsChange(updated);
    setPanelOpen(null);
  };

  const handleDelete = async () => {
    const u = getCurrentUser();
    if (u?.isDemo || u?.role === 'DEMO') {
      alert("Mode Demo: Data lapangan tidak bisa dihapus.");
      return;
    }
    if (!deleteTarget) return;
    const updated = courts.filter((c) => c.id !== deleteTarget.id);
    await saveCourtsData(updated);
    onCourtsChange(updated);
    setDeleteTarget(null);
  };

  const handleToggleActive = (court: Court) => {
    const updated = courts.map((c) => (c.id === court.id ? { ...c, isActive: !c.isActive } : c));
    saveCourtsData(updated);
    onCourtsChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Section Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 shadow-sm gap-0.5">
          <button
            onClick={() => setActiveSection('courts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'courts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Manajemen Lapangan
          </button>
          <button
            onClick={() => setActiveSection('schedule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'schedule' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Kalender Jadwal
          </button>
        </div>
      </div>

      {/* ── Court Management Section ── */}
      {activeSection === 'courts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Daftar Lapangan</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {courts.length}/{courtLimit} lapangan terdaftar · {courts.filter((c) => c.isActive).length} aktif
              </p>
            </div>
            <button
              onClick={handleAddCourtClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Lapangan
            </button>
          </div>

          {courts.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl border border-dashed border-white/10 p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-white">Belum Ada Lapangan Terdaftar</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Venue Anda masih bersih dan siap digunakan dari awal! Klik tombol di bawah untuk menambahkan lapangan pertama Anda beserta tarif per jam dan fotonya.
              </p>
              <button
                onClick={handleAddCourtClick}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Lapangan Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className={`bg-slate-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all group ${
                    court.isActive ? 'border-white/10' : 'border-white/10 opacity-75'
                  }`}
                >
                  {/* Image */}
                  <div className="relative">
                    <img src={court.imageUrl} alt={court.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleActive(court)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border cursor-pointer transition-all ${
                          court.isActive
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                            : 'bg-white/20 text-slate-400 border-white/20'
                        }`}
                      >
                        {court.isActive ? 'AKTIF' : 'NON-AKTIF'}
                      </button>
                    </div>
                    {/* Sport type */}
                    <div className="absolute bottom-2 left-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        SPORT_COLORS[court.sportType] ?? 'bg-white/10 text-slate-300 border-white/10'
                      }`}>
                        {court.sportType}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-extrabold text-sm text-white truncate">{court.name.split(' (')[0]}</h4>
                    {court.description && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{court.description}</p>
                    )}

                    {/* Pricing */}
                    <div className="mt-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Reguler / Jam</span>
                        <span className="font-black text-white">{formatCurrency(court.pricePerHour)}</span>
                      </div>
                      {court.peakPricePerHour && (
                        <div className="flex items-center justify-between text-[10px] mt-1">
                          <span className="text-amber-400 font-medium">Peak Hour (ab. {String(court.peakStartHour ?? 18).padStart(2, '0')}:00)</span>
                          <span className="font-black text-amber-400">{formatCurrency(court.peakPricePerHour)}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {court.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {court.features.slice(0, 3).map((f, i) => (
                          <span key={i} className="text-[9px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-md">{f}</span>
                        ))}
                        {court.features.length > 3 && (
                          <span className="text-[9px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-md">+{court.features.length - 3} lagi</span>
                        )}
                      </div>
                    )}

                    {/* Booking stats */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <span className="text-[10px] text-slate-400">
                        {bookings.filter((b) => b.courtId === court.id && isBookingActive(b)).length} kali dibooking
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPanelOpen(court)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                          title="Buka detail & edit lapangan"
                        >
                          <Pencil className="w-3 h-3 text-slate-400" />
                          <span>Detail & Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(court)}
                          className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
                          title="Hapus lapangan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Schedule / Calendar Section ── */}
      {activeSection === 'schedule' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-white">Kalender Jadwal</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Klik slot kosong untuk booking manual</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => onManualBooking(undefined, undefined, selectedDate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Booking Manual
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-semibold px-1">
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 rounded bg-emerald-200" /> Tersedia</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 rounded bg-blue-400" /> Online DP</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 rounded bg-amber-400" /> Walk-In Kasir</span>
          </div>

          {courts.filter((c) => c.isActive).length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-sm font-bold text-slate-400">Tidak ada lapangan aktif</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-3.5 font-bold text-slate-300 w-24 text-center border-r border-white/10">Jam</th>
                    {courts.filter((c) => c.isActive).map((court) => (
                      <th key={court.id} className="p-3.5 font-bold text-white border-r border-white/10 last:border-r-0 min-w-[160px]">
                        <span className="block text-xs">{court.name.split(' (')[0]}</span>
                        <span className="text-[9px] font-normal text-slate-400">{formatCurrency(court.pricePerHour)}/jam</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {hoursList.map((hour) => (
                    <tr key={hour} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-slate-400 bg-white/5 border-r border-white/10 text-[11px]">
                        {String(hour).padStart(2, '0')}:00
                      </td>
                      {courts.filter((c) => c.isActive).map((court) => {
                        const b = bookings.find(
                          (book) =>
                            book.courtId === court.id &&
                            book.date === selectedDate &&
                            hour >= book.startHour &&
                            hour < book.endHour &&
                            isBookingActive(book)
                        );
                        if (b) {
                          return (
                            <td key={court.id} className="p-2 border-r border-white/10 last:border-r-0">
                              <div className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between h-14 ${b.isManualBooking ? 'bg-amber-500/10 border-amber-500/20 text-amber-900' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold truncate text-[11px]">{b.customerName}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80">{b.isManualBooking ? 'Kasir' : 'Online'}</span>
                                </div>
                                <span className="text-[10px] font-mono">{b.customerPhone}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={court.id} className="p-2 border-r border-white/10 last:border-r-0">
                            <button
                              onClick={() => onManualBooking(court.id, hour, selectedDate)}
                              className="w-full h-14 rounded-xl border border-dashed border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10/60 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400 group cursor-pointer"
                            >
                              <span className="text-[10px] font-semibold group-hover:hidden">Kosong</span>
                              <span className="text-[10px] font-bold hidden group-hover:flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Booking
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Panel */}
      {panelOpen !== null && (
        <CourtFormPanel
          court={panelOpen === 'add' ? undefined : panelOpen}
          tenantId={tenantId}
          onSave={handleSaveCourt}
          onClose={() => setPanelOpen(null)}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          court={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Finance Tab ─────────────────────────────────────────────────────
function FinanceTab({
  courts, bookings, metrics,
}: {
  courts: Court[];
  bookings: Booking[];
  metrics: ReturnType<typeof getFinancialMetrics>;
}) {
  const courtRevenue = courts.map((c) => {
    const rev = bookings.filter((b) => b.courtId === c.id && isBookingActive(b)).reduce((s, b) => s + b.totalAmount, 0);
    const count = bookings.filter((b) => b.courtId === c.id && isBookingActive(b)).length;
    return { court: c, rev, count };
  });
  const totalRev = courtRevenue.reduce((s, r) => s + r.rev, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Laporan Keuangan</h2>
          <p className="text-[10px] text-slate-400">Data real-time dari sistem booking</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:bg-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> Cetak PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-slate-400">Omset Bulan Ini</p>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(metrics.monthRevenue)}</p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-1">Tercatat otomatis sistem</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-slate-400">DP Online (Midtrans)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(metrics.todayDp)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Langsung terverifikasi</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-slate-400">Anti-Ghosting Saving</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(metrics.antiGhostingSavings)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Estimasi kerugian dicegah</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Pendapatan per Lapangan</h3>
        </div>
        <div className="p-5 space-y-3">
          {courtRevenue.map(({ court, rev, count }) => {
            const pct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
            return (
              <div key={court.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{court.name.split(' (')[0]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{count} sesi</span>
                    <span className="font-black text-white">{formatCurrency(rev)}</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-slate-400">{pct.toFixed(1)}% dari total pendapatan</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Rincian Transaksi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-5 py-3 font-bold text-slate-400">Kode</th>
                <th className="px-5 py-3 font-bold text-slate-400">Pelanggan</th>
                <th className="px-5 py-3 font-bold text-slate-400">Lapangan</th>
                <th className="px-5 py-3 font-bold text-slate-400">Total</th>
                <th className="px-5 py-3 font-bold text-slate-400">DP</th>
                <th className="px-5 py-3 font-bold text-slate-400">Sisa</th>
                <th className="px-5 py-3 font-bold text-slate-400">Metode</th>
                <th className="px-5 py-3 font-bold text-slate-400">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings
                .filter((b) => isBookingActive(b))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-white">{b.bookingCode}</td>
                    <td className="px-5 py-3 font-semibold text-slate-200">{b.customerName}</td>
                    <td className="px-5 py-3 text-slate-400">{b.courtName.split(' (')[0]}</td>
                    <td className="px-5 py-3 font-black text-white">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-5 py-3 text-emerald-400 font-semibold">{formatCurrency(b.dpAmount)}</td>
                    <td className={`px-5 py-3 font-bold ${b.remainingAmount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {b.remainingAmount === 0 ? 'Lunas' : formatCurrency(b.remainingAmount)}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{b.paymentMethod || '-'}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(b.date + 'T00:00:00'))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Account / Profile Tab ──────────────────────────────────────────
function AccountTab({
  tenant,
  onTenantChange,
  onOpenSubscription,
}: {
  tenant: Tenant;
  onTenantChange: (updated: Tenant) => void;
  onOpenSubscription?: () => void;
}) {
  const [form, setForm] = useState<Tenant>({ ...tenant });
  const [saveStatus, setSaveStatus] = useState<'SUCCESS' | 'NO_CHANGES' | 'ERROR' | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [facilityInput, setFacilityInput] = useState('');

  // Keep subscription in sync if it changes from outside (e.g. via SubscriptionModal)
  useEffect(() => {
    setForm((prev) => {
      if (prev.subscriptionTier === tenant.subscriptionTier && prev.subscription === tenant.subscription) {
        return prev;
      }
      return {
        ...prev,
        subscriptionTier: tenant.subscriptionTier,
        subscription: tenant.subscription,
      };
    });
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getCurrentUser();
    if (u?.isDemo || u?.role === 'DEMO') {
      alert("Mode Demo: Pengaturan tidak bisa diubah.");
      return;
    }
    
    // Validation
    const requiredFields = ['name', 'ownerName', 'slug', 'description', 'phone', 'address', 'city', 'openTime', 'closeTime'];
    const missingFields = requiredFields.filter(key => !form[key as keyof Tenant]?.toString().trim());
    
    if (missingFields.length > 0) {
      setFormErrors(missingFields);
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }
    
    setFormErrors([]);

    if (JSON.stringify(form) === JSON.stringify(tenant)) {
      setSaveStatus('NO_CHANGES');
      setTimeout(() => setSaveStatus(null), 3500);
      return;
    }
    await saveTenantData(form);
    onTenantChange(form);
    setSaveStatus('SUCCESS');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleAddFacility = () => {
    const val = facilityInput.trim();
    if (!val) return;
    if (form.facilities.includes(val)) return;
    setForm((prev) => ({
      ...prev,
      facilities: [...prev.facilities, val],
    }));
    setFacilityInput('');
  };

  const handleRemoveFacility = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== idx),
    }));
  };

  const handleAddSuggestedFacility = (fac: string) => {
    if (form.facilities.includes(fac)) return;
    setForm((prev) => ({
      ...prev,
      facilities: [...prev.facilities, fac],
    }));
  };

  const photoPresets = [
    {
      name: 'Futsal Sintetis Pro',
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Mini Soccer Hijau',
      url: 'https://images.unsplash.com/photo-1529900248679-b1d54d193d56?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Badminton Arena Karpet',
      url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Padel / Tennis Modern',
      url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Basketball Indoor Court',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
    },
  ];

  const suggestedFacilities = [
    'Parkir Mobil & Motor Luas',
    'Locker Room & Shower Air Hangat',
    'WiFi Gratis Berkecepatan Tinggi',
    'Musholla Bersih & Ber-AC',
    'Kantin & Coffee Corner',
    'Tribun Penonton',
    'Penerangan LED Standar Turnamen',
    'Penyewaan Rompi & Bola',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-white/10/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Pengaturan Akun & Profil Usaha</h2>
              <p className="text-xs text-slate-400">
                Data di halaman ini akan otomatis ditampilkan pada web publik tamu saat booking lapangan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/b/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all border border-white/10/80"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Lihat Tampilan Web Tamu</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {saveStatus === 'SUCCESS' && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 w-[340px] p-4 rounded-2xl bg-emerald-950/95 backdrop-blur-xl border border-emerald-500/30 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-400 mb-1">Berhasil Disimpan!</h4>
              <p className="text-xs text-emerald-200/70 font-medium leading-relaxed">
                Perubahan profil usaha Anda sudah tersimpan dan aktif di web publik tamu.
              </p>
              <Link
                href={`/b/${form.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 mt-2 text-emerald-400 hover:text-emerald-300 text-xs font-bold"
              >
                Cek Halaman Tamu <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {saveStatus === 'NO_CHANGES' && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 w-[340px] p-4 rounded-2xl bg-amber-950/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-400 mb-1">Tidak Ada Perubahan</h4>
              <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
                Anda belum melakukan perubahan apapun pada profil usaha. Data Anda masih sama.
              </p>
            </div>
          </div>
        </div>
      )}

      {saveStatus === 'ERROR' && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 w-[340px] p-4 rounded-2xl bg-rose-950/95 backdrop-blur-xl border border-rose-500/30 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-400 mb-1">Gagal Menyimpan</h4>
              <p className="text-xs text-rose-200/70 font-medium leading-relaxed">
                Mohon lengkapi semua form yang wajib diisi (bergaris merah).
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        {/* Section 1: Informasi Usaha & Deskripsi */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-white/10/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-400" /> Informasi Utama & Deskripsi Usaha
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nama venue dan deskripsi usaha Anda yang tampil sebagai judul dan pengantar di web tamu.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Tampil di Web Tamu
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nama Tempat Usaha / Domain <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Arena Futsal & Badminton Nusantara"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all ${
                    formErrors.includes('name') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 text-blue-400" /> Nama Pemilik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.ownerName || ''}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all ${
                    formErrors.includes('ownerName') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-400" /> Slug URL / Link Halaman Booking <span className="text-rose-500">*</span>
              </label>
              <div className={`flex items-center rounded-xl border overflow-hidden bg-slate-900 ${
                formErrors.includes('slug') ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-white/10 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
              }`}>
                <span className="px-3 text-[11px] font-mono text-slate-400 bg-white/5 border-r border-white/10 py-2.5 select-none">
                  jadwalin.id/b/
                </span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="venue-anda"
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-200 outline-none bg-transparent"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Alamat standar bawaan platform untuk tamu Anda.
              </p>
            </div>
          </div>

          {/* Custom URL Configuration (Enterprise Feature) */}
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white">Custom URL Venue</span>
              </div>
              {form.subscriptionTier === 'ENTERPRISE' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <Crown className="w-3 h-3 text-violet-400" /> Enterprise Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/10">
                  <Lock className="w-3 h-3" /> Khusus Enterprise
                </span>
              )}
            </div>

            {form.subscriptionTier === 'ENTERPRISE' ? (
              <div className="space-y-2">
                <div className="flex items-center rounded-xl border border-violet-500/30 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 overflow-hidden bg-slate-900">
                  <span className="px-3 text-[11px] font-mono text-slate-400 bg-white/5 border-r border-white/10 py-2.5 select-none">
                    https://jadwalin.id/
                  </span>
                  <input
                    type="text"
                    value={form.customSubdomain || ''}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setForm({
                        ...form,
                        customSubdomain: val,
                        slug: val
                      });
                    }}
                    placeholder={form.slug || 'venue-anda'}
                    className="w-full px-3 py-2 text-xs font-semibold text-white outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Venue Anda dapat diakses langsung oleh tamu melalui link eksklusif{' '}
                  <span className="text-violet-300 font-mono font-semibold">
                    https://jadwalin.id/{form.customSubdomain || form.slug || 'venue'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-300">
                    URL bawaan:{' '}
                    <span className="font-mono text-slate-400">
                      jadwalin.id/b/{form.slug || 'venue'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Upgrade ke paket <b>Enterprise GOR</b> untuk kustomisasi URL eksklusif jadwalin.id/nama-venue secara bebas sesuai branding venue Anda.
                  </p>
                </div>
                {onOpenSubscription && (
                  <button
                    type="button"
                    onClick={onOpenSubscription}
                    className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5 text-violet-400" />
                    <span>Upgrade Enterprise</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Deskripsi Lengkap Usaha <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {form.description.length} karakter
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ceritakan tentang tempat usaha Anda, keunggulan lapangan, fasilitas, standar lantai/rumput sintetis, suasana, serta kemudahan booking..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-200 leading-relaxed outline-none transition-all resize-y ${
                formErrors.includes('description') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tips: Deskripsi yang menarik dan jelas akan meningkatkan kepercayaan calon pelanggan untuk booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Nomor WhatsApp CS / Pemilik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Contoh: 081234567890"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all ${
                  formErrors.includes('phone') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tombol WhatsApp di web tamu akan langsung terhubung ke nomor ini.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Resmi Usaha
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Contoh: info@venuesaya.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Foto Tempat Usaha & Logo */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-white/10/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-indigo-600" /> Foto Tempat Usaha & Logo Profil
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Foto tempat usaha akan ditampilkan di header web tamu agar terlihat profesional dan meyakinkan.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Visual Branding
            </span>
          </div>

          {/* Banner / Foto Tempat Usaha */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              Foto Utama Tempat Usaha (Banner / Foto Venue)
            </label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full space-y-2">
                <div className="flex gap-2 items-start">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Ukuran file maksimal 2MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setForm({ ...form, bannerUrl: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="tenant-banner-upload"
                  />
                  <label
                    htmlFor="tenant-banner-upload"
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Upload foto dari perangkat"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </label>
                  <input
                    type="url"
                    value={form.bannerUrl || ''}
                    onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                    placeholder="Atau URL https://..."
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>
                
                {/* Presets */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    Pilih Cepat Foto Siap Pakai:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, bannerUrl: preset.url })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          form.bannerUrl === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                        }`}
                      >
                        📷 {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Foto */}
              <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden border border-white/10 bg-white/10 relative shrink-0 shadow-xs">
                {form.bannerUrl ? (
                  <img
                    src={form.bannerUrl}
                    alt="Preview Tempat Usaha"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = photoPresets[0].url;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImagePlus className="w-6 h-6 mb-1 text-slate-300" />
                    <span>Belum ada foto</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white">
                  Preview Foto
                </div>
              </div>
            </div>
          </div>

          {/* Logo Profil Venue */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="text-xs font-bold text-slate-300 block">
              Logo / Icon Profil Usaha (Opsional)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/10 shrink-0 shadow-xs flex items-center justify-center">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex gap-2 items-start">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Ukuran file maksimal 2MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setForm({ ...form, logoUrl: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="tenant-logo-upload"
                  />
                  <label
                    htmlFor="tenant-logo-upload"
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Upload logo dari perangkat"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </label>
                  <input
                    type="url"
                    value={form.logoUrl || ''}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="Atau URL https://..."
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-200 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Alamat & Lokasi */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-white/10/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" /> Lokasi & Alamat Tempat Usaha
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pastikan alamat jelas agar penyewa lapangan mudah menemukan venue Anda.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Lokasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Alamat Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Contoh: Jl. Lapangan Olahraga No. 8, Sukamaju"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all ${
                  formErrors.includes('address') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Contoh: Jakarta Barat, DKI Jakarta"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all ${
                  formErrors.includes('city') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Jam Operasional & Kebijakan DP */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-white/10/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Jam Operasional & Ketentuan DP
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Menentukan jam buka slot lapangan dan persentase uang muka minimum untuk booking.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Operasional
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Jam Buka Venue
              </label>
              <input
                type="text"
                required
                value={form.openTime}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                placeholder="07:00"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all font-mono ${
                  formErrors.includes('openTime') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Format: JJ:MM (cth: 07:00)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Jam Tutup Venue
              </label>
              <input
                type="text"
                required
                value={form.closeTime}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                placeholder="23:00"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-200 outline-none transition-all font-mono ${
                  formErrors.includes('closeTime') ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : 'border-white/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-transparent'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Format: JJ:MM (cth: 23:00)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Minimum DP (%)
              </label>
              <div className="flex items-center rounded-xl border border-white/10 overflow-hidden bg-slate-900">
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={form.minDpPercentage}
                  onChange={(e) => setForm({ ...form, minDpPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                />
                <span className="px-3 py-2 text-xs font-bold text-slate-400 bg-white/5 border-l border-white/10">
                  %
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Besaran uang muka saat booking</span>
            </div>
          </div>
        </div>

        {/* Section 5: Fasilitas Usaha */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-white/10/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" /> Fasilitas Tempat Usaha
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fasilitas yang Anda cantumkan akan muncul sebagai badge verifikasi di web tamu.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {form.facilities.length} Fasilitas
            </span>
          </div>

          {/* Current tags */}
          <div className="flex flex-wrap gap-2">
            {form.facilities.map((fac, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10/80 text-xs font-bold text-slate-300 shadow-2xs"
              >
                <span>✓ {fac}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFacility(idx)}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-rose-100 hover:text-rose-400 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                  title="Hapus fasilitas"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={facilityInput}
              onChange={(e) => setFacilityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFacility();
                }
              }}
              placeholder="Ketik fasilitas baru (contoh: Kantin, Shower Air Hangat)..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-white/10 focus:border-blue-600 text-xs font-semibold text-slate-200 outline-none"
            />
            <button
              type="button"
              onClick={handleAddFacility}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Tambah
            </button>
          </div>

          {/* Suggestions */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
              Rekomendasi Fasilitas Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedFacilities.map((sug, idx) => {
                const isAdded = form.facilities.includes(sug);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSuggestedFacility(sug)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      isAdded
                        ? 'opacity-40 bg-white/10 text-slate-400 border-white/10 cursor-default'
                        : 'bg-teal-50/70 hover:bg-teal-100 text-teal-800 border-teal-200 cursor-pointer'
                    }`}
                  >
                    {isAdded ? '✓ ' : '+ '} {sug}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="sticky bottom-4 z-20 p-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10/90 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Perubahan langsung tersimpan di sistem Jadwalin.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/b/${form.slug}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Web</span>
            </Link>

            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                saveStatus === 'SUCCESS'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  : saveStatus === 'ERROR'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                  : saveStatus === 'NO_CHANGES'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              }`}
            >
              {saveStatus === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Berhasil Disimpan!</span>
                </>
              ) : saveStatus === 'ERROR' ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Lengkapi Data!</span>
                </>
              ) : saveStatus === 'NO_CHANGES' ? (
                <>
                  <Info className="w-4 h-4" />
                  <span>Tidak Ada Perubahan</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil Usaha</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Main Admin Content ──────────────────────────────────────────────
function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoQuery = searchParams.get('demo') === 'true';

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [prefilledCourtId, setPrefilledCourtId] = useState<string | undefined>(undefined);
  const [prefilledHour, setPrefilledHour] = useState<number | undefined>(undefined);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Real-time Inbox Notifications & Toast Alert states
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [activeToastNotif, setActiveToastNotif] = useState<InboxNotification | null>(null);
  const prevLatestBookingIdRef = React.useRef<string | null>(null);

  const refreshAllData = useCallback(async () => {
    const t = await getTenantData();
    if (t) setTenant(t);
    const c = await getCourtsData();
    setCourts(c);

    const localBookings = await getBookingsData();
    if (localBookings && localBookings.length > 0) {
      setBookings(localBookings);
    }

    // Auto-detect newly arrived bookings from guest web or API
    if (localBookings && localBookings.length > 0) {
      const newestBooking = localBookings[0];
      if (prevLatestBookingIdRef.current && newestBooking.id !== prevLatestBookingIdRef.current) {
        // Prevent manual bookings from triggering a popup for the person who created it
        if (!newestBooking.isManualBooking) {
          const notif = createNotificationFromBooking(newestBooking);
          setActiveToastNotif(notif);
          playNotificationSound();
        }
      }
      prevLatestBookingIdRef.current = newestBooking.id;
    }

    try {
      const res = await fetch(`/api/bookings?tenantId=${tenant?.id || currentUser?.tenantId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const serverBookings: Booking[] = json.data;
          const mergedMap = new Map<string, Booking>();
          serverBookings.forEach((b) => mergedMap.set(b.id, b));
          localBookings.forEach((b) => {
            if (!mergedMap.has(b.id)) {
              mergedMap.set(b.id, b);
            }
          });
          const merged = Array.from(mergedMap.values());
          setBookings(merged);
          saveBookingsData(merged);
        }
      }
    } catch {
      // fallback to local data
    }
  }, []);

  // Real-time notification synchronization & listeners
  useEffect(() => {
    setNotifications(getInboxNotifications());

    // 1. Same-tab real-time event listener
    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent<InboxNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === customEvent.detail.id || n.bookingCode === customEvent.detail.bookingCode)) {
            return prev;
          }
          return [customEvent.detail, ...prev];
        });
        setActiveToastNotif(customEvent.detail);
        playNotificationSound();
      }
    };
    window.addEventListener(EVENT_NEW_BOOKING_NOTIFICATION, handleNewNotif);

    // 2. Cross-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jadwalin_inbox_notifications' && e.newValue) {
        try {
          const list: InboxNotification[] = JSON.parse(e.newValue);
          setNotifications(list);
          const latestUnread = list.find((n) => !n.isRead);
          if (latestUnread) {
            setActiveToastNotif(latestUnread);
            playNotificationSound();
          }
        } catch {}
      } else if (e.key === 'jadwalin_bookings_data') {
        refreshAllData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NEW_BOOKING_NOTIFICATION, handleNewNotif);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAllData]);

  useEffect(() => {
    async function initAuth() {
      let user = getCurrentUser();
      if (!user && isDemoQuery) user = await loginAsDemo();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);
      setIsAuthLoading(false);
      await refreshAllData();
    }
    initAuth();

    // Polling setiap 10 detik agar booking tamu online & walk-in kasir langsung muncul di layar admin
    const interval = setInterval(refreshAllData, 10000);
    return () => clearInterval(interval);
  }, [router, isDemoQuery, refreshAllData]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const handleManualBookingClick = (courtId?: string, hour?: number, date?: string) => {
    setPrefilledCourtId(courtId);
    setPrefilledHour(hour);
    setPrefilledDate(date);
    setIsManualModalOpen(true);
  };

  const metrics = useMemo(() => getFinancialMetrics(bookings), [bookings]);

  const isDemo = Boolean(currentUser?.isDemo || currentUser?.role === 'DEMO');
  const trialInfo = useMemo(() => {
    return tenant ? checkSubscriptionTrialStatus(tenant) : { isTrial: false, isExpired: false, daysLeft: 0, endsAt: '' };
  }, [tenant]);
  const isLockedDueToExpired = Boolean(trialInfo.isTrial && trialInfo.isExpired && !isDemo);

  useEffect(() => {
    if (isLockedDueToExpired || searchParams.get('openSubscription') === 'true') {
      setIsSubscriptionModalOpen(true);
      // Clean up URL to avoid re-triggering
      if (searchParams.get('openSubscription') === 'true') {
        const url = new URL(window.location.href);
        url.searchParams.delete('openSubscription');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isLockedDueToExpired, searchParams]);

  if (isAuthLoading || !tenant || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <p className="text-slate-400 font-medium text-sm">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  const currentTier = tenant.subscription?.tier || tenant.subscriptionTier || 'STARTER';
  const tierName =
    currentTier === 'ENTERPRISE'
      ? 'Enterprise GOR'
      : currentTier === 'PRO'
      ? 'Juara Pro'
      : 'Starter UMKM';

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        tenantName={tenant.name}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        tenantSlug={tenant.slug}
        tierName={tierName}
        trialInfo={trialInfo}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        unreadNotifsCount={unreadNotifsCount}
        onOpenInbox={() => setIsInboxModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-5 py-3 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-slate-400 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="lg:hidden flex items-center shrink-0">
              <Image src="/logo-icon.png" alt="Jadwalin" width={28} height={28} className="w-7 h-7 object-contain" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-white">
                {activeTab === 'home' && 'Dashboard Overview'}
                {activeTab === 'courts' && 'Lapangan & Jadwal'}
                {activeTab === 'finance' && 'Laporan Keuangan'}
                {activeTab === 'account' && 'Pengaturan Akun & Profil Usaha'}
              </h1>
              <p className="text-[10px] text-slate-400">{tenant.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg">
                <Sparkles className="w-3 h-3" /> Demo Mode
              </span>
            )}

            <button
              onClick={() => handleManualBookingClick()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Booking Walk-In</span>
              <span className="sm:hidden">+ Baru</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* JIKA TRIAL HABIS: AKSES DASBOR DITAHAN DAN MUNCULKAN SCREEN TERKUNCI */}
          {isLockedDueToExpired ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-slate-900 rounded-3xl border border-rose-500/20 shadow-sm max-w-2xl mx-auto my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-inner">
                <Lock className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  Masa Percobaan Trial 7 Hari Berakhir
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Akses Dasbor Ditahan Sementara
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Masa percobaan gratis 7 hari untuk venue <b>{tenant.name}</b> telah selesai. Silakan perpanjang paket langganan Anda untuk membuka kunci dasbor dan melanjutkan seluruh operasional venue Anda.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
                >
                  Buka Pilihan Paket & Perpanjang Sekarang
                </button>

                {/* Tombol simulasi reset untuk memudahkan pengujian owner */}
                <button
                  type="button"
                  onClick={async () => {
                    const restored = await simulateSetTrialDays(7);
                    setTenant(restored);
                    setIsSubscriptionModalOpen(false);
                  }}
                  className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
                  title="Kembalikan status ke masa trial 7 hari"
                >
                  Kembalikan ke Trial 7 Hari (Tes)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* BANNER KETERANGAN TRIAL 7 HARI JIKA MASIH AKTIF */}
              {trialInfo.isTrial && !trialInfo.isExpired && !isDemo && (
                <div className="mb-6 p-4.5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-300/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-black">
                      <Zap className="w-5 h-5 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Akun Dalam Masa Percobaan (Trial 7 Hari)
                        </span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          Sisa {trialInfo.daysLeft} Hari Lagi
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                        Anda sedang menikmati akses gratis seluruh fitur sistem Jadwalin. Masa trial berlaku hingga{' '}
                        <span className="font-bold text-white">
                          {trialInfo.endsAt ? formatDateIndo(trialInfo.endsAt) : '7 hari ke depan'}
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await simulateSetTrialDays(0);
                        setTenant(updated);
                        setIsSubscriptionModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-slate-900 hover:bg-amber-500/10 text-[11px] font-bold text-amber-800 transition-all cursor-pointer"
                      title="Klik untuk mensimulasikan kondisi masa trial habis"
                    >
                      Simulasi Trial Habis (0 Hari)
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      Upgrade Paket Sekarang
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'home' && (
                <HomeTab
                  tenant={tenant}
                  courts={courts}
                  bookings={bookings}
                  metrics={metrics}
                  onManualBooking={() => handleManualBookingClick()}
                />
              )}
              {activeTab === 'courts' && (
                <CourtsTab
                  courts={courts}
                  bookings={bookings}
                  onManualBooking={handleManualBookingClick}
                  onCourtsChange={setCourts}
                  tenantId={tenant.id}
                  tenant={tenant}
                  courtLimit={tenant.subscription?.courtLimit || (currentTier === 'PRO' ? 6 : currentTier === 'ENTERPRISE' ? 99 : 2)}
                  onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                />
              )}
              {activeTab === 'finance' && (
                <FinanceTab courts={courts} bookings={bookings} metrics={metrics} />
              )}
              {activeTab === 'account' && (
                <AccountTab
                  tenant={tenant}
                  onTenantChange={setTenant}
                  onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      <ManualBookingModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        courts={courts}
        initialCourtId={prefilledCourtId}
        initialDate={prefilledDate || getTodayDateString()}
        initialHour={prefilledHour}
        openHour={(() => {
          const o = tenant?.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
          return o;
        })()}
        closeHour={(() => {
          const o = tenant?.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
          let c = tenant?.closeTime ? parseInt(tenant.closeTime.split(':')[0], 10) : 23;
          if (c <= o) c += 24;
          return c;
        })()}
        onSuccess={async (newBooking) => {
          if (newBooking) {
            const u = getCurrentUser();
            if (u?.isDemo || u?.role === 'DEMO') {
              alert("Mode Demo: Booking manual tidak bisa disimpan.");
              return;
            }
            await addBooking(newBooking);
            setBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);
          }
          await refreshAllData();
        }}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          if (!isLockedDueToExpired) {
            setIsSubscriptionModalOpen(false);
          }
        }}
        tenant={tenant}
        isLockedDueToExpired={isLockedDueToExpired}
        onLogout={handleLogout}
        isDemo={isDemo}
        onSuccess={(updated) => {
          setTenant(updated);
          refreshAllData();
          setIsSubscriptionModalOpen(false);
        }}
      />

      <NotificationInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
      />

      <BookingToastAlert
        notification={activeToastNotif}
        onClose={() => setActiveToastNotif(null)}
        onOpenInbox={() => setIsInboxModalOpen(true)}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <p className="text-slate-400 font-medium text-sm">Memuat Dasbor Admin...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
