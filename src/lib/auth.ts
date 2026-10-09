import { AuthUser, SubscriptionTier, Tenant } from './types';
import { getTenantData, saveTenantData, clearAllDummyData, saveCourtsData, saveBookingsData } from './data';
import { Court } from './types';

const AUTH_STORAGE_KEY = 'jadwalin_session_user';

export const DEFAULT_USERS: { email: string; pass: string; user: AuthUser }[] = [
  {
    email: 'owner@gornusantara.id',
    pass: 'admin123',
    user: {
      id: 'usr-owner-001',
      name: 'Pemilik Lapangan',
      email: 'owner@gornusantara.id',
      role: 'OWNER',
      tenantId: 'tenant-owner-001',
      tenantName: 'Venue Olahraga Saya',
      isDemo: false,
    },
  },
  {
    email: 'kasir@gornusantara.id',
    pass: 'kasir123',
    user: {
      id: 'usr-staff-001',
      name: 'Rian (Kasir Shift)',
      email: 'kasir@gornusantara.id',
      role: 'STAFF',
      tenantId: 'tenant-gor-nusantara',
      tenantName: 'GOR Futsal & Badminton Nusantara',
      isDemo: false,
    },
  },
  {
    email: 'demo@jadwalin.id',
    pass: 'demo123',
    user: {
      id: 'usr-demo-999',
      name: 'Calon Klien Venue (Demo)',
      email: 'demo@jadwalin.id',
      role: 'DEMO',
      tenantId: 'tenant-gor-nusantara',
      tenantName: 'GOR Futsal & Badminton Nusantara (Demo Mode)',
      isDemo: true,
    },
  },
];

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export function login(email: string, pass: string): { success: boolean; user?: AuthUser; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const match = DEFAULT_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.pass === pass
  );

  if (match) {
    setCurrentUser(match.user);
    return { success: true, user: match.user };
  }

  // Check if it's a registered user from localStorage
  if (typeof window !== 'undefined') {
    const customUsersRaw = localStorage.getItem('jadwalin_custom_users');
    if (customUsersRaw) {
      try {
        let customUsers = JSON.parse(customUsersRaw);
        
        // Remove hafidz@gmail.com if it exists
        const beforeCount = customUsers.length;
        customUsers = customUsers.filter((u: any) => u.email.toLowerCase() !== 'hafidz@gmail.com');
        if (customUsers.length !== beforeCount) {
          localStorage.setItem('jadwalin_custom_users', JSON.stringify(customUsers));
        }

        const customMatch = customUsers.find(
          (u: { email: string; pass: string; user: AuthUser }) =>
            u.email.toLowerCase() === normalizedEmail && u.pass === pass
        );
        if (customMatch) {
          setCurrentUser(customMatch.user);
          return { success: true, user: customMatch.user };
        }
      } catch {}
    }
  }

  return { success: false, error: 'Email atau password salah. Silakan periksa kembali.' };
}

export async function loginAsDemo(): Promise<AuthUser> {
  const demoAccount = DEFAULT_USERS.find((u) => u.user.role === 'DEMO')!.user;
  
  const demoTenant: Tenant = {
    id: demoAccount.tenantId,
    slug: 'gor-nusantara',
    name: demoAccount.tenantName,
    description: 'Pusat olahraga modern. Sistem booking real-time online & kasir anti ghosting.',
    phone: '081234567890',
    email: 'admin@gornusantara.id',
    address: 'Jl. Lapangan Olahraga No. 1',
    city: 'Jakarta Barat, DKI Jakarta',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1400&auto=format&fit=crop&q=80',
    openTime: '07:00',
    closeTime: '23:00',
    minDpPercentage: 30,
    facilities: [
      'Parkir Mobil & Motor Luas',
      'Locker Room & Shower Air Hangat',
      'WiFi Gratis Berkecepatan Tinggi',
      'Musholla Bersih & Ber-AC'
    ],
    midtransServerKey: '',
    midtransClientKey: '',
    midtransIsProd: false,
    waGatewayToken: '',
    waGatewayProvider: 'FONNTE',
    subscriptionTier: 'PRO',
    subscription: {
      tier: 'PRO',
      status: 'ACTIVE',
      isTrial: false,
      trialDaysLeft: 0,
      trialEndsAt: '',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      pricePerMonth: 179000,
      courtLimit: 6,
    },
  };

  const demoCourts: Court[] = [
    {
      id: 'court-1',
      tenantId: demoAccount.tenantId,
      name: 'Lapangan Futsal 1 (Vinyl)',
      sportType: 'Futsal',
      description: 'Lantai vinyl standar internasional.',
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
      pricePerHour: 150000,
      peakPricePerHour: 200000,
      peakStartHour: 18,
      features: ['Papan Skor Digital', 'Tribun Penonton'],
      isActive: true,
    },
    {
      id: 'court-2',
      tenantId: demoAccount.tenantId,
      name: 'Lapangan Badminton A',
      sportType: 'Badminton',
      description: 'Karpet badminton tebal premium.',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      pricePerHour: 75000,
      peakPricePerHour: 0,
      peakStartHour: 18,
      features: ['Karpet Yonex', 'Pencahayaan LED'],
      isActive: true,
    }
  ];

  setCurrentUser(demoAccount);
  await saveTenantData(demoTenant);
  await saveCourtsData(demoCourts);
  await saveBookingsData([]);
  
  return demoAccount;
}

export function loginQuick(role: 'OWNER' | 'STAFF'): AuthUser {
  const account = DEFAULT_USERS.find((u) => u.user.role === role)!.user;
  setCurrentUser(account);
  return account;
}

export function logout(): void {
  setCurrentUser(null);
}

export async function registerTrialAccount(params: {
  fullName: string;
  venueName: string;
  phone: string;
  email: string;
  password: string;
  city?: string;
}): Promise<{ success: boolean; user: AuthUser }> {
  const now = new Date();
  const endsAt = new Date();
  endsAt.setDate(now.getDate() + 7); // 7-day trial limit!

  const tenantSlug = params.venueName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newTenantId = `tenant-${Date.now()}`;
  const newUser: AuthUser = {
    id: `usr-${Date.now()}`,
    name: params.fullName,
    email: params.email,
    role: 'OWNER',
    tenantId: newTenantId,
    tenantName: params.venueName,
    isDemo: false,
  };

  let starterPrice = 99000;
  let starterLimit = 2;
  if (typeof window !== 'undefined') {
    const savedPkgs = localStorage.getItem('jadwalin_packages');
    if (savedPkgs) {
      try {
        const parsed = JSON.parse(savedPkgs);
        const starter = parsed.find((p: { id: string }) => p.id === 'STARTER');
        if (starter) {
          if (starter.price) starterPrice = starter.price;
          if (starter.limit) starterLimit = starter.limit;
        }
      } catch {}
    }
  }

  const newTenantData: Tenant = {
    id: newTenantId,
    slug: tenantSlug || 'venue-baru',
    name: params.venueName,
    ownerName: params.fullName,
    description: `Venue olahraga terpercaya di ${params.city || 'Indonesia'}. Sistem booking otomatis anti ghosting.`,
    phone: params.phone,
    email: params.email,
    address: 'Jl. Olahraga Sehat No. 1',
    city: params.city || 'Jakarta',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1400&auto=format&fit=crop&q=80',
    openTime: '07:00',
    closeTime: '23:00',
    minDpPercentage: 30,
    facilities: ['Parkir Luas', 'Locker Room', 'Kantin', 'WiFi'],
    midtransIsProd: false,
    waGatewayProvider: 'FONNTE',
    subscriptionTier: 'STARTER',
    subscription: {
      tier: 'STARTER',
      status: 'TRIAL',
      isTrial: true,
      trialDaysLeft: 7,
      trialEndsAt: endsAt.toISOString(),
      activatedAt: now.toISOString(),
      expiresAt: endsAt.toISOString(),
      pricePerMonth: starterPrice,
      courtLimit: starterLimit,
    },
  };

  // Save tenant & custom user, ensuring fresh clean dashboard (no dummy data)
  clearAllDummyData();
  await saveTenantData(newTenantData);
  if (typeof window !== 'undefined') {
    const customUsersRaw = localStorage.getItem('jadwalin_custom_users') || '[]';
    try {
      const customUsers = JSON.parse(customUsersRaw);
      customUsers.push({
        email: params.email,
        pass: params.password,
        user: newUser,
        tenant: newTenantData,
      });
      localStorage.setItem('jadwalin_custom_users', JSON.stringify(customUsers));
    } catch {}
  }

  setCurrentUser(newUser);
  return { success: true, user: newUser };
}

export async function upgradePlan(tier: SubscriptionTier): Promise<Tenant> {
  // NOTE: Do NOT clear courts and bookings data on subscription upgrade!
  const currentTenant = await getTenantData();
  if (!currentTenant) return INITIAL_TENANT;
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setMonth(now.getMonth() + 1);

  const priceMap: Record<SubscriptionTier, number> = {
    STARTER: 99000,
    PRO: 179000,
    ENTERPRISE: 249000,
  };

  const limitMap: Record<SubscriptionTier, number> = {
    STARTER: 2,
    PRO: 6,
    ENTERPRISE: 99,
  };

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('jadwalin_packages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: { id: SubscriptionTier; price: number; limit: number }) => {
            if (p.id === 'STARTER' || p.id === 'PRO' || p.id === 'ENTERPRISE') {
              priceMap[p.id] = p.price;
              limitMap[p.id] = p.limit;
            }
          });
        }
      } catch {}
    }
  }

  const updated: Tenant = {
    ...currentTenant,
    subscriptionTier: tier,
    subscription: {
      tier,
      status: 'ACTIVE',
      isTrial: false,
      trialDaysLeft: 0,
      trialEndsAt: '',
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      pricePerMonth: priceMap[tier],
      courtLimit: limitMap[tier],
    },
  };

  await saveTenantData(updated);

  // Also sync with jadwalin_custom_users if applicable
  if (typeof window !== 'undefined') {
    const currentUser = getCurrentUser();
    const customUsersRaw = localStorage.getItem('jadwalin_custom_users');
    if (customUsersRaw && currentUser) {
      try {
        let customUsers = JSON.parse(customUsersRaw);
        customUsers = customUsers.map((cu: any) => {
          if (cu.user?.id === currentUser.id || cu.user?.tenantId === currentTenant.id) {
            return {
              ...cu,
              tenant: updated,
            };
          }
          return cu;
        });
        localStorage.setItem('jadwalin_custom_users', JSON.stringify(customUsers));
      } catch {}
    }
  }

  return updated;
}

export function checkSubscriptionTrialStatus(tenant: Tenant): {
  isTrial: boolean;
  isExpired: boolean;
  daysLeft: number;
  endsAt: string;
} {
  const sub = tenant.subscription;
  if (!sub || !sub.isTrial) {
    return { isTrial: false, isExpired: false, daysLeft: 0, endsAt: '' };
  }

  if (sub.status === 'EXPIRED' || sub.trialDaysLeft <= 0) {
    return { isTrial: true, isExpired: true, daysLeft: 0, endsAt: sub.trialEndsAt || '' };
  }

  const now = Date.now();
  const endsTime = sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : 0;
  if (endsTime > 0 && now >= endsTime) {
    return { isTrial: true, isExpired: true, daysLeft: 0, endsAt: sub.trialEndsAt };
  }

  const diffDays = endsTime > 0 ? Math.ceil((endsTime - now) / (1000 * 60 * 60 * 24)) : sub.trialDaysLeft;
  const daysLeft = Math.max(0, diffDays);

  return {
    isTrial: true,
    isExpired: daysLeft <= 0,
    daysLeft,
    endsAt: sub.trialEndsAt || '',
  };
}

export async function simulateSetTrialDays(days: number): Promise<Tenant> {
  const currentTenant = await getTenantData();
  if (!currentTenant) return INITIAL_TENANT;
  const now = new Date();
  const endsAt = new Date();
  endsAt.setDate(now.getDate() + days);

  const updated: Tenant = {
    ...currentTenant,
    subscription: {
      tier: currentTenant.subscription?.tier || 'STARTER',
      status: days <= 0 ? 'EXPIRED' : 'TRIAL',
      isTrial: true,
      trialDaysLeft: Math.max(0, days),
      trialEndsAt: days <= 0 ? new Date(Date.now() - 3600000).toISOString() : endsAt.toISOString(),
      activatedAt: currentTenant.subscription?.activatedAt || now.toISOString(),
      expiresAt: endsAt.toISOString(),
      pricePerMonth: 99000,
      courtLimit: 2,
    },
  };
  await saveTenantData(updated);
  return updated;
}
