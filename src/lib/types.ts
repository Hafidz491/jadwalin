export type SportType = 'Futsal' | 'Badminton' | 'Padel' | 'Mini Soccer' | 'Tennis' | 'Basket' | 'Studio';

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentType = 'DP_ONLY' | 'FULL_PAYMENT' | 'CASH_ON_SITE';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'SETTLEMENT' | 'EXPIRE' | 'CANCEL';

export type SubscriptionTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED';

export type UserRole = 'OWNER' | 'STAFF' | 'DEMO';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  isDemo?: boolean;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isTrial: boolean;
  trialDaysLeft: number;
  trialEndsAt: string;
  activatedAt: string;
  expiresAt: string;
  pricePerMonth: number;
  courtLimit: number;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerName?: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl: string;
  bannerUrl: string;
  openTime: string; // e.g. "07:00"
  closeTime: string; // e.g. "23:00"
  minDpPercentage: number; // e.g. 30
  facilities: string[];
  
  // Midtrans credentials
  midtransServerKey?: string;
  midtransClientKey?: string;
  midtransIsProd: boolean;
  
  // WhatsApp Gateway
  waGatewayToken?: string;
  waGatewayProvider: 'FONNTE' | 'WABLAS';
  
  subscriptionTier: SubscriptionTier;
  subscription: SubscriptionInfo;

  // Custom Domain / Subdomain (Enterprise exclusive)
  customSubdomain?: string;
  customDomain?: string;
}

export interface Court {
  id: string;
  tenantId: string;
  name: string;
  sportType: SportType;
  description: string;
  imageUrl: string;
  pricePerHour: number;
  peakPricePerHour?: number;
  peakStartHour?: number; // e.g. 18 (18:00 WIB)
  features: string[];
  isActive: boolean;
}

export interface TimeSlot {
  hour: number; // 7, 8, ... 23
  timeLabel: string; // "07:00 - 08:00"
  price: number;
  isPeak: boolean;
  isAvailable: boolean;
  status: 'available' | 'booked' | 'pending' | 'past';
  bookingId?: string;
  customerName?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tenantId: string;
  courtId: string;
  courtName: string;
  sportType: SportType;
  
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  
  date: string; // "YYYY-MM-DD"
  startHour: number;
  endHour: number;
  durationHours: number;
  
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  
  paymentType: PaymentType;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  
  isManualBooking: boolean;
  bookedByStaff?: string;
  
  midtransOrderId?: string;
  snapToken?: string;
  paymentMethod?: string; // "QRIS", "BCA Virtual Account", "GoPay", "Tunai Kasir"
  paidAt?: string;
  
  waNotificationSent: boolean;
  createdAt: string;
  expiresAt?: string; // ISO string for auto-expiration of pending payment (e.g. 15 mins)
}

export interface FinancialMetric {
  date: string;
  totalIncome: number;
  dpOnlineIncome: number;
  cashOnSiteIncome: number;
  bookingCount: number;
}

export interface InboxNotification {
  id: string;
  bookingId: string;
  bookingCode: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  date: string; // "YYYY-MM-DD"
  startHour: number;
  endHour: number;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  isManual: boolean;
  isRead: boolean;
  createdAt: string;
}
