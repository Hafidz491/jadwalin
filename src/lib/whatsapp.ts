import { Booking, Tenant } from './types';
import { formatCurrency, formatDateIndo, formatHourRange } from './utils';

export function generateBookingSuccessMessage(booking: Booking, tenant: Tenant): string {
  const isLunas = booking.paymentType === 'FULL_PAYMENT' || booking.remainingAmount === 0;

  return `*KONFIRMASI BOOKING LAPANGAN - ${tenant.name.toUpperCase()}* 🏸⚽
-----------------------------------------
Halo kak *${booking.customerName}*, terima kasih telah melakukan reservasi melalui *Jadwalin*.

📋 *DETAIL BOOKING:*
• No. Tiket: *${booking.bookingCode}*
• Lapangan: *${booking.courtName}*
• Tanggal: *${formatDateIndo(booking.date)}*
• Jam Main: *${formatHourRange(booking.startHour, booking.endHour)}* (${booking.durationHours} Jam)

💰 *STATUS PEMBAYARAN:*
• Total Sewa: *${formatCurrency(booking.totalAmount)}*
• DP Dibayar: *${formatCurrency(booking.dpAmount)}* (${booking.paymentMethod || 'Midtrans Online'})
• *Sisa Bayar di Lokasi:* *${isLunas ? 'LUNAS (Rp 0)' : formatCurrency(booking.remainingAmount)}*

📍 *LOKASI LAPANGAN:*
${tenant.name}
${tenant.address}, ${tenant.city}
No. CS/Admin: ${tenant.phone}

🎟️ *LIHAT E-TIKET DIGITAL:*
${typeof window !== 'undefined' ? window.location.origin : 'https://jadwalin.id'}/booking/${booking.bookingCode}

*PERATURAN VENUE:*
1. Harap hadir 15 menit sebelum jadwal main.
2. Tunjukkan kode booking / E-Tiket ke kasir saat tiba.
3. Wajib menggunakan sepatu olahraga khusus lapangan.

Sampai jumpa di lapangan, selamat berolahraga! 🔥`;
}

export function generateAdminNotificationMessage(booking: Booking, tenant: Tenant): string {
  return `📢 *NOTIFIKASI BOOKING BARU MASUK!*
Venue: *${tenant.name}*
-----------------------------------------
• No. Booking: *${booking.bookingCode}*
• Pelanggan: *${booking.customerName}* (${booking.customerPhone})
• Lapangan: *${booking.courtName}*
• Jadwal: *${formatDateIndo(booking.date)}* | *${formatHourRange(booking.startHour, booking.endHour)}*
• Pembayaran: *DP ${formatCurrency(booking.dpAmount)}* (Metode: ${booking.paymentMethod || 'Online'})
• Sisa Tagihan di Kasir: *${formatCurrency(booking.remainingAmount)}*
• Tipe: ${booking.isManualBooking ? 'Pemesanan Manual/Kasir' : 'Pemesanan Web Publik'}

Slot jam ini telah otomatis *TERKUNCI* di sistem.`;
}

export async function sendWhatsAppMessageViaGateway(
  phone: string,
  message: string,
  token?: string,
  provider: 'FONNTE' | 'WABLAS' = 'FONNTE'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // If no token is configured, we return mock success for demo
  if (!token) {
    return {
      success: true,
      messageId: `MOCK_WA_${Date.now()}`,
    };
  }

  try {
    if (provider === 'FONNTE') {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: phone,
          message: message,
        }),
      });
      const data = await response.json();
      return { success: data.status === true, messageId: data.id };
    } else {
      // Wablas
      const response = await fetch('https://kudus.wablas.com/api/send-message', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
        }),
      });
      const data = await response.json();
      return { success: data.status === 'success', messageId: data.data?.id };
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
