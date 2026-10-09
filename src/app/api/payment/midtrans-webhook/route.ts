import { NextResponse } from 'next/server';
import { updateBooking, getBookingsData, getTenantData } from '@/lib/data';
import { createMidtransSignature } from '@/lib/midtrans';
import { sendWhatsAppMessageViaGateway, generateBookingSuccessMessage } from '@/lib/whatsapp';
import { PaymentStatus, BookingStatus } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const notification = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
    } = notification;

    const tenant = await getTenantData();

    // Verify signature if server key is configured
    if (tenant.midtransServerKey && signature_key) {
      const expectedSignature = createMidtransSignature(
        order_id,
        status_code,
        gross_amount,
        tenant.midtransServerKey
      );
      if (expectedSignature !== signature_key) {
        return NextResponse.json({ success: false, error: 'Invalid signature key' }, { status: 403 });
      }
    }

    let paymentStatus: PaymentStatus = 'PENDING';
    let bookingStatus: BookingStatus = 'PENDING_PAYMENT';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'SETTLEMENT';
      bookingStatus = 'CONFIRMED';
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = transaction_status === 'expire' ? 'EXPIRE' : 'CANCEL';
      bookingStatus = 'CANCELLED';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING';
      bookingStatus = 'PENDING_PAYMENT';
    }

    const updatedBooking = await updateBooking(order_id, {
      paymentStatus,
      bookingStatus,
      paymentMethod: payment_type ? payment_type.toUpperCase() : 'Midtrans',
      paidAt: paymentStatus === 'SETTLEMENT' ? new Date().toISOString() : undefined,
    });

    // If settlement, trigger automated WhatsApp notification
    if (updatedBooking && paymentStatus === 'SETTLEMENT' && !updatedBooking.waNotificationSent) {
      const waMsg = generateBookingSuccessMessage(updatedBooking, tenant);
      await sendWhatsAppMessageViaGateway(
        updatedBooking.customerPhone,
        waMsg,
        tenant.waGatewayToken,
        tenant.waGatewayProvider
      );
      updateBooking(order_id, { waNotificationSent: true });
    }

    return NextResponse.json({ success: true, message: 'Midtrans notification processed' });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}
