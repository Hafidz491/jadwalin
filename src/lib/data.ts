import { Tenant, Court, Booking, FinancialMetric, SportType } from './types';
import { getTodayDateString } from './utils';
import { getCurrentUser } from './auth';
import {
  getTenantAction,
  getTenantBySlugAction,
  saveTenantAction,
  getCourtsAction,
  saveCourtsAction,
  getBookingsAction,
  saveBookingsAction,
  addBookingAction
} from '@/app/actions';

export const INITIAL_TENANT: Tenant = {
  id: 'tenant-owner-001',
  slug: 'venue-saya',
  name: 'Venue Olahraga Saya',
  description: 'Pusat olahraga modern. Sistem booking real-time online & kasir anti ghosting.',
  phone: '081234567890',
  email: 'admin@venuesaya.id',
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
  subscriptionTier: 'STARTER',
  subscription: {
    tier: 'STARTER',
    status: 'TRIAL',
    isTrial: true,
    trialDaysLeft: 7,
    trialEndsAt: '2026-10-12T23:59:59.000Z',
    activatedAt: '2026-10-05T00:00:00.000Z',
    expiresAt: '2026-10-12T23:59:59.000Z',
    pricePerMonth: 99000,
    courtLimit: 2,
  },
};

export const INITIAL_COURTS: Court[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];

export const DEMO_COURTS: Court[] = [
  { 
    id: 'court-1', 
    tenantId: 'tenant-owner-001',
    name: 'Lapangan Futsal 1 (Sintetis)', 
    sportType: 'Futsal', 
    pricePerHour: 150000, 
    isActive: true,
    description: 'Lapangan rumput sintetis standar internasional.',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&q=80',
    features: ['Rumput Sintetis FIFA', 'Lampu LED 400 Lux']
  },
  { 
    id: 'court-2', 
    tenantId: 'tenant-owner-001',
    name: 'Lapangan Futsal 2 (Vinyl)', 
    sportType: 'Futsal', 
    pricePerHour: 180000, 
    isActive: true,
    description: 'Lapangan vinyl empuk dan anti slip.',
    imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=500&q=80',
    features: ['Vinyl Interlock', 'Papan Skor Digital']
  }
];

export const DEMO_BOOKINGS: Booking[] = [];

export function clearAllDummyData(): void {}

export async function getTenantData(): Promise<Tenant | null> {
  const currentUser = getCurrentUser();
  if (currentUser) {
    if (currentUser.isDemo) return { ...INITIAL_TENANT, slug: 'gor-nusantara' };
    return await getTenantAction(currentUser.tenantId);
  }
  // Try to find a slug from the URL or similar in client, but actions handle it better.
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/b/')) {
      const slug = path.split('/')[2];
      if (slug === 'gor-nusantara') return { ...INITIAL_TENANT, slug: 'gor-nusantara' };
      return await getTenantBySlugAction(slug);
    }
  }
  return INITIAL_TENANT;
}

export async function saveTenantData(tenant: Tenant): Promise<void> {
  const currentUser = getCurrentUser();
  const isExplicitDemo = Boolean(currentUser?.isDemo || (tenant?.slug === 'gor-nusantara' && !currentUser));
  if (isExplicitDemo) return;
  await saveTenantAction(tenant);
}

export async function getCourtsData(): Promise<Court[]> {
  const currentUser = getCurrentUser();
  if (currentUser) {
    if (currentUser.isDemo) return DEMO_COURTS;
    return await getCourtsAction(currentUser.tenantId);
  }
  
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/b/')) {
      const slug = path.split('/')[2];
      if (slug === 'gor-nusantara') return DEMO_COURTS;
      const t = await getTenantBySlugAction(slug);
      if (t) return await getCourtsAction(t.id);
    }
  }
  return DEMO_COURTS;
}

export async function saveCourtsData(courts: Court[]): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isDemo) return;
  await saveCourtsAction(currentUser.tenantId, courts);
}

export async function getBookingsData(): Promise<Booking[]> {
  const currentUser = getCurrentUser();
  if (currentUser) {
    if (currentUser.isDemo) return DEMO_BOOKINGS;
    return await getBookingsAction(currentUser.tenantId);
  }
  
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/b/')) {
      const slug = path.split('/')[2];
      if (slug === 'gor-nusantara') return DEMO_BOOKINGS;
      const t = await getTenantBySlugAction(slug);
      if (t) return await getBookingsAction(t.id);
    }
  }
  return DEMO_BOOKINGS;
}

export async function saveBookingsData(bookings: Booking[]): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isDemo) return;
  await saveBookingsAction(currentUser.tenantId, bookings);
}

export async function addBooking(booking: Booking): Promise<void> {
  const currentUser = getCurrentUser();
  if (currentUser?.isDemo) return;
  await addBookingAction(booking);
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | null> {
  const currentUser = getCurrentUser();
  if (currentUser?.isDemo) return null;
  // This is a naive implementation just for the webhook for now
  const allBookings = await getBookingsData();
  const index = allBookings.findIndex((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (index === -1) return null;
  allBookings[index] = { ...allBookings[index], ...updates };
  await saveBookingsData(allBookings);
  return allBookings[index];
}

export function checkSlotAvailability(
  courtId: string,
  date: string,
  startHour: number,
  durationHours: number,
  excludeBookingId?: string
): boolean {
  return true; // Simplification for migration
}

export function getFinancialMetrics(customBookings?: Booking[]): {
  todayRevenue: number;
  todayDp: number;
  todayCashRemaining: number;
  monthRevenue: number;
  totalBookings: number;
  antiGhostingSavings: number;
} {
  const bookings = customBookings || [];
  const currentToday = getTodayDateString();

  let todayRevenue = 0;
  let todayDp = 0;
  let todayCashRemaining = 0;
  let monthRevenue = 0;
  let totalBookings = 0;

  bookings.forEach((b) => {
    if (b.bookingStatus !== 'CANCELLED') {
      monthRevenue += b.totalAmount;
      totalBookings += 1;

      if (b.date === currentToday) {
        todayRevenue += b.totalAmount;
        todayDp += b.dpAmount;
        if (b.paymentStatus === 'SETTLEMENT' && b.remainingAmount > 0) {
          todayCashRemaining += b.remainingAmount;
        }
      }
    }
  });

  const antiGhostingSavings = Math.round(monthRevenue * 0.25);

  return {
    todayRevenue,
    todayDp,
    todayCashRemaining,
    monthRevenue,
    totalBookings,
    antiGhostingSavings,
  };
}
