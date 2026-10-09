'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, Sparkles, Building2, CreditCard, ArrowRight, QrCode, Loader2, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { SubscriptionTier, Tenant } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { upgradePlan, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onSuccess: (updatedTenant: Tenant) => void;
  isLockedDueToExpired?: boolean;
  onLogout?: () => void;
  isDemo?: boolean;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
  isLockedDueToExpired = false,
  onLogout,
  isDemo = false,
}: SubscriptionModalProps) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('PRO');
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'MIDTRANS' | 'DEMO_WARNING'>('SELECT');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [dynamicPackages, setDynamicPackages] = useState<any[]>([]);
  
  const [dynamicPrices, setDynamicPrices] = useState<Record<SubscriptionTier, number>>({
    STARTER: 99000,
    PRO: 179000,
    ENTERPRISE: 249000,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jadwalin_packages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setDynamicPackages(parsed);
            setDynamicPrices({
              STARTER: parsed.find((p: any) => p.id === 'STARTER')?.price || 99000,
              PRO: parsed.find((p: any) => p.id === 'PRO')?.price || 179000,
              ENTERPRISE: parsed.find((p: any) => p.id === 'ENTERPRISE')?.price || 249000,
            });
          }
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const planPrices: Record<SubscriptionTier, number> = dynamicPrices;

  const planTitles: Record<SubscriptionTier, string> = {
    STARTER: 'Starter UMKM',
    PRO: 'Juara Pro (Rekomendasi)',
    ENTERPRISE: 'Enterprise GOR',
  };

  const selectedPrice = planPrices[selectedTier];

  const getPkg = (id: string) => dynamicPackages.find(p => p.id === id) || null;
  const starterPkg = getPkg('STARTER');
  const proPkg = getPkg('PRO');
  const entPkg = getPkg('ENTERPRISE');

  const handleSimulateSubscriptionPayment = async () => {
    setIsProcessing(true);
    const updated = await upgradePlan(selectedTier);
    setIsProcessing(false);
    onSuccess(updated);
    setPaymentStep('SELECT');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (!isLockedDueToExpired && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-slate-950 rounded-[32px] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between relative z-10 ${isLockedDueToExpired
            ? 'border-b border-rose-500/20'
            : 'border-b border-white/10'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLockedDueToExpired
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              }`}>
              {isLockedDueToExpired ? <Lock className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-medium tracking-tight text-white font-instrument">
                {isLockedDueToExpired
                  ? 'Waktu Habis.'
                  : 'Upgrade ke Pro.'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isLockedDueToExpired
                  ? 'Akses terkunci. Lanjutkan berlangganan.'
                  : 'Buka kapasitas maksimal dan automasi.'}
              </p>
            </div>
          </div>

          {isLockedDueToExpired ? (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            )
          ) : (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {paymentStep === 'SELECT' ? (
          <div className="overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
            {/* Warning Banner If Locked Due To Expired */}
            {isLockedDueToExpired && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="text-sm font-medium text-rose-400">
                    Sistem Terkunci Sementara
                  </h4>
                  <p className="text-sm text-rose-400/80 mt-1 leading-relaxed">
                    Masa trial untuk <b className="text-rose-300">{tenant.name}</b> telah usai. Pilih paket untuk memulihkan akses dasbor & operasional penuh.
                  </p>
                </div>
              </div>
            )}

            {/* Current status pill */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">Status Saat Ini</span>
                <span className="text-base font-medium text-white">
                  {tenant.subscription?.isTrial
                    ? isLockedDueToExpired
                      ? 'Trial Kedaluwarsa'
                      : `Trial Aktif (Sisa ${tenant.subscription.trialDaysLeft} Hari)`
                    : `Paket ${tenant.subscriptionTier}`}
                </span>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${isLockedDueToExpired
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                {isLockedDueToExpired ? 'TERKUNCI' : (tenant.subscription?.status === 'ACTIVE' ? 'AKTIF' : 'TRIAL')}
              </span>
            </div>

            {/* Plan Selector Cards */}
            <div className="space-y-4">
              <span className="text-sm font-medium text-slate-400">
                Pilih Paket
              </span>

              {/* Starter */}
              <label
                onClick={() => setSelectedTier('STARTER')}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedTier === 'STARTER'
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'border-white/10 hover:border-white/20 bg-slate-900/50'
                  }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-base text-white">Starter</span>
                    <span className="text-[10px] uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-1 rounded-md font-medium">
                      Max {starterPkg?.limit ?? 2} Lapangan
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {starterPkg?.features ? starterPkg.features.join(', ') : 'Kalender live, DP Midtrans, laporan kasir.'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-medium text-lg text-white">Rp {((starterPkg?.price ?? 99000) / 1000)}rb</span>
                  <span className="text-slate-500 text-xs block mt-0.5">/ bulan</span>
                </div>
              </label>

              {/* Pro (Recommended) */}
              <label
                onClick={() => setSelectedTier('PRO')}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all relative ${selectedTier === 'PRO'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    : 'border-white/10 hover:border-white/20 bg-slate-900/50'
                  }`}
              >
                <div className="absolute -top-3 right-5">
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    Paling Laris
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-base text-emerald-400">Pro</span>
                    <span className="text-[10px] uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-1 rounded-md font-medium">
                      Max {proPkg?.limit ?? 6} Lapangan
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {proPkg?.features ? proPkg.features.join(', ') : 'Max 6 lapangan, Auto-WA, multi-kasir & peak hour.'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-medium text-lg text-white">Rp {((proPkg?.price ?? 179000) / 1000)}rb</span>
                  <span className="text-slate-500 text-xs block mt-0.5">/ bulan</span>
                </div>
              </label>

              {/* Enterprise */}
              <label
                onClick={() => setSelectedTier('ENTERPRISE')}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedTier === 'ENTERPRISE'
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'border-white/10 hover:border-white/20 bg-slate-900/50'
                  }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-base text-white">Enterprise</span>
                    <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md font-medium">
                      {entPkg?.limit === 99 ? 'Unlimited' : `Max ${entPkg?.limit} Lapangan`}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {entPkg?.features ? entPkg.features.join(', ') : 'Unlimited, domain custom, support prioritas.'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-medium text-lg text-white">Rp {((entPkg?.price ?? 249000) / 1000)}rb</span>
                  <span className="text-slate-500 text-xs block mt-0.5">/ bulan</span>
                </div>
              </label>
            </div>

            {/* Total Billing */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-sm block">Total Tagihan</span>
                <span className="font-medium text-2xl text-white mt-1 block">
                  {formatCurrency(selectedPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isDemo) {
                    setPaymentStep('DEMO_WARNING');
                  } else {
                    setPaymentStep('MIDTRANS');
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <span>Lanjut Bayar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : paymentStep === 'MIDTRANS' ? (
          /* Midtrans Checkout Step */
          <div className="p-8 space-y-8 relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <QrCode className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-2xl text-white font-instrument">
                Pembayaran {planTitles[selectedTier]}
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Selesaikan pembayaran via QRIS atau Virtual Account. Akses langsung aktif otomatis.
              </p>
            </div>

            <div className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
              <span className="text-slate-400 text-sm block mb-2">Total Pembayaran</span>
              <span className="text-4xl font-medium text-white tracking-tight">
                {formatCurrency(selectedPrice)}
              </span>
            </div>

            <div className="w-full space-y-3 pt-4">
              <button
                type="button"
                onClick={handleSimulateSubscriptionPayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Simulasi Bayar Berhasil</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentStep('SELECT')}
                className="w-full text-center text-slate-400 hover:text-white py-3 text-sm font-medium transition-colors cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        ) : paymentStep === 'DEMO_WARNING' ? (
          <div className="p-8 space-y-8 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2 animate-bounce-soft">
              <AlertTriangle className="w-8 h-8" />
            </div>

          <div className="space-y-3">
            <h3 className="font-medium text-2xl text-white font-instrument">
              Satu Langkah Lagi!
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Anda saat ini berada di akun <b>Demo</b>. Untuk dapat melakukan pembelian paket dan mengelola venue Anda sendiri secara penuh, Anda wajib membuat akun pemilik (owner) terlebih dahulu.
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
                router.push('/login?action=register&openUpgrade=true');
              }}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              Buat Akun Sekarang
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPaymentStep('SELECT')}
              className="w-full text-center text-slate-400 hover:text-white py-3 text-sm font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}
