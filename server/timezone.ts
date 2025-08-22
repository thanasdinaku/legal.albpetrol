// Timezone configuration for GMT+1 (Albania Time)
// This ensures all system operations use the correct local timezone

export const SYSTEM_TIMEZONE = 'Europe/Tirane'; // GMT+1 (Albania Time)

// Convert UTC date to GMT+1 (Albania Time)
export function toGMT1(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: SYSTEM_TIMEZONE }));
}

// Get current time in GMT+1 (Albania Time)
export function nowGMT1(): Date {
  return toGMT1(new Date());
}

// Format date for Albanian display in GMT+1
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

// Convert ISO string to GMT+1 Date (Albania Time)
export function parseISOToGMT1(isoString: string): Date {
  const date = new Date(isoString);
  return toGMT1(date);
}

// Get timezone offset for GMT+1
export function getGMT1Offset(): number {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const gmt1Time = new Date(utcTime + (1 * 3600000)); // +1 hour
  return 1; // GMT+1
}

// Check if date is within notification window (GMT+1 aware)
export function isWithinNotificationWindow(
  hearingDate: Date, 
  windowStartHours: number = 0, 
  windowEndHours: number = 26
): boolean {
  const now = nowGMT1();
  const windowStart = new Date(now.getTime() + (windowStartHours * 60 * 60 * 1000));
  const windowEnd = new Date(now.getTime() + (windowEndHours * 60 * 60 * 1000));
  
  const hearingGMT1 = toGMT1(hearingDate);
  
  console.log(`Timezone check (GMT+1): hearing=${formatAlbanianDateTime(hearingGMT1)}, now=${formatAlbanianDateTime(now)}`);
  
  return hearingGMT1 >= windowStart && hearingGMT1 <= windowEnd;
}

// Log system timezone info
export function logTimezoneInfo(): void {
  const now = new Date();
  const nowGMT1Local = nowGMT1();
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🕐 SYSTEM TIMEZONE CONFIGURATION - GMT+1 (ALBANIA TIME)');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`🌍 Configured Timezone: ${SYSTEM_TIMEZONE} (GMT+1 - Albania Time)`);
  console.log(`⏰ Current UTC Time: ${now.toISOString()}`);
  console.log(`🇦🇱 Current Albania Time (GMT+1): ${formatAlbanianDateTime(nowGMT1Local)}`);
  console.log(`📅 Albanian Date Format: ${formatAlbanianDate(nowGMT1Local)}`);
  console.log(`🕒 Albanian Time Format: ${formatAlbanianTime(nowGMT1Local)}`);
  console.log('══════════════════════════════════════════════════════════════\n');
}