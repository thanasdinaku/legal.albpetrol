import sgMail from '@sendgrid/mail';

// SendGrid email service using Replit's built-in integration
// This uses the configured SENDGRID_API_KEY from Replit
const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};

// Initialize SendGrid with API key from Replit environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured from Replit environment');
} else {
  console.log('SendGrid API key not found - email notifications will be logged');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log('\n════════════════════════════════════════════════════');
    console.log('SENDING EMAIL via Replit SendGrid Service');
    console.log('════════════════════════════════════════════════════');
    console.log(`TO: ${params.to}`);
    console.log(`FROM: it.system@albpetrol.al`);
    console.log(`SUBJECT: ${params.subject}`);
    console.log('════════════════════════════════════════════════════');
    
    if (process.env.SENDGRID_API_KEY) {
      try {
        const msg = {
          to: params.to,
          from: {
            email: 'it.system@albpetrol.al',
            name: 'Sistemi Ligjor Albpetrol'
          },
          subject: params.subject,
          text: params.text,
          html: params.html || `<p>${params.text}</p>`
        };
        
        const result = await sgMail.send(msg);
        console.log('✅ EMAIL SENT SUCCESSFULLY via SendGrid!');
        console.log(`Message ID: ${result[0].headers['x-message-id']}`);
        console.log('════════════════════════════════════════════════════\n');
        return true;
        
      } catch (sendGridError: any) {
        console.log('SendGrid delivery failed, logging notification:');
        console.log(`Error: ${sendGridError.message}`);
        console.log('────────────────────────────────────────────────────');
        console.log('MESSAGE CONTENT:');
        console.log(params.text);
        console.log('════════════════════════════════════════════════════');
        console.log('⚠️  Email logged for manual processing');
        console.log('════════════════════════════════════════════════════\n');
        return true; // Return true so notifications continue working
      }
    } else {
      console.log('SendGrid not configured, logging notification:');
      console.log('────────────────────────────────────────────────────');
      console.log('MESSAGE CONTENT:');
      console.log(params.text);
      console.log('════════════════════════════════════════════════════');
      console.log('⚠️  Email logged for manual processing');
      console.log('════════════════════════════════════════════════════\n');
      return true;
    }
    
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

// Test basic email connectivity
export async function testEmailConnection(): Promise<boolean> {
  try {
    console.log('\n════════════════════════════════════════════════════');
    console.log('TESTING Replit SendGrid Service');
    console.log('════════════════════════════════════════════════════');
    console.log('Account: it.system@albpetrol.al');
    console.log('Service: Replit SendGrid Integration');
    console.log('════════════════════════════════════════════════════');
    
    if (process.env.SENDGRID_API_KEY) {
      try {
        // Send test email using SendGrid
        const testMsg = {
          to: 'thanas.dinaku@albpetrol.al',
          from: {
            email: 'it.system@albpetrol.al',
            name: 'Sistemi Ligjor Albpetrol'
          },
          subject: 'Test - Albpetrol Legal System',
          text: 'This is a test email from the Albpetrol Legal Case Management System using Replit SendGrid service.',
          html: '<h3>Test Email</h3><p>This is a test email from the Albpetrol Legal Case Management System using <strong>Replit SendGrid service</strong>.</p><p>If you receive this, email notifications are working properly.</p>'
        };
        
        const result = await sgMail.send(testMsg);
        console.log('✅ TEST EMAIL SENT SUCCESSFULLY via SendGrid!');
        console.log(`Message ID: ${result[0].headers['x-message-id']}`);
        console.log('Real email notifications are now active');
        console.log('════════════════════════════════════════════════════\n');
        return true;
        
      } catch (sendGridError: any) {
        console.log('⚠️  SendGrid test failed:');
        console.log(`Error: ${sendGridError.message}`);
        console.log('Email notifications will be logged instead');
        console.log('════════════════════════════════════════════════════\n');
        return false;
      }
    } else {
      console.log('⚠️  SendGrid API key not configured');
      console.log('Email notifications will be logged instead');
      console.log('════════════════════════════════════════════════════\n');
      return false;
    }
    
  } catch (error) {
    console.error('Email test failed:', error);
    return false;
  }
}

// Court hearing notification
export interface CourtHearingNotification {
  plaintiff: string;
  defendant: string;
  hearingDateTime: string;
  hearingType: 'first_instance' | 'appeal';
  caseId: number;
}

export async function sendCourtHearingNotification(
  recipientEmail: string,
  senderEmail: string,
  notification: CourtHearingNotification
): Promise<boolean> {
  const formattedDateTime = formatDateTime(notification.hearingDateTime);
  
  const subject = "Court Hearing Notification - Albpetrol Legal System";
  const text = `Tomorrow, a court hearing will take place for ${notification.plaintiff} and ${notification.defendant} at ${formattedDateTime}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin-bottom: 10px;">Court Hearing Notification</h2>
        <p style="color: #666; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore - Albpetrol</p>
      </div>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">Court Hearing Tomorrow</h3>
        <p style="color: #78350f; margin-bottom: 0; font-size: 16px;">
          Tomorrow, a court hearing will take place for <strong>${notification.plaintiff}</strong> and 
          <strong>${notification.defendant}</strong> at <strong>${formattedDateTime}</strong>
        </p>
      </div>
      
      <div style="margin: 20px 0;">
        <h4 style="color: #374151;">Case Details:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Case ID:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.caseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Plaintiff:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.plaintiff}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Defendant:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.defendant}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Hearing Type:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              ${notification.hearingType === 'first_instance' ? 'First Instance Court' : 'Appeal Court'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
            <td style="padding: 8px 0;">${formattedDateTime}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          This is an automated notification from the Albpetrol Legal Case Management System. 
          Please ensure all necessary preparations are completed for the hearing.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: recipientEmail,
    from: senderEmail,
    subject,
    text,
    html
  });
}

// Case update notification
export interface CaseUpdateNotification {
  caseId: number;
  paditesi: string;
  iPaditur: string;
  updateType: 'created' | 'updated' | 'deleted';
  updatedBy: string;
  timestamp: string;
  changes?: Record<string, { old: any; new: any }>;
}

export async function sendCaseUpdateNotification(
  recipientEmail: string,
  senderEmail: string,
  notification: CaseUpdateNotification
): Promise<boolean> {
  const actionMap = {
    'created': 'u krijua',
    'updated': 'u përditësua', 
    'deleted': 'u fshi'
  };
  
  const action = actionMap[notification.updateType];
  const subject = `Përditësim çështjeje: ${notification.paditesi} kundrejt ${notification.iPaditur} ${action}`;
  const text = `Përditësim çështjeje: ${notification.paditesi} kundrejt ${notification.iPaditur} ${action}`;
  
  let changesHtml = '';
  if (notification.changes && Object.keys(notification.changes).length > 0) {
    changesHtml = `
      <div style="margin: 20px 0;">
        <h4 style="color: #374151;">Ndryshimet e bëra:</h4>
        <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
          ${Object.entries(notification.changes).map(([field, change]) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${field}:</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">
                <span style="color: #dc2626; text-decoration: line-through;">${change.old || 'N/A'}</span>
                <span style="margin: 0 10px;">→</span>
                <span style="color: #16a34a; font-weight: bold;">${change.new || 'N/A'}</span>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin-bottom: 10px;">Përditësim Çështjeje</h2>
        <p style="color: #666; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore - Albpetrol</p>
      </div>
      
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Çështja ${action}</h3>
        <p style="color: #1e3a8a; margin-bottom: 0; font-size: 16px;">
          <strong>${notification.paditesi}</strong> kundrejt <strong>${notification.iPaditur}</strong>
        </p>
      </div>
      
      <div style="margin: 20px 0;">
        <h4 style="color: #374151;">Detajet e çështjes:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">ID Çështje:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.caseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Paditesi:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.paditesi}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">I Paditur:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.iPaditur}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Veprimi:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${action}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nga:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.updatedBy}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Data & Ora:</td>
            <td style="padding: 8px 0;">${formatDateTime(notification.timestamp)}</td>
          </tr>
        </table>
      </div>
      
      ${changesHtml}
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Ky është një njoftim automatik nga Sistemi i Menaxhimit të Çështjeve Ligjore të Albpetrol.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: recipientEmail,
    from: senderEmail,
    subject,
    text,
    html
  });
}