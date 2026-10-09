import { NextResponse } from 'next/server'; // force recompile
import { Booking } from '@/lib/types';
import { generateBookingCode } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { addBookingAction } from '@/app/actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const code = searchParams.get('code');
  const date = searchParams.get('date');
  const courtId = searchParams.get('courtId');
  const tenantId = searchParams.get('tenantId');

  try {
    if (id || code) {
      const found = await prisma.booking.findFirst({
        where: { OR: [{ id: id || undefined }, { bookingCode: code || undefined }] }
      });
      if (found) {
        return NextResponse.json({ success: true, data: found });
      }
      return NextResponse.json({ success: false, error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    if (tenantId) {
      const bookings = await prisma.booking.findMany({
        where: {
          tenantId,
          ...(date ? { date } : {}),
          ...(courtId ? { courtId } : {}),
        }
      });
      return NextResponse.json({ success: true, data: bookings });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantId,
      courtId,
      courtName,
      sportType,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      date,
      startHour,
      durationHours,
      totalAmount,
      dpAmount,
      remainingAmount,
      paymentType,
      isManualBooking,
      bookedByStaff,
      paymentMethod,
    } = body;

    const bookingCode = generateBookingCode();
    const endHour = startHour + durationHours;

    const expiresAt = isManualBooking
      ? undefined
      : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const newBooking: Booking = {
      id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingCode,
      tenantId: tenantId || 'tenant-gor-nusantara',
      courtId,
      courtName,
      sportType: sportType || 'Futsal',
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      notes: notes || '',
      date,
      startHour,
      endHour,
      durationHours,
      totalAmount,
      dpAmount,
      remainingAmount,
      paymentType: paymentType || 'DP_ONLY',
      bookingStatus: isManualBooking ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentStatus: isManualBooking ? 'SETTLEMENT' : 'PENDING',
      isManualBooking: Boolean(isManualBooking),
      bookedByStaff: bookedByStaff || (isManualBooking ? 'Admin Kasir' : undefined),
      paymentMethod: paymentMethod || (isManualBooking ? 'Tunai Kasir' : undefined),
      paidAt: isManualBooking ? new Date().toISOString() : undefined,
      waNotificationSent: false,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    if (tenantId === 'tenant-gor-nusantara') {
      // Demo mode: Return success but do not save to DB!
      return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
    }

    await addBookingAction(newBooking);

    return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Gagal membuat booking' },
      { status: 500 }
    );
  }
}
