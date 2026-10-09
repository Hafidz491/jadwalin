'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, UserCheck, Phone, FileText, AlertCircle, CreditCard, Banknote } from 'lucide-react';
import { Court, Booking } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange, getTodayDateString } from '@/lib/utils';
import { addBooking } from '@/lib/data';
import { createNotificationFromBooking } from '@/lib/notifications';

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  initialCourtId?: string;
  initialDate?: string;
  initialHour?: number;
  onSuccess: (booking: Booking) => void;
}

export function ManualBookingModal({
  isOpen,
  onClose,
  courts,
  initialCourtId,
  initialDate,
  initialHour,
  onSuccess,
}: ManualBookingModalProps) {
  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId || courts[0]?.id || '');
  const [date, setDate] = useState(initialDate || getTodayDateString());
  const [startHour, setStartHour] = useState(initialHour || 16);
  const [durationHours, setDurationHours] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [staffName, setStaffName] = useState('Admin Kasir');
  const [paymentMode, setPaymentMode] = useState<'CASH_FULL' | 'CASH_DP' | 'UNPAID'>('CASH_FULL');
  const [dpCustomAmount, setDpCustomAmount] = useState<number>(50000);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    if (initialCourtId) setSelectedCourtId(initialCourtId);
    if (initialDate) setDate(initialDate);
    if (initialHour) setStartHour(initialHour);
    setError(null);
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, initialCourtId, initialDate, initialHour]);

  if (!isOpen) return null;

  const currentCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
  const endHour = startHour + durationHours;

  // Calculate pricing
  const peakStart = currentCourt?.peakStartHour || 18;
  let totalAmount = 0;
  for (let h = startHour; h < endHour; h++) {
    const isPeak = h >= peakStart;
    const price = isPeak && currentCourt?.peakPricePerHour ? currentCourt.peakPricePerHour : currentCourt?.pricePerHour || 100000;
    totalAmount += price;
  }

  const dpAmount =
    paymentMode === 'CASH_FULL'
      ? totalAmount
      : paymentMode === 'CASH_DP'
      ? dpCustomAmount
      : 0;

  const remainingAmount = totalAmount - dpAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Masukkan nama pemesan (atau nama tim / walk-in)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentCourt.tenantId,
          courtId: currentCourt.id,
          courtName: currentCourt.name,
          sportType: currentCourt.sportType,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || '080000000000',
          notes: notes.trim(),
          date,
          startHour,
          durationHours,
          totalAmount,
          dpAmount,
          remainingAmount,
          paymentType: paymentMode === 'CASH_FULL' ? 'FULL_PAYMENT' : 'DP_ONLY',
          isManualBooking: true,
          bookedByStaff: staffName,
          paymentMethod:
            paymentMode === 'CASH_FULL'
              ? 'Tunai Kasir (Lunas)'
              : paymentMode === 'CASH_DP'
              ? 'Tunai Kasir (DP)'
              : 'Bayar di Tempat Nanti',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menambahkan booking manual');
      }

      if (data.data) {
        addBooking(data.data);
        createNotificationFromBooking(data.data);
      }

      onSuccess(data.data);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manual Booking / Walk-In Offline</h2>
              <p className="text-xs text-slate-400">Tutup slot manual untuk tamu kasir atau pesanan telepon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Court & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Lapangan
              </label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jam Mulai
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00 WIB
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Durasi Main
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value={1}>1 Jam</option>
                <option value={2}>2 Jam</option>
                <option value={3}>3 Jam</option>
                <option value={4}>4 Jam</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs">
            <span className="font-medium text-amber-900 dark:text-amber-200">
              Jadwal: {formatDateIndo(date)} ({formatHourRange(startHour, endHour)})
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Pelanggan / Tim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FC Garuda / Pak Dani"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="0812..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Bawa bola, rompi, langganan tetap..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Petugas Kasir
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Status at Cashier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status Pembayaran di Kasir
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH_FULL')}
                className={`p-3 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer ${
                  paymentMode === 'CASH_FULL'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span>Lunas Kasir</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">100% Terbayar</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CASH_DP')}
                className={`p-3 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer ${
                  paymentMode === 'CASH_DP'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span>DP Tunai</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Sebagian</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UNPAID')}
                className={`p-3 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer ${
                  paymentMode === 'UNPAID'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Lock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <span>Kunci Dulu</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Bayar di Lokasi</span>
              </button>
            </div>
          </div>

          {paymentMode === 'CASH_DP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nominal DP Diterima (Rp)
              </label>
              <input
                type="number"
                value={dpCustomAmount}
                onChange={(e) => setDpCustomAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <Lock className="w-4 h-4" />
              <span>Simpan & Kunci Jadwal Lapangan</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Slot jam ini akan otomatis tidak bisa dipilih lagi oleh pengunjung web publik.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
