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
      <div className="relative overflow-hidden rounded-2xl bg-emerald-500 p-4 sm:p-4.5 shadow-xl shadow-emerald-500/20">
        
        <div className="flex items-start gap-3.5 relative z-10">
          {/* Icon */}
          <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner mt-0.5 animate-bounce-subtle">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Pesanan Baru Masuk!
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-emerald-100 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
                title="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main content message */}
            <div className="text-xs text-emerald-50">
              <p className="leading-relaxed">
                Ada yang booking <strong className="text-white font-black text-sm">{notification.courtName}</strong>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-emerald-100">
                <span className="inline-flex items-center gap-1 text-emerald-900 font-bold bg-white px-2 py-0.5 rounded-md border border-white/20">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Jam {formatHourRange(notification.startHour, notification.endHour)} WIB
                </span>
                <span className="text-emerald-100">({formatDateIndo(notification.date)})</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-200">
                Pemesan: <strong className="text-white">{notification.customerName}</strong> ({notification.customerPhone})
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
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 font-black text-xs transition-all flex items-center gap-1 shadow-sm shadow-black/10 cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Buka Kotak Masuk</span>
              </button>

              <Link
                href={`/booking/${notification.bookingCode}`}
                target="_blank"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all border border-emerald-400/50"
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
