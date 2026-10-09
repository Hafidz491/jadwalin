'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Printer,
  ChevronLeft,
  QrCode,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Copy
} from 'lucide-react';
import { getBookingsData, getTenantData, saveBookingsData } from '@/lib/data';
import { Booking, Tenant } from '@/lib/types';
import { formatCurrency, formatDateIndo, formatHourRange, createWhatsAppLink } from '@/lib/utils';
import { generateBookingSuccessMessage } from '@/lib/whatsapp';
import { getTenantAction } from '@/app/actions';

export default function BookingSuccessPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(!booking);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#14b8a6', '#6366f1', '#f59e0b']
      });
    } catch {
      // ignore
    }
  }, []);

  // Fetch from server API if not found in client localStorage (e.g. mobile or incognito access)
  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    const loadBooking = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/bookings?id=${encodeURIComponent(bookingId)}`);
        let b = null;
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            b = json.data;
          }
        }
        
        // If API fails or returns null, fallback to local storage
        if (!b) {
          const all = await getBookingsData();
          b = all.find((item) => item.id === bookingId || item.bookingCode === bookingId) || null;
        }

        // If still null, try sessionStorage
        if (!b) {
          try {
            const demo = sessionStorage.getItem(`demo_booking_${bookingId}`);
            if (demo) b = JSON.parse(demo);
          } catch {}
        }

        if (isMounted) {
          setBooking(b);
          if (b) {
            try {
              const t = await getTenantAction(b.tenantId);
              if (t) setTenant(t);
            } catch (err) {
              const t = await getTenantData();
              if (t) setTenant(t);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh-soft flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Memuat e-tiket digital Anda...</p>
        </div>
      </div>
    );
  }

  if (!booking || !tenant) {
    return (
      <div className="min-h-screen bg-mesh-soft flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Tiket Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">
            Nomor pemesanan atau tiket tidak valid atau sudah kadaluarsa.
          </p>
          <Link
            href={`/${tenant?.slug || 'gor-nusantara'}`}
            className="inline-flex px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20"
          >
            Kembali ke Halaman Booking
          </Link>
        </div>
      </div>
    );
  }

  const isLunas = booking.paymentType === 'FULL_PAYMENT' || booking.remainingAmount === 0;
  const waMessage = generateBookingSuccessMessage(booking, tenant);
  const waUrl = createWhatsAppLink(booking.customerPhone, waMessage);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1 w-full space-y-5">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/b/${tenant.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Jadwal {tenant.name}</span>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak E-Tiket (PDF)</span>
          </button>
        </div>

        {/* Soft Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-600/15 text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Pembayaran Berhasil & Slot Terkunci!</h1>
          <p className="text-xs text-emerald-100 max-w-md mx-auto">
            Reservasi Anda telah terverifikasi secara instan. Jam lapangan telah dikunci khusus untuk Anda.
          </p>
        </div>

        {/* Digital E-Ticket Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          {/* Card Header */}
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  E-Tiket Resmi
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Image src="/logo-icon.png" alt="Jadwalin" width={16} height={16} className="w-4 h-4 object-contain inline-block" />
                  <span>Jadwalin Verified</span>
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1.5">{tenant.name}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {tenant.address}, {tenant.city}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-right sm:text-right flex sm:flex-col items-center justify-between sm:justify-center border border-white/10">
              <div>
                <span className="text-[10px] text-slate-400 block">Kode Booking</span>
                <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider">
                  {booking.bookingCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-3 sm:ml-0 sm:mt-1 inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Lapangan</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {booking.courtName}
                </span>
                <span className="text-xs text-emerald-700 font-bold uppercase">
                  {booking.sportType}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block">Nama Pemesan</span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {booking.customerName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {booking.customerPhone}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Main
                </span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {formatDateIndo(booking.date)}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Jam & Durasi
                </span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {formatHourRange(booking.startHour, booking.endHour)} ({booking.durationHours} Jam)
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Total Biaya Sewa</span>
                <span className="font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  DP Dibayar ({booking.paymentMethod || 'Midtrans Online'})
                </span>
                <span className="font-extrabold">{formatCurrency(booking.dpAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Sisa Bayar di Kasir Lapangan:</span>
                  <span className="text-[11px] text-slate-500">
                    {isLunas ? 'Lunas tanpa biaya tambahan' : 'Dibayarkan tunai/QRIS saat tiba di lokasi'}
                  </span>
                </div>
                <div
                  className={`text-base font-extrabold ${
                    isLunas ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isLunas ? 'LUNAS (Rp 0)' : formatCurrency(booking.remainingAmount)}
                </div>
              </div>
            </div>

            {/* QR Verification */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">
                    Tunjukkan Tiket Ini ke Kasir
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Petugas kasir akan memverifikasi kode booking saat Anda tiba.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Status: Terverifikasi
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Share Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Konfirmasi Tiket WhatsApp (Fonnte / Wablas)
              </h3>
              <p className="text-xs text-slate-500">
                Kirim pesan konfirmasi resmi ke WhatsApp pribadi Anda atau bagikan ke anggota tim.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] font-mono text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto">
            {waMessage}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Buka & Simpan Tiket di WhatsApp</span>
            </a>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Tiket Booking Lapangan - ${tenant.name}`,
                    text: `Kode Booking: ${booking.bookingCode} di ${tenant.name}`,
                    url: window.location.href,
                  });
                } else {
                  handleCopyCode();
                }
              }}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan ke Teman Tim</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
