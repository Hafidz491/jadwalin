'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarCheck2,
  Lock,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { login, loginAsDemo, loginQuick, registerTrialAccount, getCurrentUser } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialPlan = searchParams.get('plan') || 'STARTER';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form (Trial 7 Hari)
  const [regFullName, setRegFullName] = useState('');
  const [regVenueName, setRegVenueName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');

  useEffect(() => {
    // If already logged in, redirect to admin
    const user = getCurrentUser();
    if (user && !user.isDemo) {
      router.push('/admin');
    }
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const res = await login(loginEmail, loginPassword);
    setIsLoading(false);
    if (res.success) {
      router.push('/admin');
    } else {
      setErrorMsg(res.error || 'Gagal login.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regFullName || !regVenueName || !regEmail || !regPassword) {
      setErrorMsg('Semua kolom bertanda bintang wajib diisi');
      return;
    }

    setIsLoading(true);
    const res = await registerTrialAccount({
      fullName: regFullName,
      venueName: regVenueName,
      phone: regPhone || '08123456789',
      email: regEmail,
      password: regPassword,
      city: regCity || 'Jakarta',
    });
    setIsLoading(false);
    if (res.success) {
      if (searchParams.get('openUpgrade') === 'true') {
        router.push('/admin?openSubscription=true');
      } else {
        router.push('/admin?welcome=trial');
      }
    } else {
      setErrorMsg(res.error || 'Gagal mendaftar, silakan coba lagi.');
    }
  };

  const handleQuickLogin = (role: 'OWNER' | 'STAFF') => {
    loginQuick(role);
    router.push('/admin');
  };

  const handleDemoAccess = async () => {
    await loginAsDemo();
    window.open('/admin?demo=true', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Ambient background glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/20 via-slate-900 to-blue-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Jadwalin - Smart Booking & Penjadwalan Lokal"
              width={180}
              height={50}
              className="h-11 w-auto object-contain mx-auto"
              priority
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Otentikasi Aman Jadwalin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeTab === 'login' ? 'Masuk ke Dasbor Venue' : 'Daftar Akun Baru (Trial 7 Hari)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {activeTab === 'login'
              ? 'Kelola jadwal lapangan, status kasir, dan pembayaran DP secara terenkripsi.'
              : 'Coba gratis Paket Starter selama 7 hari tanpa kartu kredit untuk tempat usaha Anda.'}
          </p>
        </div>

        {/* 1-Click Interactive Demo Banner (Req 2) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-xs font-bold">Hanya Ingin Mencoba Fitur?</h2>
              <p className="text-[11px] text-emerald-100">
                Akses demo interaktif instan tanpa registrasi untuk calon klien.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900/50 text-emerald-300 font-extrabold text-xs shadow-sm hover:bg-emerald-500/10 transition-all shrink-0 cursor-pointer"
          >
            Buka Demo Dasbor ➔
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 rounded-2xl bg-white/5 grid grid-cols-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-slate-900/50 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk Akun Terdaftar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-slate-900/50 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Baru (Trial 7 Hari)
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================================
            LOGIN TAB
        ========================================================================= */}
        {activeTab === 'login' && (
          <div className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-sm space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-300">
                  Email Akun Venue
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="owner@gornusantara.id"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <span>Memverifikasi Akun...</span>
                ) : (
                  <>
                    <span>Masuk ke Dasbor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Credential Presets */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Pilih Akses Cepat (Akun Bawaan)
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('OWNER')}
                  className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10/60 hover:bg-emerald-500/20/70 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>👑 Akun Owner</span>
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Akses penuh keuangan & setting
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('STAFF')}
                  className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10/60 hover:bg-blue-500/20/70 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-blue-300 font-bold">
                    <span>📋 Akun Kasir</span>
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-blue-400 block mt-0.5">
                    Operasional jadwal & walk-in
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REGISTER TAB (TRIAL 7 HARI PAKET STARTER)
        ========================================================================= */}
        {activeTab === 'register' && (
          <div className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-sm space-y-5">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20/80 text-amber-200 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Masa Percobaan Gratis 7 Hari:</strong> Anda mendapatkan akses penuh Paket Starter UMKM untuk 2 lapangan. Tidak ada penagihan sebelum masa trial berakhir.
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Nama Pemilik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Wijaya"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Nama Tempat Usaha (GOR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: GOR Futsal Prima"
                    value={regVenueName}
                    onChange={(e) => setRegVenueName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Kota Tempat Usaha
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="hendra@futsalprima.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Buat Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aktifkan Trial 7 Hari & Buka Dasbor</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 font-medium text-sm">
            Memuat Halaman Login...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
