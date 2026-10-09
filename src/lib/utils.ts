import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTimeSlot(hour: number): string {
  const start = String(hour % 24).padStart(2, '0') + ':00';
  const end = String((hour + 1) % 24).padStart(2, '0') + ':00';
  return `${start} - ${end}`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  const start = String(startHour % 24).padStart(2, '0') + ':00';
  const end = String(endHour % 24).padStart(2, '0') + ':00';
  return `${start} - ${end} WIB`;
}

export function generateBookingCode(): string {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `JDW-${datePart}-${randomPart}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextDays(daysCount: number = 14): { date: string; label: string; isToday: boolean }[] {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    let label = '';
    if (i === 0) label = 'Hari Ini';
    else if (i === 1) label = 'Besok';
    else {
      label = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    }
    
    days.push({
      date: dateStr,
      label,
      isToday: i === 0,
    });
  }
  return days;
}

export function isBookingExpired(booking: { bookingStatus?: string; paymentStatus?: string; isManualBooking?: boolean; expiresAt?: string; createdAt?: string }): boolean {
  if (!booking) return false;
  if (booking.bookingStatus === 'PENDING_PAYMENT' && booking.paymentStatus !== 'SETTLEMENT') {
    const now = Date.now();
    if (booking.expiresAt) {
      return new Date(booking.expiresAt).getTime() < now;
    } else if (booking.createdAt) {
      return now - new Date(booking.createdAt).getTime() > 15 * 60 * 1000;
    }
  }
  return false;
}

export function isBookingActive(booking: { bookingStatus?: string; paymentStatus?: string; isManualBooking?: boolean; expiresAt?: string; createdAt?: string }): boolean {
  if (!booking) return false;
  if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'NO_SHOW') return false;
  if (isBookingExpired(booking)) return false;
  return true;
}
