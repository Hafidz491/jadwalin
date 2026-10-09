'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  CheckCheck,
  Smartphone,
  CreditCard,
  User,
  Sparkles,
  Inbox
} from 'lucide-react';
import { InboxNotification } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange } from '@/lib/utils';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/lib/notifications';

interface NotificationInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InboxNotification[];
  onUpdateNotifications: (updated: InboxNotification[]) => void;
}

export function NotificationInboxModal({
  isOpen,
  onClose,
  notifications,
  onUpdateNotifications,
}: NotificationInboxModalProps) {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredList =
    filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    onUpdateNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = markAllNotificationsAsRead();
    onUpdateNotifications(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteNotification(id);
    onUpdateNotifications(updated);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    onUpdateNotifications([]);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam yang lalu`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} hari yang lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Kotak Masuk Notifikasi</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-xs shadow-emerald-500/30">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Pemberitahuan real-time setiap ada tamu yang selesai booking lapangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Actions */}
        <div className="px-5 py-3 border-b border-white/10 bg-slate-950/40 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tandai Semua Dibaca</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px] font-semibold transition-all cursor-pointer"
                title="Hapus semua riwayat notifikasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y-0">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Tidak Ada Notifikasi</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {filter === 'UNREAD'
                    ? 'Semua notifikasi booking telah dibaca.'
                    : 'Belum ada notifikasi pesanan masuk. Saat ada tamu yang booking, pemberitahuan akan langsung muncul di sini secara real-time.'}
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all relative group flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  !notif.isRead
                    ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
              >
                {/* Unread indicator */}
                {!notif.isRead && (
                  <span className="absolute top-4 right-4 sm:top-4 sm:right-auto sm:left-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}

                <div className={`space-y-2 min-w-0 flex-1 ${!notif.isRead ? 'sm:pl-4' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🎾 {notif.courtName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      #{notif.bookingCode}
                    </span>
                    {notif.isManual ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Walk-In Kasir
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Online Web Tamu
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium ml-auto sm:ml-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{notif.customerName}</span>
                      <span className="text-slate-400 font-normal text-xs font-mono">({notif.customerPhone})</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{formatDateIndo(notif.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {formatHourRange(notif.startHour, notif.endHour)} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>DP: {formatCurrency(notif.dpAmount)}</span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        (Total {formatCurrency(notif.totalAmount)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/booking/${notif.bookingCode}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>E-Tiket</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notif.id);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                    title="Hapus notifikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
