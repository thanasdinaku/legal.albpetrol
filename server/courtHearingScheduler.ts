import { db } from './db';
import { dataEntries, systemSettings } from '@shared/schema';
import { sendCourtHearingNotification } from './simpleEmailService';
import { sql } from 'drizzle-orm';

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
    this.startScheduler();
  }
  
  public startScheduler() {
    if (this.isRunning) return;
    
    console.log('Starting court hearing notification scheduler...');
    this.isRunning = true;
    
    // Check every hour
    this.intervalId = setInterval(() => {
      this.checkUpcomingHearings();
    }, 60 * 60 * 1000); // 1 hour
    
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
  
  private async checkUpcomingHearings() {
    try {
      console.log('Checking for upcoming court hearings...');
      
      // Get email notification settings
      const emailSettings = await this.getEmailNotificationSettings();
      if (!emailSettings.enabled || !emailSettings.recipientEmail || !emailSettings.senderEmail) {
        console.log('Email notifications not configured, skipping checks');
        return;
      }
      
      // Get current time and 24-hour window
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      const twentyThreeHoursFromNow = new Date(now.getTime() + (23 * 60 * 60 * 1000));
      
      console.log(`Checking hearings between ${twentyThreeHoursFromNow.toISOString()} and ${twentyFourHoursFromNow.toISOString()}`);
      
      // Get all entries with hearings in the next 23-24 hours
      const entries = await db.select().from(dataEntries);
      
      const upcomingHearings: HearingCheck[] = [];
      
      for (const entry of entries) {
        // Check first instance hearing
        if (entry.zhvillimiSeancesShkalleI) {
          const hearingDate = this.parseHearingDateTime(entry.zhvillimiSeancesShkalleI);
          if (hearingDate && this.isWithinNotificationWindow(hearingDate, twentyThreeHoursFromNow, twentyFourHoursFromNow)) {
            upcomingHearings.push({
              id: entry.id,
              paditesi: entry.paditesi,
              iPaditur: entry.iPaditur,
              hearingDateTime: hearingDate.toISOString(),
              hearingType: 'first_instance'
            });
          }
        }
        
        // Check appeal hearing
        if (entry.zhvillimiSeancesApel) {
          const hearingDate = this.parseHearingDateTime(entry.zhvillimiSeancesApel);
          if (hearingDate && this.isWithinNotificationWindow(hearingDate, twentyThreeHoursFromNow, twentyFourHoursFromNow)) {
            upcomingHearings.push({
              id: entry.id,
              paditesi: entry.paditesi,
              iPaditur: entry.iPaditur,
              hearingDateTime: hearingDate.toISOString(),
              hearingType: 'appeal'
            });
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
      // Expected format: "2025-01-22T14:30" or "22-01-2025 14:30"
      
      let normalizedString = dateTimeString.trim();
      
      // Convert DD-MM-YYYY HH:MM to ISO format
      if (normalizedString.includes(' ') && !normalizedString.includes('T')) {
        const [datePart, timePart] = normalizedString.split(' ');
        if (datePart.includes('-') && datePart.split('-').length === 3) {
          const [day, month, year] = datePart.split('-');
          normalizedString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
        }
      }
      
      const date = new Date(normalizedString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error(`Error parsing date: ${dateTimeString}`, error);
      return null;
    }
  }
  
  private isWithinNotificationWindow(hearingDate: Date, windowStart: Date, windowEnd: Date): boolean {
    return hearingDate >= windowStart && hearingDate <= windowEnd;
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
        updatedById: 'system' as any // System user for automated notifications
      });
    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }
}

// Export singleton instance
export const courtHearingScheduler = new CourtHearingScheduler();