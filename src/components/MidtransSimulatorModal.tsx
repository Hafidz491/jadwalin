'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, QrCode, Building2, Smartphone, ShieldCheck, X, ArrowRight, Loader2, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MidtransSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  amount: number;
  totalAmount: number;
  isDp: boolean;
  courtName: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (method: string) => void;
  onFailure?: (reason: string) => void;
}

export function MidtransSimulatorModal({
  isOpen,
  onClose,
  bookingCode,
  amount,
  totalAmount,
  isDp,
  courtName,
  customerName,
  onSuccess,
  onFailure,
}: MidtransSimulatorModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'bca_va' | 'gopay'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [countdown, setCountdown] = useState(890); // 15 mins countdown

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const vaNumber = `88012${bookingCode.replace(/\D/g, '').padEnd(8, '0').slice(0, 8)}`;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const methodName =
        selectedMethod === 'qris'
          ? 'QRIS (Midtrans)'
          : selectedMethod === 'bca_va'
          ? 'BCA Virtual Account'
          : 'GoPay (Midtrans)';
      onSuccess(methodName);
    }, 1200);
  };

  const copyVA = () => {
    navigator.clipboard.writeText(vaNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Midtrans style */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lg text-emerald-400">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wide">Midtrans Payment</span>
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Sandbox Active
                </span>
              </div>
              <p className="text-xs text-blue-200">Order ID: {bookingCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Summary Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tagihan Saat Ini</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(amount)}
            </div>
            {isDp && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                DP Minimal (Sisa {formatCurrency(totalAmount - amount)} dibayar di kasir)
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Batas Waktu Bayar</span>
            <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
              ⏱ {timeFormatted}
            </div>
          </div>
        </div>

        {/* Payment Channels Tabs */}
        <div className="p-6 space-y-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pilih Metode Pembayaran
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMethod('qris')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'qris'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>QRIS</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Instan</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('bca_va')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'bca_va'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>BCA VA</span>
              <span className="text-[10px] text-slate-500">Virtual Acc</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('gopay')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'gopay'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Smartphone className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>GoPay</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">E-Wallet</span>
            </button>
          </div>

          {/* Tab Content */}
          {selectedMethod === 'qris' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-xl shadow-md border border-slate-200">
                {/* SVG QR Code Simulation */}
                <svg
                  className="w-36 h-36 mx-auto text-slate-900"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="white" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 10H36V36H10V10ZM16 16H30V30H16V16ZM64 10H90V36H64V10ZM70 16H84V30H70V16ZM10 64H36V90H10V64ZM16 70H30V84H16V70ZM44 10H56V22H44V10ZM44 26H56V38H44V26ZM20 44H32V56H20V44ZM64 44H76V56H64V44ZM78 44H90V56H78V44ZM44 64H56V76H44V64ZM58 64H70V76H58V64ZM72 64H84V76H72V64ZM44 78H56V90H44V78ZM64 78H76V90H64V78ZM78 78H90V90H78V78Z"
                    fill="currentColor"
                  />
                  <rect x="42" y="42" width="16" height="16" rx="4" fill="#0284c7" />
                </svg>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Scan QRIS menggunakan BCA, Mandiri Livin, GoPay, OVO, ShopeePay, atau DANA.
              </p>
            </div>
          )}

          {selectedMethod === 'bca_va' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nomor Virtual Account BCA:</div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono text-lg font-bold text-slate-800 dark:text-white tracking-wider">
                  {vaNumber}
                </span>
                <button
                  type="button"
                  onClick={copyVA}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isCopied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Transfer tepat hingga digit terakhir melalui ATM BCA, KlikBCA, atau m-BCA.
              </p>
            </div>
          )}

          {selectedMethod === 'gopay' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="font-semibold text-sm text-slate-800 dark:text-white">Pembayaran via GoPay / Gojek</div>
              <p className="text-xs text-slate-500">
                Buka aplikasi Gojek di HP Anda untuk melakukan verifikasi pembayaran.
              </p>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              Pembayaran terenkripsi dan terverifikasi otomatis secara real-time via gateway Midtrans.
            </span>
          </div>

          {/* Action Simulation Button */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-75 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Notifikasi Webhook Midtrans...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Simulasi Bayar Berhasil ({formatCurrency(amount)})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onFailure) {
                  onFailure('Pembayaran dibatalkan atau ditolak oleh bank');
                } else {
                  onClose();
                }
              }}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-500" />
              <span>Simulasi Pembayaran Gagal / Ditolak (Kembali ke Form)</span>
            </button>

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              Mode Sandbox Midtrans: Uji alur pembayaran sukses maupun gagal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
