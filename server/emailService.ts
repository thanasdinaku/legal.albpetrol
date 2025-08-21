import { MailService } from '@sendgrid/mail';
// Note: We'll reimplement formatDateTime here to avoid path issues
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

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService.send(emailData);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

interface CourtHearingNotification {
  plaintiff: string;
  defendant: string;
  hearingDateTime: string;
  hearingType: 'first_instance' | 'appeal';
  caseId: number;
}

export async function sendCourtHearingNotification(
  recipientEmail: string,
  fromEmail: string,
  notification: CourtHearingNotification
): Promise<boolean> {
  const hearingTypeText = notification.hearingType === 'first_instance' 
    ? 'Shkallë I' 
    : 'Apel';
  
  // Format the hearing date and time
  const formattedDateTime = formatDateTime(notification.hearingDateTime);
  
  const subject = `Tomorrow, a court hearing will take place for "${notification.plaintiff}" and "${notification.defendant}" at ${formattedDateTime}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Njoftim për Seancë Gjyqësore</h2>
        <p style="margin: 5px 0 0 0;">Court Hearing Notification</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">
            ⚠️ Përkujtues i Rëndësishëm / Important Reminder
          </p>
        </div>
        
        <h3 style="color: #1e40af; margin-bottom: 15px;">Detajet e Seancës / Hearing Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">Paditesi / Plaintiff:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.plaintiff}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">I Paditur / Defendant:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.defendant}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Data dhe Ora / Date & Time:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${formattedDateTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Lloji / Type:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${hearingTypeText}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Nr. Çështjës / Case ID:</td>
            <td style="padding: 8px 0;">#${notification.caseId}</td>
          </tr>
        </table>
        
        <div style="background-color: #dbeafe; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">📅 Nesër zhvillohet seanca gjyqësore</h4>
          <p style="margin: 0; color: #1e3a8a;">
            Tomorrow, a court hearing will take place for "<strong>${notification.plaintiff}</strong>" and 
            "<strong>${notification.defendant}</strong>" at <strong>${formattedDateTime}</strong>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Ky është një njoftim automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.<br>
          This is an automated notification from the Albpetrol SH.A. legal case management system.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Albpetrol SH.A. - Sistem Menaxhimi Çështjesh Ligjore
        </p>
      </div>
    </div>
  `;
  
  const textContent = `
NJOFTIM PËR SEANCË GJYQËSORE / COURT HEARING NOTIFICATION

Përkujtues i Rëndësishëm: Nesër zhvillohet seanca gjyqësore!

Detajet e Seancës:
- Paditesi / Plaintiff: ${notification.plaintiff}
- I Paditur / Defendant: ${notification.defendant}  
- Data dhe Ora / Date & Time: ${formattedDateTime}
- Lloji / Type: ${hearingTypeText}
- Nr. Çështjës / Case ID: #${notification.caseId}

Tomorrow, a court hearing will take place for "${notification.plaintiff}" and "${notification.defendant}" at ${formattedDateTime}

Ky është një njoftim automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
This is an automated notification from the Albpetrol SH.A. legal case management system.
  `;
  
  return await sendEmail({
    to: recipientEmail,
    from: fromEmail,
    subject: subject,
    html: htmlContent,
    text: textContent,
  });
}