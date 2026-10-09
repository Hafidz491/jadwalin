'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Star,
  Sparkles,
  Calendar as CalendarIcon,
  CalendarCheck2,
  CheckCircle2,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { InteractiveTimeGrid } from '@/components/InteractiveTimeGrid';
import { BookingModal } from '@/components/BookingModal';
import { getTenantData, getCourtsData, getBookingsData, saveBookingsData, INITIAL_TENANT } from '@/lib/data';
import { Tenant, Court, Booking } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange, getNextDays, getTodayDateString } from '@/lib/utils';

export default function TenantBookingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [tenant, setTenant] = useState<Tenant>(() => INITIAL_TENANT);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Selection states
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [durationPreset, setDurationPreset] = useState<number>(1);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const availableDays = getNextDays(14);

  const refreshBookings = async () => {
    // Real-time tenant profile sync
    const loadedTenant = await getTenantData();
    if (loadedTenant) setTenant(loadedTenant);
    const loadedCourts = await getCourtsData();
    if (loadedCourts) setCourts(loadedCourts);

    try {
      const currentTenantId = loadedTenant?.id || tenant.id;
      const res = await fetch(`/api/bookings?tenantId=${currentTenantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setBookings(json.data);
          await saveBookingsData(json.data);
          return;
        }
      }
    } catch {
      // fallback to local storage
    }
    setBookings(await getBookingsData());
  };

  useEffect(() => {
    setIsMounted(true);
    async function load() {
      const loadedTenant = await getTenantData();
      const loadedCourts = await getCourtsData();
      const loadedBookings = await getBookingsData();
      if (loadedTenant) setTenant(loadedTenant);
      if (loadedCourts) setCourts(loadedCourts);
      if (loadedBookings) setBookings(loadedBookings);
      if (loadedCourts && loadedCourts.length > 0) {
        setSelectedCourtId((prev) => prev || loadedCourts[0].id);
      }
    }
    load();
  }, []);

  // Real-time synchronization: poll every 15s to catch new manual/online bookings
  useEffect(() => {
    if (!isMounted) return;
    refreshBookings();
    const interval = setInterval(refreshBookings, 15000);
    return () => clearInterval(interval);
  }, [isMounted, selectedDate, selectedCourtId]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center animate-pulse">
            <CalendarCheck2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="animate-pulse text-slate-400 font-medium text-sm">Memuat jadwal venue...</div>
        </div>
      </div>
    );
  }

  const currentCourt = courts.find((c) => c.id === selectedCourtId) || courts[0] || null;

  const isHourAvailable = (h: number): boolean => {
    if (!currentCourt) return false;
    // 1. Check past hour on today
    const todayStr = getTodayDateString();
    const currentHour = new Date().getHours();
    if (selectedDate === todayStr && h <= currentHour) {
      return false;
    }

    // 2. Check operational hours
    const openH = tenant.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
    let closeH = tenant.closeTime ? parseInt(tenant.closeTime.split(':')[0], 10) : 23;
    if (closeH <= openH) closeH += 24;
    if (h < openH || h >= closeH) return false;

    // 3. Check conflicting bookings and auto-expire pending bookings
    const now = Date.now();
    const isConflict = bookings.some((b) => {
      if (b.courtId !== currentCourt.id || b.date !== selectedDate) return false;
      if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'NO_SHOW') return false;
      if (b.bookingStatus === 'PENDING_PAYMENT') {
        const isExpired = b.expiresAt
          ? new Date(b.expiresAt).getTime() < now
          : now - new Date(b.createdAt).getTime() > 15 * 60 * 1000;
        if (isExpired) return false;
      }
      return h >= b.startHour && h < b.endHour;
    });

    return !isConflict;
  };

  const handleDurationPresetClick = (targetDuration: number) => {
    setDurationPreset(targetDuration);
    setSelectionNotice(null);

    if (selectedHours.length > 0) {
      const sorted = [...selectedHours].sort((a, b) => a - b);
      const startH = sorted[0];
      const newHours: number[] = [];

      for (let i = 0; i < targetDuration; i++) {
        const candidate = startH + i;
        if (isHourAvailable(candidate)) {
          newHours.push(candidate);
        } else {
          setSelectionNotice(
            `Slot ${candidate}.00 sudah terisi/tidak tersedia. Berhasil memilih ${newHours.length} jam.`
          );
          break;
        }
      }

      if (newHours.length > 0) {
        setSelectedHours(newHours);
      }
    }
  };

  const handleToggleHour = (hour: number) => {
    setSelectionNotice(null);

    // If a duration preset (>1) is active and clicking a new starting slot
    if (durationPreset > 1 && (!selectedHours.includes(hour) || selectedHours.length === 1)) {
      const newHours: number[] = [];
      for (let i = 0; i < durationPreset; i++) {
        const candidate = hour + i;
        if (isHourAvailable(candidate)) {
          newHours.push(candidate);
        } else {
          setSelectionNotice(
            `Slot ${candidate}.00 sudah terisi/tutup. Dipilih ${newHours.length} jam yang tersedia.`
          );
          break;
        }
      }
      if (newHours.length > 0) {
        setSelectedHours(newHours);
        return;
      }
    }

    // Toggle off if already selected
    if (selectedHours.includes(hour)) {
      if (selectedHours.length <= 1) {
        setSelectedHours([]);
      } else {
        const sorted = [...selectedHours].sort((a, b) => a - b);
        if (hour === sorted[sorted.length - 1]) {
          setSelectedHours(sorted.slice(0, -1));
        } else if (hour === sorted[0]) {
          setSelectedHours(sorted.slice(1));
        } else {
          setSelectedHours([hour]);
        }
      }
      return;
    }

    if (selectedHours.length === 0) {
      setSelectedHours([hour]);
      return;
    }

    // Smart consecutive range selection: clicking slot 18 then 20 selects 18, 19, 20
    const sorted = [...selectedHours].sort((a, b) => a - b);
    const minH = sorted[0];
    const maxH = sorted[sorted.length - 1];

    if (hour > maxH) {
      let canFill = true;
      const filled: number[] = [];
      for (let h = minH; h <= hour; h++) {
        if (isHourAvailable(h)) {
          filled.push(h);
        } else {
          canFill = false;
          break;
        }
      }
      if (canFill && filled.length <= 6) {
        setSelectedHours(filled);
        setDurationPreset(filled.length);
        return;
      }
    } else if (hour < minH) {
      let canFill = true;
      const filled: number[] = [];
      for (let h = hour; h <= maxH; h++) {
        if (isHourAvailable(h)) {
          filled.push(h);
        } else {
          canFill = false;
          break;
        }
      }
      if (canFill && filled.length <= 6) {
        setSelectedHours(filled);
        setDurationPreset(filled.length);
        return;
      }
    }

    // Default fallback
    setSelectedHours([hour]);
  };

  const handleIncreaseDuration = () => {
    if (selectedHours.length === 0) return;
    const sorted = [...selectedHours].sort((a, b) => a - b);
    const nextHour = sorted[sorted.length - 1] + 1;
    if (isHourAvailable(nextHour)) {
      const nextList = [...sorted, nextHour];
      setSelectedHours(nextList);
      setDurationPreset(nextList.length);
      setSelectionNotice(null);
    } else {
      setSelectionNotice(`Slot jam ${nextHour}.00 sudah terisi atau di luar jam operasional.`);
    }
  };

  const handleDecreaseDuration = () => {
    if (selectedHours.length <= 1) return;
    const sorted = [...selectedHours].sort((a, b) => a - b);
    const nextList = sorted.slice(0, -1);
    setSelectedHours(nextList);
    setDurationPreset(nextList.length);
    setSelectionNotice(null);
  };

  const sortedHours = [...selectedHours].sort((a, b) => a - b);
  const startHour = sortedHours[0] || 0;
  const durationHours = sortedHours.length;
  const endHour = startHour + durationHours;

  const peakStart = currentCourt?.peakStartHour || 18;
  let totalEstimate = 0;
  if (currentCourt) {
    sortedHours.forEach((hour) => {
      const isPeak = hour >= peakStart;
      const price = isPeak && currentCourt.peakPricePerHour ? currentCourt.peakPricePerHour : currentCourt.pricePerHour;
      totalEstimate += price;
    });
  }

  const minDpEstimate = Math.round((totalEstimate * (tenant?.minDpPercentage || 30)) / 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative">
      {/* Hero Venue Header (Murni Halaman Web Penyedia Lapangan) */}
      <section className="relative overflow-hidden pt-8 pb-8 sm:py-12 border-b border-white/10/80 bg-slate-900/50/70 backdrop-blur-sm">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/20/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-10 w-80 h-80 bg-indigo-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Jadwal Real-Time Terverifikasi
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  4.9 (340+ Ulasan)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  DP Instan via Midtrans
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                {tenant.logoUrl && (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-white/10/90 shadow-sm shrink-0 bg-slate-900/50"
                  />
                )}
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {tenant.name}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                {tenant.description}
              </p>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{tenant.address}, {tenant.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{tenant.openTime} - {tenant.closeTime} WIB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>CS: {tenant.phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Action & Place Photo */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3.5 shrink-0">
              {tenant.bannerUrl && (
                <div className="w-full sm:w-72 lg:w-80 h-36 sm:h-40 rounded-2xl overflow-hidden relative shadow-md border border-white/10/80 shrink-0 group">
                  <img
                    src={tenant.bannerUrl}
                    alt={tenant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5 drop-shadow-sm">
                      <MapPin className="w-3 h-3 text-teal-400" /> {tenant.city}
                    </span>
                  </div>
                </div>
              )}

              <a
                href={`https://wa.me/62${(tenant.phone || '').replace(/\D/g, '').replace(/^(62|0)/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900/50 hover:bg-white/5 border border-white/10/80 text-xs font-bold text-slate-300 hover:text-teal-400 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>Chat WhatsApp Venue</span>
              </a>
            </div>
          </div>

          {/* Facility Badges */}
          <div className="flex flex-wrap gap-2 pt-5">
            {tenant.facilities.map((fac, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white/10/80 border border-white/10/60 text-slate-400"
              >
                ✓ {fac}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Booking Interface Container */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8 ${
        selectedHours.length > 0 ? 'pb-36 sm:pb-28' : ''
      }`}>
        {courts.length === 0 || !currentCourt ? (
          <div className="bg-slate-900/50 rounded-3xl p-10 sm:p-14 text-center border border-white/10/80 shadow-sm max-w-xl mx-auto my-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20 shadow-sm">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Belum Ada Lapangan Aktif</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Pengelola venue sedang menyiapkan daftar lapangan dan jadwal operasional. Silakan hubungi pengelola via WhatsApp untuk reservasi langsung.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`https://wa.me/62${(tenant.phone || '').replace(/\D/g, '').replace(/^(62|0)/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" /> Hubungi WhatsApp Pengelola ({tenant.phone})
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Court Detail Header (Tampil hanya di mobile saat pengguna memilih lapangan) */}
            {mobileView === 'DETAIL' && currentCourt && (
              <div className="sm:hidden space-y-3 pb-1 animate-in fade-in-50 duration-200" id="booking-schedule-section">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileView('LIST');
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 shadow-xs active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-teal-400" />
                    <span>Lihat Semua Lapangan</span>
                  </button>
                  <span className="text-[11px] font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20/70">
                    Jadwal & Booking
                  </span>
                </div>

                {/* Selected court detail summary card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/50 border-2 border-teal-600/30 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10">
                      <Image
                        src={currentCourt.imageUrl}
                        alt={currentCourt.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block text-[9px] font-extrabold uppercase bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded">
                        {currentCourt.sportType}
                      </span>
                      <h3 className="font-extrabold text-sm text-white truncate mt-0.5">{currentCourt.name}</h3>
                      <p className="text-xs font-bold text-teal-300">
                        {formatCurrency(currentCourt.pricePerHour)}
                        <span className="text-[10px] text-slate-400 font-normal"> / jam</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileView('LIST');
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 shrink-0 cursor-pointer"
                  >
                    Ganti
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Court Selector */}
            <section className={`space-y-3.5 ${mobileView === 'DETAIL' ? 'hidden sm:block' : 'block'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20/60">
                    Langkah 1
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">Pilih Lapangan</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {courts.length} Lapangan Siap Dipesan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {courts.map((court) => {
                  const isSelected = court.id === selectedCourtId;
                  return (
                    <button
                      type="button"
                      key={court.id}
                      onClick={() => {
                        setSelectedCourtId(court.id);
                        setSelectedHours([]);
                        setMobileView('DETAIL');
                      }}
                      className={`text-left p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'border-teal-700 bg-slate-900/50 shadow-lg shadow-teal-700/10 ring-2 ring-teal-500/20'
                          : 'border-white/10/90 bg-slate-900/50 hover:border-white/20 shadow-sm'
                      }`}
                    >
                      <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-3 bg-white/10">
                        <Image
                          src={court.imageUrl}
                          alt={court.name}
                          fill
                          unoptimized
                          priority
                          loading="eager"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                      {court.sportType}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {court.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {court.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tarif per Jam:</span>
                      <span className="text-sm font-extrabold text-teal-300">
                        {formatCurrency(court.pricePerHour)}
                      </span>
                    </div>

                    {court.peakPricePerHour && (
                      <div className="text-right">
                        <span className="text-[10px] text-amber-400 font-semibold block">Malam (Peak)</span>
                        <span className="text-xs font-bold text-slate-300">
                          {formatCurrency(court.peakPricePerHour)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi di Mobile agar langsung jelas cara bookingnya */}
                  <div className="sm:hidden mt-3 pt-2.5 border-t border-white/10">
                    <div className="w-full py-2 px-3 rounded-xl bg-teal-500/10 text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                      <span>Pilih Lapangan & Lihat Jadwal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Date Selector */}
        <section className={`space-y-3.5 ${mobileView === 'LIST' ? 'hidden sm:block' : 'block'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20/60">
                Langkah 2
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">Pilih Tanggal Main</h2>
            </div>
            <span className="text-xs text-teal-400 font-bold flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatDateIndo(selectedDate)}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {availableDays.map((d) => {
              const isSelected = d.date === selectedDate;
              return (
                <button
                  type="button"
                  key={d.date}
                  onClick={() => {
                    setSelectedDate(d.date);
                    setSelectedHours([]);
                  }}
                  className={`px-4 py-2.5 rounded-2xl border text-center shrink-0 min-w-[95px] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-700 bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]'
                      : 'border-white/10/90 bg-slate-900/50 hover:border-teal-400 text-slate-300 shadow-sm'
                  }`}
                >
                  <span
                    className={`block text-[11px] font-bold uppercase ${
                      isSelected ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="block text-base font-extrabold mt-0.5">
                    {d.date.split('-')[2]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Interactive Time Slots */}
        <section className={`space-y-4 bg-slate-900/50/90 backdrop-blur-sm p-6 sm:p-7 rounded-3xl border border-white/10/90 shadow-sm ${
          mobileView === 'LIST' ? 'hidden sm:block' : 'block'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20/60">
                  Langkah 3
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Operasional: {tenant.openTime || '07:00'} - {tenant.closeTime || '23:00'} WIB
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Pilih Jam Sewa ({currentCourt.name})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bisa booking 1 jam atau langsung 2-3 jam sekaligus secara berurutan.
              </p>
            </div>

            {/* Quick Duration Preset Selector (1 Jam, 2 Jam, 3 Jam, 4 Jam) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-slate-300 sm:px-1">
                Pilih Durasi Main:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((d) => {
                  const isActive =
                    (selectedHours.length > 0 && selectedHours.length === d) ||
                    (selectedHours.length === 0 && durationPreset === d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => handleDurationPresetClick(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/30 ring-2 ring-teal-500/30'
                          : 'bg-slate-900/50 hover:bg-white/10 text-slate-300 border border-white/10/80'
                      }`}
                    >
                      {d} Jam
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectionNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{selectionNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectionNotice(null)}
                className="text-amber-600 hover:text-amber-900 text-xs font-bold px-2 py-0.5"
              >
                Tutup
              </button>
            </div>
          )}

          <InteractiveTimeGrid
            court={currentCourt}
            date={selectedDate}
            bookings={bookings}
            selectedHours={selectedHours}
            onToggleHour={handleToggleHour}
            openHour={(() => {
              const o = tenant.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
              return o;
            })()}
            closeHour={(() => {
              const o = tenant.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
              let c = tenant.closeTime ? parseInt(tenant.closeTime.split(':')[0], 10) : 23;
              if (c <= o) c += 24;
              return c;
            })()}
          />
        </section>
        </>
        )}
      </main>

      {/* Floating Sticky Booking Summary Bar when hours are selected */}
      {currentCourt && selectedHours.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-slate-900/50/95 backdrop-blur-xl border-t border-white/10/90 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-500/20/70 px-2 py-0.5 rounded-md">
                    {currentCourt.name}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-300">
                    {formatDateIndo(selectedDate)}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2.5 sm:gap-x-3 gap-y-0.5">
                  <span className="text-sm sm:text-lg font-extrabold text-white">
                    {formatHourRange(startHour, endHour)} ({durationHours} Jam)
                  </span>
                  <span className="text-xs text-slate-400">
                    Total: <strong className="text-slate-200">{formatCurrency(totalEstimate)}</strong>
                  </span>
                  <span className="text-xs font-bold text-teal-300">
                    • DP: {formatCurrency(minDpEstimate)}
                  </span>
                </div>
              </div>

              {/* Stepper Durasi Langsung di Bar Bawah */}
              <div className="flex items-center gap-1.5 bg-white/10/90 p-1 rounded-xl self-start sm:self-center border border-white/10/80">
                <span className="text-[11px] font-bold text-slate-400 px-2">Durasi:</span>
                <button
                  type="button"
                  onClick={handleDecreaseDuration}
                  disabled={durationHours <= 1}
                  className="w-7 h-7 rounded-lg bg-slate-900/50 border border-white/10 text-slate-300 font-extrabold flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  title="Kurangi 1 Jam"
                >
                  -
                </button>
                <span className="px-2 text-xs font-extrabold text-white min-w-[54px] text-center">
                  {durationHours} Jam
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseDuration}
                  className="w-7 h-7 rounded-lg bg-slate-900/50 border border-white/10 text-slate-300 font-extrabold flex items-center justify-center hover:bg-white/5 cursor-pointer shadow-2xs"
                  title="Tambah 1 Jam"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSelectedHours([])}
                className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-3 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer text-center"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="flex-[2] sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Lanjut ke Pembayaran ({durationHours} Jam)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Checkout Modal */}
      {currentCourt && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          court={currentCourt}
          tenant={tenant}
          date={selectedDate}
          selectedHours={selectedHours}
          bookings={bookings}
          onUpdateSelectedHours={(newHours) => {
            setSelectedHours(newHours);
            setDurationPreset(newHours.length);
          }}
          onBookingSuccess={() => {
            refreshBookings();
          }}
        />
      )}
    </div>
  );
}
