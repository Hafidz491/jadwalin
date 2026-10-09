import { NextResponse } from 'next/server';
import { createSnapToken } from '@/lib/midtrans';
import { getTenantData, updateBooking } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, bookingCode, customerName, customerPhone, customerEmail, amount, courtName } = body;

    const tenant = await getTenantData();

    const snapResult = await createSnapToken(
      {
        orderId: bookingCode,
        grossAmount: amount,
        customerDetails: {
          firstName: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        itemDetails: [
          {
            id: bookingCode,
            name: `Sewa ${courtName}`,
            price: amount,
            quantity: 1,
          },
        ],
      },
      tenant.midtransServerKey,
      tenant.midtransIsProd
    );

    // Save snap token to booking
    await updateBooking(bookingId, {
      snapToken: snapResult.token,
      midtransOrderId: bookingCode,
    });

    return NextResponse.json({
      success: true,
      token: snapResult.token,
      redirectUrl: snapResult.redirectUrl,
      isSimulated: snapResult.isSimulated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Gagal membuat snap token' },
      { status: 500 }
    );
  }
}
