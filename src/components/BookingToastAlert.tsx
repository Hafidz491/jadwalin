'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Calendar, X, Sparkles, ArrowRight, Bell } from 'lucide-react';
import { InboxNotification } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange } from '@/lib/utils';

interface BookingToastAlertProps {
  notification: InboxNotification | null;
  onClose: () => void;
  onOpenInbox: () => void;
}

export function BookingToastAlert({
  notification,
  onClose,
  onOpenInbox,
}: BookingToastAlertProps) {
  useEffect(() => {
    if (!notification) return;
    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[100] max-w-md w-full animate-in slide-in-from-top-6 fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 p-4 sm:p-4.5 shadow-[0_15px_50px_-10px_rgba(16,185,129,0.45)] backdrop-blur-xl">
        {/* Glow corner & Top gradient line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner mt-0.5 animate-bounce-subtle">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Pesanan Baru Masuk!
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                title="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main content message */}
            <div className="text-xs text-slate-200">
              <p className="leading-relaxed">
                Ada yang booking <strong className="text-white font-black text-sm">{notification.courtName}</strong>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Jam {formatHourRange(notification.startHour, notification.endHour)} WIB
                </span>
                <span className="text-slate-400">({formatDateIndo(notification.date)})</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Pemesan: <strong className="text-slate-200">{notification.customerName}</strong> ({notification.customerPhone})
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenInbox();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/30 cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Buka Kotak Masuk</span>
              </button>

              <Link
                href={`/booking/${notification.bookingCode}`}
                target="_blank"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs transition-all border border-white/10"
              >
                Lihat E-Tiket ↗
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
