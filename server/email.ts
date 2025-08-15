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

export async function sendTwoFactorCode(
  user: User,
  code: string
): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Albpetrol SH.A.</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore</p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Kodi i Verifikimit</h2>
          <p style="margin: 0; color: #374151;">Kodi juaj i verifikimit për hyrjen në sistem:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #f3f4f6; border: 2px solid #e5e7eb; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Vëmendje:</strong> Ky kod skadon për 3 minuta. Nëse nuk e përdorni brenda kësaj kohe, do t'ju duhet të hyni përsëri.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            Nëse nuk keni kërkuar të hyni në sistem, ju lutemi injoroni këtë email.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@albpetrol.al',
    to: user.email,
    subject: 'Kodi i Verifikimit - Albpetrol SH.A.',
    html: htmlContent,
  };

  try {
    console.log(`Attempting to send 2FA code to: ${user.email}`);
    console.log(`SMTP Config: Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, User: ${process.env.SMTP_USER ? 'configured' : 'missing'}`);
    console.log(`From address: ${mailOptions.from}`);
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Two-factor code successfully sent to: ${user.email}`);
  } catch (error: any) {
    console.error('❌ Failed to send two-factor code email:', error);
    console.error('SMTP Error Details:', {
      message: error?.message,
      code: error?.code,
      response: error?.response
    });
    throw new Error(`Email delivery failed: ${error?.message || 'Unknown error'}`);
  }
}

export async function sendNewEntryNotification(
  entry: DataEntry,
  creator: User,
  notificationSettings: EmailNotificationData,
  nrRendor?: number
): Promise<void> {
  if (!notificationSettings.enabled || notificationSettings.emailAddresses.length === 0) {
    return;
  }

  const entryDetails = notificationSettings.includeDetails ? `
    
<strong>Detajet e çështjes:</strong>
<ul>
  <li><strong>Nr. Rendor:</strong> ${nrRendor || entry.id}</li>
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
- Nr. Rendor: ${nrRendor || entry.id}
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
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@albpetrol.al',
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

export async function sendEditEntryNotification(
  originalEntry: DataEntry,
  updatedEntry: DataEntry,
  editor: User,
  notificationSettings: EmailNotificationData,
  nrRendor?: number
): Promise<void> {
  if (!notificationSettings.enabled || notificationSettings.emailAddresses.length === 0) {
    return;
  }

  // Compare fields to show what changed
  const changes: Array<{ field: string; from: string; to: string }> = [];
  const fields = [
    { key: 'paditesi', label: 'Paditesi' },
    { key: 'iPaditur', label: 'I Paditur' },
    { key: 'personITrete', label: 'Person i Tretë' },
    { key: 'objektiIPadise', label: 'Objekti i Padisë' },
    { key: 'gjykataShkalle', label: 'Gjykata e Shkallës së Parë' },
    { key: 'fazaGjykataShkalle', label: 'Faza në Gjykatën e Shkallës së Parë' },
    { key: 'gjykataApelit', label: 'Gjykata e Apelit' },
    { key: 'fazaGjykataApelit', label: 'Faza në Gjykatën e Apelit' },
    { key: 'fazaAktuale', label: 'Faza Aktuale' },
    { key: 'perfaqesuesi', label: 'Përfaqësuesi i Albpetrol SH.A.' },
    { key: 'demiIPretenduar', label: 'Dëmi i Pretenduar' },
    { key: 'shumaGjykata', label: 'Shuma e Caktuar nga Gjykata' },
    { key: 'vendimEkzekutim', label: 'Vendim me Ekzekutim të Përkohshëm' },
    { key: 'fazaEkzekutim', label: 'Faza e Ekzekutimit' },
    { key: 'gjykataLarte', label: 'Gjykata e Lartë' }
  ];

  fields.forEach(field => {
    const originalValue = String(originalEntry[field.key as keyof DataEntry] || 'N/A');
    const updatedValue = String(updatedEntry[field.key as keyof DataEntry] || 'N/A');
    if (originalValue !== updatedValue) {
      changes.push({
        field: field.label,
        from: originalValue,
        to: updatedValue
      });
    }
  });

  // Helper function to check if a field was changed and apply highlighting
  const getFieldValue = (entry: DataEntry, fieldKey: string, isUpdated: boolean) => {
    const value = String(entry[fieldKey as keyof DataEntry] || 'N/A');
    const originalValue = String(originalEntry[fieldKey as keyof DataEntry] || 'N/A');
    const updatedValue = String(updatedEntry[fieldKey as keyof DataEntry] || 'N/A');
    
    if (isUpdated && originalValue !== updatedValue) {
      return `<span style="background-color: #dcfce7; color: #166534; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${value}</span>`;
    }
    return value;
  };

  const changesDetails = notificationSettings.includeDetails ? `
<div style="margin-bottom: 30px;">
  <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">Ishte:</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
    <li><strong>Nr. Rendor:</strong> ${nrRendor || originalEntry.id}</li>
    <li><strong>Paditesi:</strong> ${getFieldValue(originalEntry, 'paditesi', false)}</li>
    <li><strong>I Paditur:</strong> ${getFieldValue(originalEntry, 'iPaditur', false)}</li>
    <li><strong>Person i Tretë:</strong> ${getFieldValue(originalEntry, 'personITrete', false)}</li>
    <li><strong>Objekti i Padisë:</strong> ${getFieldValue(originalEntry, 'objektiIPadise', false)}</li>
    <li><strong>Gjykata e Shkallës së Parë:</strong> ${getFieldValue(originalEntry, 'gjykataShkalle', false)}</li>
    <li><strong>Faza në Gjykatën e Shkallës së Parë:</strong> ${getFieldValue(originalEntry, 'fazaGjykataShkalle', false)}</li>
    <li><strong>Gjykata e Apelit:</strong> ${getFieldValue(originalEntry, 'gjykataApelit', false)}</li>
    <li><strong>Faza në Gjykatën e Apelit:</strong> ${getFieldValue(originalEntry, 'fazaGjykataApelit', false)}</li>
    <li><strong>Faza Aktuale:</strong> ${getFieldValue(originalEntry, 'fazaAktuale', false)}</li>
    <li><strong>Përfaqësuesi i Albpetrol SH.A.:</strong> ${getFieldValue(originalEntry, 'perfaqesuesi', false)}</li>
    <li><strong>Dëmi i Pretenduar:</strong> ${getFieldValue(originalEntry, 'demiIPretenduar', false)}</li>
    <li><strong>Shuma e Caktuar nga Gjykata:</strong> ${getFieldValue(originalEntry, 'shumaGjykata', false)}</li>
    <li><strong>Vendim me Ekzekutim të Përkohshëm:</strong> ${getFieldValue(originalEntry, 'vendimEkzekutim', false)}</li>
    <li><strong>Faza e Ekzekutimit:</strong> ${getFieldValue(originalEntry, 'fazaEkzekutim', false)}</li>
    <li><strong>Gjykata e Lartë:</strong> ${getFieldValue(originalEntry, 'gjykataLarte', false)}</li>
  </ul>
</div>

<div style="margin-bottom: 20px;">
  <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #059669; padding-bottom: 5px;">U bë:</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
    <li><strong>Nr. Rendor:</strong> ${nrRendor || updatedEntry.id}</li>
    <li><strong>Paditesi:</strong> ${getFieldValue(updatedEntry, 'paditesi', true)}</li>
    <li><strong>I Paditur:</strong> ${getFieldValue(updatedEntry, 'iPaditur', true)}</li>
    <li><strong>Person i Tretë:</strong> ${getFieldValue(updatedEntry, 'personITrete', true)}</li>
    <li><strong>Objekti i Padisë:</strong> ${getFieldValue(updatedEntry, 'objektiIPadise', true)}</li>
    <li><strong>Gjykata e Shkallës së Parë:</strong> ${getFieldValue(updatedEntry, 'gjykataShkalle', true)}</li>
    <li><strong>Faza në Gjykatën e Shkallës së Parë:</strong> ${getFieldValue(updatedEntry, 'fazaGjykataShkalle', true)}</li>
    <li><strong>Gjykata e Apelit:</strong> ${getFieldValue(updatedEntry, 'gjykataApelit', true)}</li>
    <li><strong>Faza në Gjykatën e Apelit:</strong> ${getFieldValue(updatedEntry, 'fazaGjykataApelit', true)}</li>
    <li><strong>Faza Aktuale:</strong> ${getFieldValue(updatedEntry, 'fazaAktuale', true)}</li>
    <li><strong>Përfaqësuesi i Albpetrol SH.A.:</strong> ${getFieldValue(updatedEntry, 'perfaqesuesi', true)}</li>
    <li><strong>Dëmi i Pretenduar:</strong> ${getFieldValue(updatedEntry, 'demiIPretenduar', true)}</li>
    <li><strong>Shuma e Caktuar nga Gjykata:</strong> ${getFieldValue(updatedEntry, 'shumaGjykata', true)}</li>
    <li><strong>Vendim me Ekzekutim të Përkohshëm:</strong> ${getFieldValue(updatedEntry, 'vendimEkzekutim', true)}</li>
    <li><strong>Faza e Ekzekutimit:</strong> ${getFieldValue(updatedEntry, 'fazaEkzekutim', true)}</li>
    <li><strong>Gjykata e Lartë:</strong> ${getFieldValue(updatedEntry, 'gjykataLarte', true)}</li>
  </ul>
</div>

<div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #6b7280;">
  <p style="margin: 0; color: #374151; font-size: 14px;">
    <strong>Ndryshuar nga:</strong> ${editor.firstName} ${editor.lastName} (${editor.email})<br>
    <strong>Data e Ndryshimit:</strong> ${updatedEntry.updatedAt?.toLocaleString('sq-AL')}
  </p>
</div>` : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Albpetrol SH.A.</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">Njoftim për Ndryshim</h2>
          <p style="margin: 0; color: #374151;">Një çështje ligjore është përditësuar në sistem.</p>
        </div>
        
        ${changesDetails}
        
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

Njoftim për Ndryshim
Një çështje ligjore është përditësuar në sistem.

${notificationSettings.includeDetails ? `
ISHTE:
- Nr. Rendor: ${nrRendor || originalEntry.id}
- Paditesi: ${originalEntry.paditesi}
- I Paditur: ${originalEntry.iPaditur}
- Person i Tretë: ${originalEntry.personITrete || 'N/A'}
- Objekti i Padisë: ${originalEntry.objektiIPadise || 'N/A'}
- Gjykata e Shkallës së Parë: ${originalEntry.gjykataShkalle || 'N/A'}
- Faza në Gjykatën e Shkallës së Parë: ${originalEntry.fazaGjykataShkalle || 'N/A'}
- Gjykata e Apelit: ${originalEntry.gjykataApelit || 'N/A'}
- Faza në Gjykatën e Apelit: ${originalEntry.fazaGjykataApelit || 'N/A'}
- Faza Aktuale: ${originalEntry.fazaAktuale || 'N/A'}
- Përfaqësuesi i Albpetrol SH.A.: ${originalEntry.perfaqesuesi || 'N/A'}
- Dëmi i Pretenduar: ${originalEntry.demiIPretenduar || 'N/A'}
- Shuma e Caktuar nga Gjykata: ${originalEntry.shumaGjykata || 'N/A'}
- Vendim me Ekzekutim të Përkohshëm: ${originalEntry.vendimEkzekutim || 'N/A'}
- Faza e Ekzekutimit: ${originalEntry.fazaEkzekutim || 'N/A'}
- Gjykata e Lartë: ${originalEntry.gjykataLarte || 'N/A'}

U BË:
- Nr. Rendor: ${nrRendor || updatedEntry.id}
- Paditesi: ${updatedEntry.paditesi}
- I Paditur: ${updatedEntry.iPaditur}
- Person i Tretë: ${updatedEntry.personITrete || 'N/A'}
- Objekti i Padisë: ${updatedEntry.objektiIPadise || 'N/A'}
- Gjykata e Shkallës së Parë: ${updatedEntry.gjykataShkalle || 'N/A'}
- Faza në Gjykatën e Shkallës së Parë: ${updatedEntry.fazaGjykataShkalle || 'N/A'}
- Gjykata e Apelit: ${updatedEntry.gjykataApelit || 'N/A'}
- Faza në Gjykatën e Apelit: ${updatedEntry.fazaGjykataApelit || 'N/A'}
- Faza Aktuale: ${updatedEntry.fazaAktuale || 'N/A'}
- Përfaqësuesi i Albpetrol SH.A.: ${updatedEntry.perfaqesuesi || 'N/A'}
- Dëmi i Pretenduar: ${updatedEntry.demiIPretenduar || 'N/A'}
- Shuma e Caktuar nga Gjykata: ${updatedEntry.shumaGjykata || 'N/A'}
- Vendim me Ekzekutim të Përkohshëm: ${updatedEntry.vendimEkzekutim || 'N/A'}
- Faza e Ekzekutimit: ${updatedEntry.fazaEkzekutim || 'N/A'}
- Gjykata e Lartë: ${updatedEntry.gjykataLarte || 'N/A'}

Ndryshuar nga: ${editor.firstName} ${editor.lastName} (${editor.email})
Data e Ndryshimit: ${updatedEntry.updatedAt?.toLocaleString('sq-AL')}
` : ''}

---
Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
Ju lutemi mos u përgjigjeni në këtë adresë email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@albpetrol.al',
      to: notificationSettings.emailAddresses.join(', '),
      subject: `Ndryshim në çështjen: ${updatedEntry.paditesi}`,
      text: plainTextContent,
      html: htmlContent,
    });
    
    console.log(`Edit notification email sent to: ${notificationSettings.emailAddresses.join(', ')}`);
  } catch (error) {
    console.error('Failed to send edit notification email:', error);
    throw error;
  }
}

export async function sendDeleteEntryNotification(
  deletedEntry: DataEntry,
  deleter: User,
  notificationSettings: EmailNotificationData,
  nrRendor?: number
): Promise<void> {
  if (!notificationSettings.enabled || notificationSettings.emailAddresses.length === 0) {
    return;
  }

  const entryDetails = notificationSettings.includeDetails ? `
    
<strong>Detajet e çështjes së fshirë:</strong>
<ul>
  <li><strong>Nr. Rendor:</strong> ${nrRendor || deletedEntry.id}</li>
  <li><strong>Paditesi:</strong> ${deletedEntry.paditesi}</li>
  <li><strong>I Paditur:</strong> ${deletedEntry.iPaditur}</li>
  <li><strong>Person i Tretë:</strong> ${deletedEntry.personITrete || 'N/A'}</li>
  <li><strong>Objekti i Padisë:</strong> ${deletedEntry.objektiIPadise || 'N/A'}</li>
  <li><strong>Gjykata e Shkallës së Parë:</strong> ${deletedEntry.gjykataShkalle || 'N/A'}</li>
  <li><strong>Faza në Gjykatën e Shkallës së Parë:</strong> ${deletedEntry.fazaGjykataShkalle || 'N/A'}</li>
  <li><strong>Gjykata e Apelit:</strong> ${deletedEntry.gjykataApelit || 'N/A'}</li>
  <li><strong>Faza në Gjykatën e Apelit:</strong> ${deletedEntry.fazaGjykataApelit || 'N/A'}</li>
  <li><strong>Faza Aktuale:</strong> ${deletedEntry.fazaAktuale || 'N/A'}</li>
  <li><strong>Përfaqësuesi i Albpetrol SH.A.:</strong> ${deletedEntry.perfaqesuesi || 'N/A'}</li>
  <li><strong>Dëmi i Pretenduar:</strong> ${deletedEntry.demiIPretenduar || 'N/A'}</li>
  <li><strong>Shuma e Caktuar nga Gjykata:</strong> ${deletedEntry.shumaGjykata || 'N/A'}</li>
  <li><strong>Vendim me Ekzekutim të Përkohshëm:</strong> ${deletedEntry.vendimEkzekutim || 'N/A'}</li>
  <li><strong>Faza e Ekzekutimit:</strong> ${deletedEntry.fazaEkzekutim || 'N/A'}</li>
  <li><strong>Gjykata e Lartë:</strong> ${deletedEntry.gjykataLarte || 'N/A'}</li>
  <li><strong>Fshirë nga:</strong> ${deleter.firstName} ${deleter.lastName} (${deleter.email})</li>
  <li><strong>Data e Fshirjes:</strong> ${new Date().toLocaleString('sq-AL')}</li>
</ul>` : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Albpetrol SH.A.</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore</p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0 0 10px 0; font-size: 18px;">Njoftim për Fshirje</h2>
          <p style="margin: 0; color: #374151;">Një çështje ligjore është fshirë nga sistemi.</p>
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

Njoftim për Fshirje
Një çështje ligjore është fshirë nga sistemi.

${notificationSettings.includeDetails ? `
Detajet e çështjes së fshirë:
- Nr. Rendor: ${nrRendor || deletedEntry.id}
- Paditesi: ${deletedEntry.paditesi}
- I Paditur: ${deletedEntry.iPaditur}
- Person i Tretë: ${deletedEntry.personITrete || 'N/A'}
- Objekti i Padisë: ${deletedEntry.objektiIPadise || 'N/A'}
- Gjykata e Shkallës së Parë: ${deletedEntry.gjykataShkalle || 'N/A'}
- Faza në Gjykatën e Shkallës së Parë: ${deletedEntry.fazaGjykataShkalle || 'N/A'}
- Gjykata e Apelit: ${deletedEntry.gjykataApelit || 'N/A'}
- Faza në Gjykatën e Apelit: ${deletedEntry.fazaGjykataApelit || 'N/A'}
- Faza Aktuale: ${deletedEntry.fazaAktuale || 'N/A'}
- Përfaqësuesi i Albpetrol SH.A.: ${deletedEntry.perfaqesuesi || 'N/A'}
- Dëmi i Pretenduar: ${deletedEntry.demiIPretenduar || 'N/A'}
- Shuma e Caktuar nga Gjykata: ${deletedEntry.shumaGjykata || 'N/A'}
- Vendim me Ekzekutim të Përkohshëm: ${deletedEntry.vendimEkzekutim || 'N/A'}
- Faza e Ekzekutimit: ${deletedEntry.fazaEkzekutim || 'N/A'}
- Gjykata e Lartë: ${deletedEntry.gjykataLarte || 'N/A'}
- Fshirë nga: ${deleter.firstName} ${deleter.lastName} (${deleter.email})
- Data e Fshirjes: ${new Date().toLocaleString('sq-AL')}
` : ''}

---
Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
Ju lutemi mos u përgjigjeni në këtë adresë email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@albpetrol.al',
      to: notificationSettings.emailAddresses.join(', '),
      subject: `Fshirje e çështjes: ${deletedEntry.paditesi}`,
      text: plainTextContent,
      html: htmlContent,
    });
    
    console.log(`Delete notification email sent to: ${notificationSettings.emailAddresses.join(', ')}`);
  } catch (error) {
    console.error('Failed to send delete notification email:', error);
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