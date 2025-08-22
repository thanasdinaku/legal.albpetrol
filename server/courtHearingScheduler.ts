import { db } from './db';
import { dataEntries, systemSettings } from '@shared/schema';
import { sendCourtHearingNotification } from './email';
import { sql } from 'drizzle-orm';
import { nowGMT2, toGMT2, formatAlbanianDateTime, logTimezoneInfo } from './timezone';

interface HearingCheck {
  id: number;
  paditesi: string;
  iPaditur: string;
  hearingDateTime: string;
  hearingType: 'first_instance' | 'appeal';
}

export class CourtHearingScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    // Log timezone configuration on startup
    logTimezoneInfo();
    this.startScheduler();
  }
  
  public startScheduler() {
    if (this.isRunning) return;
    
    console.log('Starting court hearing notification scheduler...');
    this.isRunning = true;
    
    // Check every 10 minutes for more responsive testing
    this.intervalId = setInterval(() => {
      this.checkUpcomingHearings();
    }, 10 * 60 * 1000); // 10 minutes
    
    // Also check immediately on start
    setTimeout(() => {
      this.checkUpcomingHearings();
    }, 5000); // 5 seconds after start
  }
  
  public stopScheduler() {
    if (!this.isRunning) return;
    
    console.log('Stopping court hearing notification scheduler...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  public async checkUpcomingHearings() {
    try {
      console.log('Checking for upcoming court hearings...');
      
      // Get email notification settings
      const emailSettings = await this.getEmailNotificationSettings();
      if (!emailSettings.enabled || !emailSettings.recipientEmail || !emailSettings.senderEmail) {
        console.log('Email notifications not configured, skipping checks');
        return;
      }
      
      // Get current time and 26-hour window (to catch "tomorrow" hearings) in GMT+2
      const now = nowGMT2();
      const twentySixHoursFromNow = new Date(now.getTime() + (26 * 60 * 60 * 1000));
      
      console.log(`Checking hearings between NOW (${formatAlbanianDateTime(now)}) and 26 HOURS FROM NOW (${formatAlbanianDateTime(twentySixHoursFromNow)}) [GMT+2]`);
      
      // Get all entries with hearings in the next 23-24 hours
      const entries = await db.select().from(dataEntries);
      
      const upcomingHearings: HearingCheck[] = [];
      
      for (const entry of entries) {
        // Check first instance hearing
        if (entry.zhvillimiSeancesShkalleI) {
          console.log(`Checking entry ${entry.id} - hearing field: "${entry.zhvillimiSeancesShkalleI}"`);
          const hearingDate = this.parseHearingDateTime(entry.zhvillimiSeancesShkalleI);
          console.log(`Parsed hearing date:`, hearingDate);
          
          if (hearingDate) {
            const hearingGMT2 = toGMT2(hearingDate);
            const hoursFromNow = Math.round((hearingGMT2.getTime() - now.getTime()) / (60 * 60 * 1000));
            const isWithinWindow = this.isWithinNotificationWindow(hearingGMT2, now, twentySixHoursFromNow);
            console.log(`Is within notification window: ${isWithinWindow} (hearing at ${formatAlbanianDateTime(hearingGMT2)} is ${hoursFromNow} hours from now)`);
            
            if (isWithinWindow) {
              upcomingHearings.push({
                id: entry.id,
                paditesi: entry.paditesi,
                iPaditur: entry.iPaditur,
                hearingDateTime: hearingGMT2.toISOString(),
                hearingType: 'first_instance'
              });
              console.log(`Added hearing for case ${entry.id} to notification queue`);
            }
          }
        }
        
        // Check appeal hearing
        if (entry.zhvillimiSeancesApel) {
          console.log(`Checking entry ${entry.id} appeal - hearing field: "${entry.zhvillimiSeancesApel}"`);
          const hearingDate = this.parseHearingDateTime(entry.zhvillimiSeancesApel);
          console.log(`Parsed appeal hearing date:`, hearingDate);
          
          if (hearingDate) {
            const hearingGMT2 = toGMT2(hearingDate);
            const hoursFromNow = Math.round((hearingGMT2.getTime() - now.getTime()) / (60 * 60 * 1000));
            const isWithinWindow = this.isWithinNotificationWindow(hearingGMT2, now, twentySixHoursFromNow);
            console.log(`Appeal hearing is within notification window: ${isWithinWindow} (hearing at ${formatAlbanianDateTime(hearingGMT2)} is ${hoursFromNow} hours from now)`);
            
            if (isWithinWindow) {
              upcomingHearings.push({
                id: entry.id,
                paditesi: entry.paditesi,
                iPaditur: entry.iPaditur,
                hearingDateTime: hearingGMT2.toISOString(),
                hearingType: 'appeal'
              });
              console.log(`Added appeal hearing for case ${entry.id} to notification queue`);
            }
          }
        }
      }
      
      console.log(`Found ${upcomingHearings.length} upcoming hearings`);
      
      // Send notifications
      for (const hearing of upcomingHearings) {
        const notificationSent = await this.checkIfNotificationAlreadySent(hearing.id, hearing.hearingType, hearing.hearingDateTime);
        
        if (!notificationSent) {
          console.log(`Sending notification for case ${hearing.id} - ${hearing.hearingType}`);
          
          const success = await sendCourtHearingNotification(
            emailSettings.recipientEmail,
            emailSettings.senderEmail,
            {
              plaintiff: hearing.paditesi,
              defendant: hearing.iPaditur,
              hearingDateTime: hearing.hearingDateTime,
              hearingType: hearing.hearingType,
              caseId: hearing.id
            }
          );
          
          if (success) {
            await this.recordNotificationSent(hearing.id, hearing.hearingType, hearing.hearingDateTime);
            console.log(`Notification sent successfully for case ${hearing.id}`);
          } else {
            console.error(`Failed to send notification for case ${hearing.id}`);
          }
        } else {
          console.log(`Notification already sent for case ${hearing.id} - ${hearing.hearingType}`);
        }
      }
      
    } catch (error) {
      console.error('Error checking upcoming hearings:', error);
    }
  }
  
  private parseHearingDateTime(dateTimeString: string): Date | null {
    try {
      // Handle various date formats that might be in the database
      // Expected formats: "2025-01-22T14:30", "22-01-2025 14:30", "22/01/2025 14:30", ISO strings
      
      if (!dateTimeString || typeof dateTimeString !== 'string') {
        console.log('Invalid dateTimeString:', dateTimeString);
        return null;
      }
      
      let normalizedString = dateTimeString.trim();
      console.log('Parsing date string:', normalizedString);
      
      // Handle ISO format strings (from datetime-local inputs)
      if (normalizedString.includes('T') && normalizedString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
        const date = new Date(normalizedString);
        console.log('Parsed as ISO date:', date);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Convert DD-MM-YYYY HH:MM or DD/MM/YYYY HH:MM to ISO format
      if (normalizedString.includes(' ') && !normalizedString.includes('T')) {
        const [datePart, timePart] = normalizedString.split(' ');
        
        // Handle DD-MM-YYYY or DD/MM/YYYY format
        if ((datePart.includes('-') || datePart.includes('/')) && datePart.split(/[-\/]/).length === 3) {
          const separator = datePart.includes('-') ? '-' : '/';
          const [day, month, year] = datePart.split(separator);
          normalizedString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
          console.log('Converted to ISO format:', normalizedString);
        }
      }
      
      const date = new Date(normalizedString);
      console.log('Final parsed date:', date, 'isValid:', !isNaN(date.getTime()));
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error(`Error parsing date: ${dateTimeString}`, error);
      return null;
    }
  }
  
  private isWithinNotificationWindow(hearingDate: Date, windowStart: Date, windowEnd: Date): boolean {
    const isWithin = hearingDate >= windowStart && hearingDate <= windowEnd;
    console.log(`    Window check (GMT+2): hearing=${formatAlbanianDateTime(hearingDate)}, start=${formatAlbanianDateTime(windowStart)}, end=${formatAlbanianDateTime(windowEnd)}, result=${isWithin}`);
    return isWithin;
  }
  
  private async getEmailNotificationSettings() {
    try {
      const settings = await db
        .select()
        .from(systemSettings)
        .where(sql`setting_key = 'email_notifications'`);
      
      if (settings.length === 0) {
        return { enabled: false, recipientEmail: '', senderEmail: '' };
      }
      
      return settings[0].settingValue as {
        enabled: boolean;
        recipientEmail: string;
        senderEmail: string;
      };
    } catch (error) {
      console.error('Error getting email notification settings:', error);
      return { enabled: false, recipientEmail: '', senderEmail: '' };
    }
  }
  
  private async checkIfNotificationAlreadySent(
    caseId: number, 
    hearingType: string, 
    hearingDateTime: string
  ): Promise<boolean> {
    try {
      const notificationKey = `hearing_notification_${caseId}_${hearingType}_${hearingDateTime}`;
      
      const settings = await db
        .select()
        .from(systemSettings)
        .where(sql`setting_key = ${notificationKey}`);
      
      return settings.length > 0;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }
  
  private async recordNotificationSent(
    caseId: number, 
    hearingType: string, 
    hearingDateTime: string
  ): Promise<void> {
    try {
      const notificationKey = `hearing_notification_${caseId}_${hearingType}_${hearingDateTime}`;
      
      await db.insert(systemSettings).values({
        settingKey: notificationKey,
        settingValue: {
          sentAt: new Date().toISOString(),
          caseId: caseId,
          hearingType: hearingType,
          hearingDateTime: hearingDateTime
        },
        updatedById: 'a76a70a9-b09e-470c-bc77-14769a20acb6' // Use admin user ID for system notifications
      });
    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }
}

// Export singleton instance
export const courtHearingScheduler = new CourtHearingScheduler();