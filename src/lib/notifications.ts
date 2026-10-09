import { InboxNotification, Booking } from './types';

const STORAGE_KEY_NOTIFICATIONS = 'jadwalin_inbox_notifications';
export const EVENT_NEW_BOOKING_NOTIFICATION = 'jadwalin_new_booking_event';

export function getInboxNotifications(): InboxNotification[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function saveInboxNotifications(notifications: InboxNotification[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }
}

export function createNotificationFromBooking(booking: Booking): InboxNotification {
  const notif: InboxNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    courtName: booking.courtName,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    date: booking.date,
    startHour: booking.startHour,
    endHour: booking.endHour,
    totalAmount: booking.totalAmount,
    dpAmount: booking.dpAmount,
    remainingAmount: booking.remainingAmount,
    paymentMethod: booking.paymentMethod,
    isManual: booking.isManualBooking,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const current = getInboxNotifications();
  // Check if notification for this booking already exists
  const existing = current.find(n => n.bookingCode === booking.bookingCode || n.bookingId === booking.id);
  if (!existing) {
    const updated = [notif, ...current].slice(0, 50); // Keep last 50
    saveInboxNotifications(updated);

    // Dispatch DOM event for same-tab & cross-tab listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NEW_BOOKING_NOTIFICATION, { detail: notif }));
    }
  }

  return notif;
}

export function markNotificationAsRead(id: string): InboxNotification[] {
  const current = getInboxNotifications();
  const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveInboxNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(): InboxNotification[] {
  const current = getInboxNotifications();
  const updated = current.map(n => ({ ...n, isRead: true }));
  saveInboxNotifications(updated);
  return updated;
}

export function deleteNotification(id: string): InboxNotification[] {
  const current = getInboxNotifications();
  const updated = current.filter(n => n.id !== id);
  saveInboxNotifications(updated);
  return updated;
}

export function clearAllNotifications(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
  }
}

// Gentle audio chime synthesizer using Web Audio API (no external asset required)
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play pleasant two-tone chime (E5 -> G#5)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.15); // G#5
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch {
    // Ignore audio autoplay restrictions
  }
}
