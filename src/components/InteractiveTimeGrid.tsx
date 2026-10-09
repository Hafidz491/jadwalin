'use client';

import React from 'react';
import { Court, Booking } from '@/lib/types';
import { formatCurrency, formatTimeSlot } from '@/lib/utils';
import { Check, Flame, Clock, X } from 'lucide-react';

interface InteractiveTimeGridProps {
  court: Court;
  date: string;
  bookings: Booking[];
  selectedHours: number[];
  onToggleHour: (hour: number) => void;
  openHour?: number;
  closeHour?: number;
}

export function InteractiveTimeGrid({
  court,
  date,
  bookings,
  selectedHours,
  onToggleHour,
  openHour = 7,
  closeHour = 23,
}: InteractiveTimeGridProps) {
  const peakStart = court.peakStartHour || 18;

  // Filter bookings for this court and date
  const activeBookings = bookings.filter(
    (b) =>
      b.courtId === court.id &&
      b.date === date &&
      b.bookingStatus !== 'CANCELLED' &&
      b.bookingStatus !== 'NO_SHOW'
  );

  const hours: number[] = [];
  for (let h = openHour; h < closeHour; h++) {
    hours.push(h);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const isToday = date === todayStr;

  const getSlotStatus = (
    hour: number
  ): {
    status: 'available' | 'booked' | 'pending' | 'past';
    booking?: Booking;
  } => {
    // If today and hour has passed or is currently ongoing
    if (isToday && hour <= currentHour) {
      return { status: 'past' };
    }

    const booking = activeBookings.find((b) => hour >= b.startHour && hour < b.endHour);
    if (!booking) {
      return { status: 'available' };
    }
    if (booking.bookingStatus === 'PENDING_PAYMENT') {
      const now = Date.now();
      const isExpired = booking.expiresAt
        ? new Date(booking.expiresAt).getTime() < now
        : now - new Date(booking.createdAt).getTime() > 15 * 60 * 1000;
      if (isExpired) {
        return { status: 'available' };
      }
      return { status: 'pending', booking };
    }
    return { status: 'booked', booking };
  };

  return (
    <div className="space-y-4">
      {/* Legend Sesuai Spesifikasi: Slot Hijau = Tersedia | Slot Merah = Terisi/Dibooking */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span className="text-slate-800 font-bold">Slot Hijau = Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600"></span>
            <span className="text-slate-800 font-bold">Slot Merah = Terisi / Dibooking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500"></span>
            <span className="text-slate-600 font-medium">Menunggu DP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></span>
            <span className="text-slate-500 font-medium">Lewat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-800 ring-2 ring-emerald-300"></span>
            <span className="text-emerald-900 font-extrabold">Slot Dipilih</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-[11px]">
          <Flame className="w-3 h-3 text-amber-500" />
          <span>Prime Time (Mulai 18.00 WIB)</span>
        </div>
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        {hours.map((hour) => {
          const { status, booking } = getSlotStatus(hour);
          const isSelected = selectedHours.includes(hour);
          const isPeak = hour >= peakStart;
          const slotPrice =
            isPeak && court.peakPricePerHour ? court.peakPricePerHour : court.pricePerHour;

          // SLOT ABU-ABU = LEWAT (WAKTU LAMPAU)
          if (status === 'past') {
            return (
              <div
                key={hour}
                className="relative p-3 rounded-2xl border border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed select-none transition-all flex flex-col justify-between h-20 opacity-60"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatTimeSlot(hour)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                    Lewat
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Waktu Berlalu</span>
                  <span className="text-[10px] text-slate-400">Tidak dapat dipesan</span>
                </div>
              </div>
            );
          }

          // SLOT MERAH = TERISI / DIBOOKING
          if (status === 'booked') {
            return (
              <div
                key={hour}
                className="relative p-3 rounded-2xl border-2 border-rose-200 bg-rose-50 text-rose-800 cursor-not-allowed select-none transition-all flex flex-col justify-between h-20 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold text-rose-900">
                    <Clock className="w-3 h-3 text-rose-500" />
                    {formatTimeSlot(hour)}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                    Terisi
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-950 truncate block">
                    {booking?.customerName ? booking.customerName.slice(0, 14) : 'Sudah Dibooking'}
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Slot tidak tersedia</span>
                </div>
              </div>
            );
          }

          // SLOT KUNING = MENUNGGU PEMBAYARAN
          if (status === 'pending') {
            return (
              <div
                key={hour}
                className="relative p-3 rounded-2xl border-2 border-amber-300 bg-amber-50 cursor-not-allowed select-none transition-all flex flex-col justify-between h-20"
              >
                <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {formatTimeSlot(hour)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                    Menunggu DP
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    Proses Bayar
                  </span>
                  <span className="text-[10px] text-amber-700">Slot terkunci sementara</span>
                </div>
              </div>
            );
          }

          // SLOT HIJAU = TERSEDIA (Klik untuk memilih)
          const sortedSelected = [...selectedHours].sort((a, b) => a - b);
          const isStart = isSelected && hour === sortedSelected[0] && sortedSelected.length > 1;
          const isEnd = isSelected && hour === sortedSelected[sortedSelected.length - 1] && sortedSelected.length > 1;
          const isMiddle = isSelected && !isStart && !isEnd && sortedSelected.length > 2;

          return (
            <button
              type="button"
              key={hour}
              onClick={() => onToggleHour(hour)}
              className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-150 flex flex-col justify-between h-20 cursor-pointer group ${
                isSelected
                  ? 'border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-700/25 scale-[1.02] ring-2 ring-emerald-400/40'
                  : 'border-emerald-300/80 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-500 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full text-xs font-semibold">
                <span
                  className={`flex items-center gap-1 ${
                    isSelected ? 'text-emerald-100 font-bold' : 'text-emerald-900 font-medium'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {formatTimeSlot(hour)}
                </span>
                {isSelected ? (
                  <span className="flex items-center gap-1">
                    {isStart && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-900 text-emerald-100 px-1 py-0.5 rounded">
                        Mulai
                      </span>
                    )}
                    {isMiddle && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-100 px-1 py-0.5 rounded">
                        +1 Jam
                      </span>
                    )}
                    {isEnd && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-900 text-emerald-100 px-1 py-0.5 rounded">
                        Selesai
                      </span>
                    )}
                    <span className="w-4 h-4 rounded-full bg-white text-emerald-800 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </span>
                ) : isPeak ? (
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-amber-600" /> Prime
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-emerald-700 group-hover:text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    Tersedia
                  </span>
                )}
              </div>

              <div>
                <div
                  className={`text-sm font-black ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(slotPrice)}
                </div>
                <div
                  className={`text-[10px] ${
                    isSelected ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {isSelected && selectedHours.length > 1 ? 'Slot terpilih' : '/ jam'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
