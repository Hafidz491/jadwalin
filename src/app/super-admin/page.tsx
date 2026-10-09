'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  Package,
  Activity,
  Download,
  Settings,
  Search,
  MoreVertical,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  LogOut,
  Check,
  Globe
} from 'lucide-react';
import { formatCurrency, getTodayDateString } from '@/lib/utils';
import { SubscriptionTier } from '@/lib/types';
import { DEFAULT_PACKAGES, PackageConfig, loadPackages, savePackages } from '@/lib/packages';
import Image from 'next/image';

// ─── Dummy Data ─────────────────────────────────────────────────────────────

// Package data (incl. benefits) is shared with the landing page via '@/lib/packages'.

// MOCK_REVENUE dihilangkan karena sekarang dihitung dari data real

type SuperAdminTab = 'overview' | 'tenants' | 'packages' | 'reports';

// ─── Components ─────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [packages, setPackages] = useState<PackageConfig[]>(DEFAULT_PACKAGES);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const refreshTenants = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // 1. Get primary tenant data (dari dasbor owner)
    const tenantDataRaw = localStorage.getItem('jadwalin_tenant_data');
    let primaryTenantObj: any = null;
    if (tenantDataRaw) {
      try {
        const t = JSON.parse(tenantDataRaw);
        primaryTenantObj = {
          id: t.id || 'tenant-gor-nusantara',
          name: t.name,
          owner: t.ownerName || 'Pemilik (Current)',
          plan: t.subscriptionTier || 'STARTER',
          status: t.subscription?.status || 'TRIAL',
          joinedAt: t.subscription?.activatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          mrr: t.subscription?.pricePerMonth || 99000,
          subdomain: t.customSubdomain || t.slug || 'venue'
        };
      } catch {}
    }

    // 2. Get registered custom users
    const customUsersRaw = localStorage.getItem('jadwalin_custom_users');
    let mappedUsers: any[] = [];
    if (customUsersRaw) {
      try {
        const customUsers = JSON.parse(customUsersRaw);
        mappedUsers = customUsers.map((cu: any) => ({
          id: cu.user.id || `cu-${Date.now()}`,
          name: cu.tenant?.name || cu.user.tenantName,
          owner: cu.user.name,
          plan: cu.tenant?.subscriptionTier || 'STARTER',
          status: cu.tenant?.subscription?.status || 'TRIAL',
          joinedAt: cu.tenant?.subscription?.activatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          mrr: cu.tenant?.subscription?.pricePerMonth || 99000,
          subdomain: cu.tenant?.customSubdomain || cu.tenant?.slug || 'venue'
        }));
      } catch {}
    }

    // Combine them, putting primary tenant at the top if exists
    if (primaryTenantObj) {
      const filteredMapped = mappedUsers.filter(u => u.id !== primaryTenantObj.id);
      setTenantsList([primaryTenantObj, ...filteredMapped]);
    } else {
      setTenantsList([...mappedUsers]);
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const auth = sessionStorage.getItem('jadwalin_superadmin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
      setIsAuthLoading(false);
    };
    checkAuth();

    if (typeof window !== 'undefined') {
      setPackages(loadPackages());
      refreshTenants();
      // Auto-refresh every 3 seconds to get real-time updates from owner dashboard
      const interval = setInterval(refreshTenants, 3000);
      return () => clearInterval(interval);
    }
  }, [refreshTenants]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginEmail === 'hafidz@gmail.com' && loginPassword === 'hafidz1354') {
      sessionStorage.setItem('jadwalin_superadmin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setLoginError('Email atau password salah.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('jadwalin_superadmin_auth');
    setIsAuthenticated(false);
  };

  const handleDownloadCSV = () => {
    const headers = ['Nama Venue', 'Pemilik', 'Paket', 'Status', 'Bergabung', 'MRR'];
    const rows = tenantsList.map(t => [
      `"${t.name}"`, 
      `"${t.owner}"`, 
      t.plan, 
      t.status, 
      t.joinedAt, 
      t.mrr
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laporan-keuangan-jadwalin.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateTenantStatus = (id: string, newStatus: string) => {
    const updated = tenantsList.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTenantsList(updated);

    if (typeof window !== 'undefined') {
      // 1. Update in primary tenant storage if it matches
      const tenantDataRaw = localStorage.getItem('jadwalin_tenant_data');
      if (tenantDataRaw) {
        try {
          const primary = JSON.parse(tenantDataRaw);
          if (primary.id === id || (!primary.id && id === 'tenant-gor-nusantara')) {
            if (!primary.subscription) {
              primary.subscription = { tier: primary.subscriptionTier || 'STARTER' };
            }
            primary.subscription.status = newStatus;
            primary.subscription.isTrial = newStatus === 'TRIAL';
            if (newStatus === 'ACTIVE') {
              primary.subscription.trialDaysLeft = 0;
            }
            localStorage.setItem('jadwalin_tenant_data', JSON.stringify(primary));
          }
        } catch {}
      }

      // 2. Update in custom users if it's a registered user
      const customUsersRaw = localStorage.getItem('jadwalin_custom_users');
      if (customUsersRaw) {
        try {
          let customUsers = JSON.parse(customUsersRaw);
          customUsers = customUsers.map((cu: any) => {
            if (cu.user?.id === id || cu.user?.tenantId === id || cu.tenant?.id === id) {
              if (cu.tenant) {
                if (!cu.tenant.subscription) {
                  cu.tenant.subscription = { tier: cu.tenant.subscriptionTier || 'STARTER' };
                }
                cu.tenant.subscription.status = newStatus;
                cu.tenant.subscription.isTrial = newStatus === 'TRIAL';
              }
            }
            return cu;
          });
          localStorage.setItem('jadwalin_custom_users', JSON.stringify(customUsers));
        } catch {}
      }
    }
  };

  const openEditPackage = (pkg: PackageConfig) => {
    const fallback = DEFAULT_PACKAGES.find(d => d.id === pkg.id)?.features || [];
    const features = pkg.features && pkg.features.length > 0 ? pkg.features : fallback;
    setEditingPackage({ ...pkg, features: [...features] });
    setFeaturesText(features.join('\n'));
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const saved = { ...editingPackage, features };
    const updated = packages.map(p => p.id === saved.id ? saved : p);
    setPackages(updated);
    savePackages(updated);
    setEditingPackage(null);
  };

  const filteredTenants = useMemo(() => {
    return tenantsList.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tenantsList]);

  // Real data calculations
  const { thisMonthMRR, totalRevenue, activeClients, newClients } = useMemo(() => {
    const active = tenantsList.filter(t => t.status === 'ACTIVE');
    const mrr = active.reduce((sum, t) => sum + t.mrr, 0);
    return {
      thisMonthMRR: mrr,
      totalRevenue: mrr, // Tanpa data historis, total adalah MRR saat ini
      activeClients: active.length,
      newClients: active.length // Contoh simpel
    };
  }, [tenantsList]);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <span className="relative inline-flex shrink-0">
              <span className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md" aria-hidden />
              <Image
                src="/logo-icon.png"
                alt="Jadwalin"
                width={36}
                height={36}
                className="relative object-contain"
              />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Super Admin Login</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Restricted Area</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Super Admin</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="superadmin@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/25 mt-2"
            >
              Masuk Dasbor
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* ─── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900/50 border-r border-white/5 backdrop-blur-xl z-50 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex shrink-0">
              <span className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md" aria-hidden />
              <Image
                src="/logo-icon.png"
                alt="Jadwalin"
                width={32}
                height={32}
                className="relative object-contain"
              />
            </span>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-tight">Super Admin</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Top Secret</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" /> Home
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tenants' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" /> Klien (Venues)
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'packages' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Package className="w-4 h-4" /> Manajemen Paket
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'reports' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Laporan Keuangan
          </button>
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <main className="pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          
          {/* Header */}
          <header className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                {activeTab === 'overview' && 'Home - Bisnis'}
                {activeTab === 'tenants' && 'Daftar Klien (Venues)'}
                {activeTab === 'packages' && 'Manajemen Paket Langganan'}
                {activeTab === 'reports' && 'Laporan Keuangan Platform'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Data real-time untuk platform Jadwalin.
              </p>
            </div>
            {activeTab === 'reports' && (
              <button 
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh Laporan
              </button>
            )}
          </header>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <span className="text-slate-400 text-sm font-medium">Pendapatan Bulan Ini (MRR)</span>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-3xl font-bold text-white tracking-tight">{formatCurrency(thisMonthMRR)}</span>
                  </div>
                </div>
                
                <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <span className="text-slate-400 text-sm font-medium">Total Pendapatan (Tercatat)</span>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-3xl font-bold text-white tracking-tight">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <span className="text-slate-400 text-sm font-medium">Total Klien Aktif</span>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-3xl font-bold text-white tracking-tight">{activeClients}</span>
                    <span className="text-slate-400 text-sm mb-1">Venues</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl">
                <h3 className="text-base font-semibold text-white mb-6">Aktivitas Terbaru</h3>
                <div className="space-y-4">
                  {tenantsList.slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Status {t.name} sekarang {t.status}</p>
                          <p className="text-xs text-slate-400">{t.owner} • {t.plan}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Hari ini</span>
                    </div>
                  ))}
                  {tenantsList.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">Belum ada aktivitas klien.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tenants' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div className="relative w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Cari nama venue atau pemilik..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Nama Venue</th>
                      <th className="px-6 py-4 font-medium">Pemilik</th>
                      <th className="px-6 py-4 font-medium">URL Path</th>
                      <th className="px-6 py-4 font-medium">Paket</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTenants.map(t => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{t.name}</td>
                        <td className="px-6 py-4 text-slate-300">{t.owner}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                            jadwalin.id/{(t as any).subdomain || 'venue'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${
                            t.plan === 'PRO' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.plan === 'ENTERPRISE' ? 'bg-indigo-500/10 text-indigo-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {t.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-400' : t.status === 'TRIAL' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                            <span className="text-slate-300 capitalize">{t.status.toLowerCase()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select 
                            value={t.status}
                            onChange={(e) => updateTenantStatus(t.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:border-indigo-500 outline-none"
                          >
                            <option value="ACTIVE">Set Active</option>
                            <option value="TRIAL">Set Trial</option>
                            <option value="EXPIRED">Set Expired</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div key={pkg.id} className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-indigo-400 tracking-wider uppercase">{pkg.id}</span>
                      <button onClick={() => openEditPackage(pkg)} title="Edit paket" className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                    <div className="mt-2 text-2xl font-bold text-white tracking-tight flex items-center justify-between">
                      <div>
                        {formatCurrency(pkg.price)} <span className="text-sm text-slate-400 font-medium">/bln</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 text-sm text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">Limit Lapangan</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{pkg.limit} Lapangan</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">Klien Aktif</span>
                        <span className="font-medium text-white">{pkg.activeUsers} Venue</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400">Estimasi MRR</span>
                        <span className="font-medium text-emerald-400">{formatCurrency(pkg.price * pkg.activeUsers)}</span>
                      </div>
                    </div>
                    <ul className="mt-5 pt-5 border-t border-white/5 space-y-2.5 text-sm text-slate-300">
                      {pkg.features.map((f, i) => (
                        <li key={`${pkg.id}-${i}`} className="flex gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="p-8 rounded-3xl bg-slate-900 border border-white/5 shadow-xl text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white">Laporan Keuangan Bulanan</h3>
                <p className="text-slate-400 mt-2 max-w-md mx-auto">
                  Modul laporan keuangan otomatis sedang diakumulasi. Anda dapat mengunduh laporan PDF format standar atau CSV untuk dianalisa di Excel.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button onClick={handleDownloadCSV} className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2">
                    <Download className="w-4 h-4" /> Unduh PDF
                  </button>
                  <button onClick={handleDownloadCSV} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-colors cursor-pointer">
                    Ekspor CSV
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Package Edit Modal */}
      {editingPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingPackage(null)}></div>
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Edit Paket: {editingPackage.id}</h3>
            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Nama Paket</label>
                <input 
                  type="text" 
                  value={editingPackage.name} 
                  onChange={e => setEditingPackage({...editingPackage, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Harga (Rp)</label>
                  <input 
                    type="number" 
                    value={editingPackage.price} 
                    onChange={e => setEditingPackage({...editingPackage, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Limit Lapangan</label>
                  <input 
                    type="number" 
                    value={editingPackage.limit} 
                    onChange={e => setEditingPackage({...editingPackage, limit: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Benefit / Fitur (satu benefit per baris)</label>
                <textarea 
                  value={featuresText} 
                  onChange={e => setFeaturesText(e.target.value)}
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm leading-relaxed focus:border-indigo-500 outline-none min-h-[160px]"
                  placeholder={'Fitur A\nFitur B\nFitur C'}
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {featuresText.split('\n').filter(f => f.trim()).length} benefit · tekan Enter untuk menambah baris baru
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingPackage(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-colors cursor-pointer shadow-lg shadow-indigo-500/25">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
