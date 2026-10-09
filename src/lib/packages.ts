import { SubscriptionTier } from './types';

export interface PackageConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  limit: number;
  activeUsers: number;
  features: string[];
}

export const PACKAGES_STORAGE_KEY = 'jadwalin_packages';

/**
 * Default package data — identical to what is shown on the landing page pricing section.
 * Used as the source of truth when nothing (or incomplete data) is stored yet.
 */
export const DEFAULT_PACKAGES: PackageConfig[] = [
  {
    id: 'STARTER',
    name: 'Starter UMKM',
    price: 99000,
    limit: 2,
    activeUsers: 45,
    features: [
      'Trial 7 hari penuh, tanpa tagihan otomatis',
      'Hingga 2 lapangan',
      'Halaman booking publik real-time',
      'Pembayaran DP via Midtrans',
      'Input booking manual oleh kasir',
    ],
  },
  {
    id: 'PRO',
    name: 'Juara Pro',
    price: 179000,
    limit: 6,
    activeUsers: 128,
    features: [
      'Paket berbayar, aktif saat itu juga',
      'Hingga 6 lapangan',
      'WhatsApp otomatis (Fonnte / Wablas)',
      'Multi-staf kasir (shift pagi & malam)',
      'Tarif prime time / peak hour',
      'Ekspor laporan ke PDF & CSV',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise GOR',
    price: 249000,
    limit: 99,
    activeUsers: 12,
    features: [
      'Paket berbayar resmi',
      'Lapangan & fasilitas tanpa batas',
      'Custom domain (namagormu.com)',
      'Nomor WhatsApp pengirim khusus usaha',
      'Prioritas CS & setup didampingi',
    ],
  },
];

const cloneDefaults = (): PackageConfig[] =>
  DEFAULT_PACKAGES.map((p) => ({ ...p, features: [...p.features] }));

/**
 * Loads packages from localStorage and merges them with the defaults per tier.
 * Any missing/empty field (e.g. `features` from older saved data) falls back to the default,
 * and the repaired result is written back so storage stays consistent.
 */
export function loadPackages(): PackageConfig[] {
  if (typeof window === 'undefined') return cloneDefaults();

  let saved: Partial<PackageConfig>[] = [];
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    saved = [];
  }

  const merged = DEFAULT_PACKAGES.map((def) => {
    const s = saved.find((p) => p?.id === def.id) || {};
    const features =
      Array.isArray(s.features) && s.features.filter(Boolean).length > 0
        ? s.features.filter(Boolean)
        : [...def.features];
    return {
      ...def,
      ...s,
      id: def.id,
      name: s.name || def.name,
      price: typeof s.price === 'number' ? s.price : def.price,
      limit: typeof s.limit === 'number' ? s.limit : def.limit,
      activeUsers: typeof s.activeUsers === 'number' ? s.activeUsers : def.activeUsers,
      features,
    } as PackageConfig;
  });

  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function savePackages(packages: PackageConfig[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}
