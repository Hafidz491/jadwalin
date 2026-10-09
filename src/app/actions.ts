'use server';

import prisma from '@/lib/prisma';
import { Tenant, Court, Booking, SubscriptionTier } from '@/lib/types';

// For simplicity in this migration, we pass tenantId from the client
// which reads it from localStorage.

export async function getTenantAction(tenantId: string): Promise<Tenant | null> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!t) return null;
  return {
    ...t,
    facilities: [], // We can mock or add a field if needed
    subscription: {
      tier: t.subscriptionTier as SubscriptionTier,
      status: 'ACTIVE',
      isTrial: false,
      trialDaysLeft: 0,
      trialEndsAt: '',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      pricePerMonth: 0,
      courtLimit: 99,
    },
  } as unknown as Tenant;
}

export async function getTenantBySlugAction(slug: string): Promise<Tenant | null> {
  const t = await prisma.tenant.findUnique({ where: { slug } });
  if (!t) return null;
  return {
    ...t,
    facilities: [], 
    subscription: {
      tier: t.subscriptionTier as SubscriptionTier,
      status: 'ACTIVE',
      isTrial: false,
      trialDaysLeft: 0,
      trialEndsAt: '',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      pricePerMonth: 0,
      courtLimit: 99,
    },
  } as unknown as Tenant;
}

export async function saveTenantAction(tenant: Tenant): Promise<void> {
  await prisma.tenant.upsert({
    where: { id: tenant.id },
    update: {
      name: tenant.name,
      ownerName: tenant.ownerName,
      slug: tenant.slug,
      description: tenant.description || '',
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      city: tenant.city,
      logoUrl: tenant.logoUrl,
      bannerUrl: tenant.bannerUrl,
      openTime: tenant.openTime,
      closeTime: tenant.closeTime,
      minDpPercentage: tenant.minDpPercentage,
      subscriptionTier: tenant.subscriptionTier as any,
    },
    create: {
      id: tenant.id,
      name: tenant.name,
      ownerName: tenant.ownerName,
      slug: tenant.slug || `slug-${Date.now()}`,
      description: tenant.description || '',
      phone: tenant.phone || '081234567890',
      email: tenant.email,
      address: tenant.address || 'Alamat',
      city: tenant.city,
      logoUrl: tenant.logoUrl,
      bannerUrl: tenant.bannerUrl,
      openTime: tenant.openTime || '07:00',
      closeTime: tenant.closeTime || '23:00',
      minDpPercentage: tenant.minDpPercentage || 30,
      subscriptionTier: (tenant.subscriptionTier || 'PRO') as any,
    }
  });
}

export async function getCourtsAction(tenantId: string): Promise<Court[]> {
  const courts = await prisma.court.findMany({ where: { tenantId } });
  return courts.map(c => ({
    ...c,
    features: []
  })) as unknown as Court[];
}

export async function saveCourtsAction(tenantId: string, courts: Court[]): Promise<void> {
  // In a real app we'd sync precisely. For this migration, we'll upsert all and delete missing.
  const existing = await prisma.court.findMany({ where: { tenantId }, select: { id: true } });
  const existingIds = existing.map(e => e.id);
  const incomingIds = courts.map(c => c.id);
  
  const toDelete = existingIds.filter(id => !incomingIds.includes(id));
  if (toDelete.length > 0) {
    await prisma.court.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const c of courts) {
    try {
      await prisma.court.upsert({
        where: { id: c.id },
        update: {
          name: c.name,
          sportType: c.sportType,
          pricePerHour: c.pricePerHour,
          peakPricePerHour: c.peakPricePerHour,
          peakStartHour: c.peakStartHour,
          isActive: c.isActive,
          imageUrl: c.imageUrl,
          description: c.description
        },
        create: {
          id: c.id,
          tenantId,
          name: c.name || 'Unnamed',
          sportType: c.sportType || 'Futsal',
          pricePerHour: c.pricePerHour || 100000,
          peakPricePerHour: c.peakPricePerHour,
          peakStartHour: c.peakStartHour,
          isActive: c.isActive ?? true,
          imageUrl: c.imageUrl,
          description: c.description
        }
      });
    } catch (e: any) {
      if (e.message && e.message.includes('Foreign key constraint')) {
        console.warn('Ignored court upsert for non-existent tenant.');
        continue;
      }
      throw e;
    }
  }
}

export async function getBookingsAction(tenantId: string): Promise<Booking[]> {
  const b = await prisma.booking.findMany({ 
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { court: true }
  });
  return b.map((bk) => ({
    ...bk,
    courtName: bk.court?.name || 'Unknown',
    sportType: bk.court?.sportType || 'Unknown'
  })) as unknown as Booking[];
}

export async function saveBookingsAction(tenantId: string, bookings: Booking[]): Promise<void> {
  for (const b of bookings) {
    try {
      await prisma.booking.upsert({
        where: { id: b.id },
        update: {
          bookingCode: b.bookingCode,
          courtId: b.courtId,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          date: b.date,
          startHour: b.startHour,
          endHour: b.endHour,
          durationHours: b.durationHours,
          totalAmount: b.totalAmount,
          dpAmount: b.dpAmount,
          remainingAmount: b.remainingAmount,
          bookingStatus: b.bookingStatus as any,
          paymentStatus: b.paymentStatus as any,
          paymentType: b.paymentType as any,
          isManualBooking: b.isManualBooking
        },
        create: {
          id: b.id,
          bookingCode: b.bookingCode || `BKG-${Date.now()}`,
          tenantId,
          courtId: b.courtId,
          customerName: b.customerName || 'Customer',
          customerPhone: b.customerPhone || '08123',
          date: b.date || new Date().toISOString().split('T')[0],
          startHour: b.startHour || 10,
          endHour: b.endHour || 11,
          durationHours: b.durationHours || 1,
          totalAmount: b.totalAmount || 0,
          dpAmount: b.dpAmount || 0,
          remainingAmount: b.remainingAmount || 0,
          bookingStatus: (b.bookingStatus || 'CONFIRMED') as any,
          paymentStatus: (b.paymentStatus || 'SETTLEMENT') as any,
          paymentType: (b.paymentType || 'CASH_ON_SITE') as any,
          isManualBooking: b.isManualBooking || false
        }
      });
    } catch (e: any) {
      if (e.message && e.message.includes('Foreign key constraint')) {
        console.warn('Ignored booking upsert for non-existent tenant.');
        continue;
      }
      throw e;
    }
  }
}

export async function addBookingAction(booking: Booking): Promise<void> {
  try {
    await saveBookingsAction(booking.tenantId, [booking]);
  } catch (e: any) {
    if (e.message && e.message.includes('Foreign key constraint')) {
      console.warn('Ignored booking save for non-existent tenant (stale local storage account)');
      return;
    }
    throw e;
  }
}

export async function getGuestWebDataAction(slug: string): Promise<{ tenant: Tenant; courts: Court[]; bookings: Booking[] } | null> {
  const t = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      courts: true,
      bookings: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!t) return null;

  const tenant = {
    ...t,
    facilities: [], 
    subscription: {
      tier: t.subscriptionTier as SubscriptionTier,
      status: 'ACTIVE',
      isTrial: false,
      trialDaysLeft: 0,
      trialEndsAt: '',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      pricePerMonth: 0,
      courtLimit: 99,
    },
  } as unknown as Tenant;

  const courts = t.courts.map(c => ({
    ...c,
    features: []
  })) as unknown as Court[];

  const bookings = t.bookings.map((bk) => ({
    ...bk,
    courtName: courts.find(c => c.id === bk.courtId)?.name || 'Unknown',
    sportType: courts.find(c => c.id === bk.courtId)?.sportType || 'Unknown'
  })) as unknown as Booking[];

  return { tenant, courts, bookings };
}
