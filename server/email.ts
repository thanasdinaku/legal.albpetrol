import nodemailer from 'nodemailer';
import type { DataEntry, User } from '@shared/schema';

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailNotificationData {
  enabled: boolean;
  emailAddresses: string[];
  subject: string;
  includeDetails: boolean;
}

export async function sendNewEntryNotification(
  entry: DataEntry,
  creator: User,
  notificationSettings: EmailNotificationData
): Promise<void> {
  if (!notificationSettings.enabled || notificationSettings.emailAddresses.length === 0) {
    return;
  }

  const entryDetails = notificationSettings.includeDetails ? `
    
<strong>Detajet e çështjes:</strong>
<ul>
  <li><strong>Nr. Rendor:</strong> ${entry.id}</li>
  <li><strong>Paditesi:</strong> ${entry.paditesi}</li>
  <li><strong>I Paditur:</strong> ${entry.iPaditur}</li>
  <li><strong>Person i Tretë:</strong> ${entry.personITrete || 'N/A'}</li>
  <li><strong>Objekti i Padisë:</strong> ${entry.objektiIPadise || 'N/A'}</li>
  <li><strong>Gjykata e Shkallës së Parë:</strong> ${entry.gjykataShkalle || 'N/A'}</li>
  <li><strong>Faza në Gjykatën e Shkallës së Parë:</strong> ${entry.fazaGjykataShkalle || 'N/A'}</li>
  <li><strong>Gjykata e Apelit:</strong> ${entry.gjykataApelit || 'N/A'}</li>
  <li><strong>Faza në Gjykatën e Apelit:</strong> ${entry.fazaGjykataApelit || 'N/A'}</li>
  <li><strong>Faza Aktuale:</strong> ${entry.fazaAktuale || 'N/A'}</li>
  <li><strong>Përfaqësuesi i Albpetrol SH.A.:</strong> ${entry.perfaqesuesi || 'N/A'}</li>
  <li><strong>Dëmi i Pretenduar:</strong> ${entry.demiIPretenduar || 'N/A'}</li>
  <li><strong>Shuma e Caktuar nga Gjykata:</strong> ${entry.shumaGjykata || 'N/A'}</li>
  <li><strong>Vendim me Ekzekutim të Përkohshëm:</strong> ${entry.vendimEkzekutim || 'N/A'}</li>
  <li><strong>Faza e Ekzekutimit:</strong> ${entry.fazaEkzekutim || 'N/A'}</li>
  <li><strong>Gjykata e Lartë:</strong> ${entry.gjykataLarte || 'N/A'}</li>
  <li><strong>Krijuar nga:</strong> ${creator.firstName} ${creator.lastName} (${creator.email})</li>
  <li><strong>Data e Krijimit:</strong> ${entry.createdAt?.toLocaleString('sq-AL')}</li>
</ul>` : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Albpetrol SH.A.</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore</p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Njoftim për Hyrje të Re</h2>
          <p style="margin: 0; color: #374151;">Një çështje e re ligjore është shtuar në sistem.</p>
        </div>
        
        ${entryDetails}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
          </p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
            Ju lutemi mos u përgjigjeni në këtë adresë email.
          </p>
        </div>
      </div>
    </div>
  `;

  const plainTextContent = `
ALBPETROL SH.A. - Sistemi i Menaxhimit të Çështjeve Ligjore

Njoftim për Hyrje të Re
Një çështje e re ligjore është shtuar në sistem.

${notificationSettings.includeDetails ? `
Detajet e çështjes:
- Nr. Rendor: ${entry.id}
- Paditesi: ${entry.paditesi}
- I Paditur: ${entry.iPaditur}
- Person i Tretë: ${entry.personITrete || 'N/A'}
- Objekti i Padisë: ${entry.objektiIPadise || 'N/A'}
- Gjykata e Shkallës së Parë: ${entry.gjykataShkalle || 'N/A'}
- Faza në Gjykatën e Shkallës së Parë: ${entry.fazaGjykataShkalle || 'N/A'}
- Gjykata e Apelit: ${entry.gjykataApelit || 'N/A'}
- Faza në Gjykatën e Apelit: ${entry.fazaGjykataApelit || 'N/A'}
- Faza Aktuale: ${entry.fazaAktuale || 'N/A'}
- Përfaqësuesi i Albpetrol SH.A.: ${entry.perfaqesuesi || 'N/A'}
- Dëmi i Pretenduar: ${entry.demiIPretenduar || 'N/A'}
- Shuma e Caktuar nga Gjykata: ${entry.shumaGjykata || 'N/A'}
- Vendim me Ekzekutim të Përkohshëm: ${entry.vendimEkzekutim || 'N/A'}
- Faza e Ekzekutimit: ${entry.fazaEkzekutim || 'N/A'}
- Gjykata e Lartë: ${entry.gjykataLarte || 'N/A'}
- Krijuar nga: ${creator.firstName} ${creator.lastName} (${creator.email})
- Data e Krijimit: ${entry.createdAt?.toLocaleString('sq-AL')}
` : ''}

---
Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
Ju lutemi mos u përgjigjeni në këtë adresë email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: notificationSettings.emailAddresses.join(', '),
      subject: notificationSettings.subject,
      text: plainTextContent,
      html: htmlContent,
    });
    
    console.log(`Email notification sent to: ${notificationSettings.emailAddresses.join(', ')}`);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}