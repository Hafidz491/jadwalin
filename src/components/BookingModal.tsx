'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, ShieldCheck, Check, Sparkles, AlertCircle, Phone, User, Mail, MessageSquare, Save } from 'lucide-react';
import { Court, Tenant, Booking } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange } from '@/lib/utils';
import { getBookingsData, saveBookingsData } from '@/lib/data';
import { createNotificationFromBooking } from '@/lib/notifications';
import { MidtransSimulatorModal } from './MidtransSimulatorModal';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  tenant: Tenant;
  date: string;
  selectedHours: number[];
  bookings?: Booking[];
  onBookingSuccess?: (booking: Booking) => void;
  onUpdateSelectedHours?: (hours: number[]) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  court,
  tenant,
  date,
  selectedHours,
  bookings = [],
  onBookingSuccess,
  onUpdateSelectedHours,
}: BookingModalProps) {
  const router = useRouter();

  // Local hours state so user can adjust duration directly inside modal
  const [currentHours, setCurrentHours] = useState<number[]>(selectedHours);

  // Sync when selectedHours changes or modal opens
  useEffect(() => {
    if (selectedHours.length > 0) {
      setCurrentHours(selectedHours);
    }
  }, [selectedHours, isOpen]);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'DP' | 'FULL'>('DP');
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-fill from localStorage for regular customers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('jadwalin_saved_customer');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
          if (parsed.customerEmail) setCustomerEmail(parsed.customerEmail);
        }
      } catch {}
    }
  }, []);

  // Loading & Simulator state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen) return null;

  const sortedHours = [...currentHours].sort((a, b) => a - b);
  const startHour = sortedHours[0] || 8;
  const durationHours = sortedHours.length || 1;
  const endHour = startHour + durationHours;

  const handleSetDurationInModal = (targetDuration: number) => {
    setFormError(null);
    const openH = tenant.openTime ? parseInt(tenant.openTime.split(':')[0], 10) : 7;
    let closeH = tenant.closeTime ? parseInt(tenant.closeTime.split(':')[0], 10) : 23;
    if (closeH <= openH) closeH += 24;

    const newHours: number[] = [];
    for (let i = 0; i < targetDuration; i++) {
      const h = startHour + i;
      if (h < openH || h >= closeH) {
        setFormError(`Jam ${h}.00 di luar jam operasional venue.`);
        return;
      }

      const isConflict = bookings.some(
        (b) =>
          b.courtId === court.id &&
          b.date === date &&
          b.bookingStatus !== 'CANCELLED' &&
          b.bookingStatus !== 'NO_SHOW' &&
          h >= b.startHour &&
          h < b.endHour
      );

      if (isConflict) {
        setFormError(`Slot jam ${h}.00 sudah terisi/dibooking orang lain.`);
        return;
      }

      newHours.push(h);
    }

    setCurrentHours(newHours);
    onUpdateSelectedHours?.(newHours);
  };

  // Calculate pricing
  const peakStart = court.peakStartHour || 18;
  let totalAmount = 0;
  sortedHours.forEach((hour) => {
    const isPeak = hour >= peakStart;
    const price = isPeak && court.peakPricePerHour ? court.peakPricePerHour : court.pricePerHour;
    totalAmount += price;
  });

  const minDpPct = tenant.minDpPercentage || 30;
  const dpAmount = Math.round((totalAmount * minDpPct) / 100);
  const toPayNow = paymentChoice === 'DP' ? dpAmount : totalAmount;
  const remainingAtVenue = totalAmount - toPayNow;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Silakan masukkan nama lengkap pemesan');
      return;
    }

    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    if (cleanPhone.length < 10) {
      setFormError('Nomor WhatsApp tidak valid (minimal 10 digit angka)');
      return;
    }

    // Save customer data in localStorage if rememberMe is enabled
    if (rememberMe && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'jadwalin_saved_customer',
          JSON.stringify({
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            customerEmail: customerEmail.trim(),
          })
        );
      } catch {}
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          courtId: court.id,
          courtName: court.name,
          sportType: court.sportType,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim(),
          notes: notes.trim(),
          date,
          startHour,
          durationHours,
          totalAmount,
          dpAmount: toPayNow,
          remainingAmount: remainingAtVenue,
          paymentType: paymentChoice === 'DP' ? 'DP_ONLY' : 'FULL_PAYMENT',
          isManualBooking: false,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal membuat reservasi.');
      }

      setCreatedBooking(resData.data);
      // Sync with local memory or session storage for demo ticket display
      try {
        if (tenant.id === 'tenant-gor-nusantara') {
          sessionStorage.setItem(`demo_booking_${resData.data.bookingCode}`, JSON.stringify(resData.data));
        }
      } catch {}

      setShowPaymentModal(true);
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethod: string) => {
    if (!createdBooking) return;

    try {
      // Simulate webhook settlement
      await fetch('/api/payment/midtrans-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: createdBooking.bookingCode,
          status_code: '200',
          gross_amount: String(toPayNow),
          transaction_status: 'settlement',
          payment_type: paymentMethod.toLowerCase().includes('qris')
            ? 'qris'
            : paymentMethod.toLowerCase().includes('bca')
            ? 'bank_transfer'
            : 'gopay',
        }),
      });

      const updatedBooking = { ...createdBooking, paymentMethod, paymentStatus: 'SETTLEMENT' as const };
      createNotificationFromBooking(updatedBooking);

      if (onBookingSuccess) {
        onBookingSuccess(updatedBooking);
      }

      setShowPaymentModal(false);
      onClose();
      // Navigate to digital ticket page
      router.push(`/booking/${createdBooking.bookingCode}`);
    } catch (err) {
      console.error(err);
      createNotificationFromBooking(createdBooking);
      router.push(`/booking/${createdBooking.bookingCode}`);
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setShowPaymentModal(false);
    setFormError(`Pembayaran Belum Berhasil: ${reason}. Silakan coba lagi atau ganti metode pembayaran.`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
        <div className="relative w-full max-w-xl md:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Formulir Pemesanan Lapangan</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5">{court.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Booking Slot Information Pill with Duration Adjuster */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tanggal Sewa</span>
                    <span className="font-semibold text-slate-800">{formatDateIndo(date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200/60">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Jam Main</span>
                    <span className="font-bold text-slate-900">
                      {formatHourRange(startHour, endHour)} ({durationHours} Jam)
                    </span>
                  </div>
                </div>
              </div>

              {/* Ubah Durasi Main (1 Jam, 2 Jam, 3 Jam, 4 Jam) */}
              <div className="pt-2.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Ubah Durasi Main:</span>
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSetDurationInModal(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        durationHours === d
                          ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-500/30'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {d} Jam
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Customer Information */}
              <div className="space-y-3.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-700" />
                  <span>Informasi Pemesan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Muhammad Reza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="08123456789 atau 62812..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Tiket reservasi & barcode akan dikirim ke nomor ini via WhatsApp.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email (Opsional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Catatan Tambahan (Opsional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Bawa rompi, bola futsal, dll."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-fill Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
                    Ingat data saya (Nama & No WhatsApp) agar otomatis terisi pada pemesanan berikutnya
                  </label>
                </div>
              </div>

              {/* Payment Type Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Pilih Skema Pembayaran</span>
                  </h3>
                  <span className="text-[11px] sm:text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                    Anti-Ghosting Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* DP Option */}
                  <label
                    onClick={() => setPaymentChoice('DP')}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      paymentChoice === 'DP'
                        ? 'border-teal-700 bg-teal-50/50 ring-2 ring-teal-700/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                          Rekomendasi / Paling Populer
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-2">
                          Bayar DP Minimal ({minDpPct}%)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kunci jadwal sekarang, sisanya bayar tunai di lokasi.
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                          paymentChoice === 'DP'
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {paymentChoice === 'DP' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/80">
                      <span className="text-xs text-slate-500 block">Bayar Sekarang:</span>
                      <span className="text-base sm:text-lg font-black text-teal-800">
                        {formatCurrency(dpAmount)}
                      </span>
                    </div>
                  </label>

                  {/* Full Payment Option */}
                  <label
                    onClick={() => setPaymentChoice('FULL')}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      paymentChoice === 'FULL'
                        ? 'border-teal-700 bg-teal-50/50 ring-2 ring-teal-700/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Praktis & Bebas Repot
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-2">
                          Bayar Lunas (100%)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Langsung datang main tanpa antre bayar pelunasan di kasir.
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                          paymentChoice === 'FULL'
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {paymentChoice === 'FULL' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/80">
                      <span className="text-xs text-slate-500 block">Bayar Sekarang:</span>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Harga Sewa ({durationHours} Jam)</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Jumlah Ditagih Sekarang ({paymentChoice === 'DP' ? `DP ${minDpPct}%` : 'Lunas 100%'})
                  </span>
                  <span className="font-bold text-teal-800">
                    {formatCurrency(toPayNow)}
                  </span>
                </div>
                {paymentChoice === 'DP' && (
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                    <span>Sisa Pelunasan di Lokasi (Kasir)</span>
                    <span className="font-semibold text-amber-700">
                      {formatCurrency(remainingAtVenue)}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancellation Policy Banner */}
              <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold text-amber-950">Kebijakan Pemesanan & Pembatalan:</strong> Pembayaran DP mengunci slot secara instan. Pembatalan atau perubahan jadwal maksimal H-1 jadwal main dengan konfirmasi langsung ke pengelola venue.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Mengunci Slot & Menyiapkan Pembayaran...</span>
                ) : (
                  <>
                    <span>Lanjutkan Pembayaran Online</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs sm:text-sm">
                      {formatCurrency(toPayNow)}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Midtrans Payment Simulator Modal */}
      {createdBooking && (
        <MidtransSimulatorModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingCode={createdBooking.bookingCode}
          amount={toPayNow}
          totalAmount={totalAmount}
          isDp={paymentChoice === 'DP'}
          courtName={court.name}
          customerName={customerName}
          customerPhone={customerPhone}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </>
  );
}
