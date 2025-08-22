// Timezone configuration for GMT+2 (Central European Time)
// This ensures all system operations use the correct local timezone

export const SYSTEM_TIMEZONE = 'Europe/Berlin'; // GMT+2 (CET/CEST)

// Convert UTC date to GMT+2
export function toGMT2(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: SYSTEM_TIMEZONE }));
}

// Get current time in GMT+2
export function nowGMT2(): Date {
  return toGMT2(new Date());
}

// Format date for Albanian display in GMT+2
export function formatAlbanianDateTime(date: Date): string {
  return date.toLocaleString('sq-AL', {
    timeZone: SYSTEM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Format date for Albanian display with custom format
export function formatAlbanianDate(date: Date): string {
  return date.toLocaleDateString('sq-AL', {
    timeZone: SYSTEM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Format time for Albanian display
export function formatAlbanianTime(date: Date): string {
  return date.toLocaleTimeString('sq-AL', {
    timeZone: SYSTEM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Convert ISO string to GMT+2 Date
export function parseISOToGMT2(isoString: string): Date {
  const date = new Date(isoString);
  return toGMT2(date);
}

// Get timezone offset for GMT+2
export function getGMT2Offset(): number {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const gmt2Time = new Date(utcTime + (2 * 3600000)); // +2 hours
  return 2; // GMT+2
}

// Check if date is within notification window (GMT+2 aware)
export function isWithinNotificationWindow(
  hearingDate: Date, 
  windowStartHours: number = 0, 
  windowEndHours: number = 26
): boolean {
  const now = nowGMT2();
  const windowStart = new Date(now.getTime() + (windowStartHours * 60 * 60 * 1000));
  const windowEnd = new Date(now.getTime() + (windowEndHours * 60 * 60 * 1000));
  
  const hearingGMT2 = toGMT2(hearingDate);
  
  console.log(`Timezone check (GMT+2): hearing=${formatAlbanianDateTime(hearingGMT2)}, now=${formatAlbanianDateTime(now)}`);
  
  return hearingGMT2 >= windowStart && hearingGMT2 <= windowEnd;
}

// Log system timezone info
export function logTimezoneInfo(): void {
  const now = new Date();
  const nowGMT2Local = nowGMT2();
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🕐 SYSTEM TIMEZONE CONFIGURATION - GMT+2');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`🌍 Configured Timezone: ${SYSTEM_TIMEZONE} (GMT+2)`);
  console.log(`⏰ Current UTC Time: ${now.toISOString()}`);
  console.log(`🇦🇱 Current Local Time (GMT+2): ${formatAlbanianDateTime(nowGMT2Local)}`);
  console.log(`📅 Albanian Date Format: ${formatAlbanianDate(nowGMT2Local)}`);
  console.log(`🕒 Albanian Time Format: ${formatAlbanianTime(nowGMT2Local)}`);
  console.log('══════════════════════════════════════════════════════════════\n');
}