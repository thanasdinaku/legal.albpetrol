import nodemailer from 'nodemailer';
import type { DataEntry, User } from '@shared/schema';
import { formatAlbanianDateTime, parseISOToGMT1 } from './timezone';

// Configure real SMTP transporter for actual email delivery
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper function for email delivery with logging
const sendActualEmail = async (to: string, from: string, subject: string, text: string, html?: string) => {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('📧 SENDING REAL EMAIL - it.system@albpetrol.al');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`TO: ${to}`);
  console.log(`FROM: ${from}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('──────────────────────────────────────────────────────────────');
  
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    console.log('✅ EMAIL DELIVERED SUCCESSFULLY');
    console.log('══════════════════════════════════════════════════════════════\n');
    return true;
  } catch (error) {
    console.log('❌ EMAIL DELIVERY FAILED:', error);
    console.log('══════════════════════════════════════════════════════════════\n');
    throw error;
  }
};

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

  // Email configuration for console logging

  try {
    await sendActualEmail(
      user.email,
      'it.system@albpetrol.al',
      'Kodi i Verifikimit - Albpetrol SH.A.',
      `Kodi juaj i verifikimit: ${code}`,
      htmlContent
    );
    console.log(`✅ Two-factor code sent to: ${user.email}`);
  } catch (error: any) {
    console.error('❌ Failed to send two-factor code:', error);
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
    await sendActualEmail(
      notificationSettings.emailAddresses.join(', '),
      'it.system@albpetrol.al',
      notificationSettings.subject,
      plainTextContent,
      htmlContent
    );
    console.log(`✅ New entry notification delivered to: ${notificationSettings.emailAddresses.join(', ')}`);
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

  // Helper function to check if a field has content and should be displayed
  const hasContent = (value: any) => {
    return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
  };

  // Helper function to format fields with content only
  const getFieldsWithContent = (entry: DataEntry, isUpdated: boolean) => {
    const fieldsHtml: string[] = [];
    
    fields.forEach(field => {
      const value = entry[field.key as keyof DataEntry];
      if (hasContent(value)) {
        const originalValue = String(originalEntry[field.key as keyof DataEntry] || '');
        const updatedValue = String(updatedEntry[field.key as keyof DataEntry] || '');
        
        let displayValue = String(value);
        if (isUpdated && originalValue !== updatedValue) {
          displayValue = `<span style="background-color: #dcfce7; color: #166534; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${displayValue}</span>`;
        }
        
        fieldsHtml.push(`<li><strong>${field.label}:</strong> ${displayValue}</li>`);
      }
    });
    
    return fieldsHtml.join('');
  };

  const changesDetails = notificationSettings.includeDetails ? `
<div style="margin-bottom: 30px;">
  <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">Ishte:</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
    <li><strong>Nr. Rendor:</strong> ${nrRendor || originalEntry.id}</li>
    ${getFieldsWithContent(originalEntry, false)}
  </ul>
</div>

<div style="margin-bottom: 20px;">
  <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #059669; padding-bottom: 5px;">U bë:</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
    <li><strong>Nr. Rendor:</strong> ${nrRendor || updatedEntry.id}</li>
    ${getFieldsWithContent(updatedEntry, true)}
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

  // Helper function for plain text fields with content only
  const getPlainTextFieldsWithContent = (entry: DataEntry) => {
    const fieldsText: string[] = [];
    
    fields.forEach(field => {
      const value = entry[field.key as keyof DataEntry];
      if (hasContent(value)) {
        fieldsText.push(`- ${field.label}: ${String(value)}`);
      }
    });
    
    return fieldsText.join('\n');
  };

  const plainTextContent = `
ALBPETROL SH.A. - Sistemi i Menaxhimit të Çështjeve Ligjore

Njoftim për Ndryshim
Një çështje ligjore është përditësuar në sistem.

${notificationSettings.includeDetails ? `
ISHTE:
- Nr. Rendor: ${nrRendor || originalEntry.id}
${getPlainTextFieldsWithContent(originalEntry)}

U BË:
- Nr. Rendor: ${nrRendor || updatedEntry.id}
${getPlainTextFieldsWithContent(updatedEntry)}

Ndryshuar nga: ${editor.firstName} ${editor.lastName} (${editor.email})
Data e Ndryshimit: ${updatedEntry.updatedAt?.toLocaleString('sq-AL')}
` : ''}

---
Ky është një email automatik nga sistemi i menaxhimit të çështjeve ligjore të Albpetrol SH.A.
Ju lutemi mos u përgjigjeni në këtë adresë email.
  `;

  try {
    await sendActualEmail(
      notificationSettings.emailAddresses.join(', '),
      'it.system@albpetrol.al',
      `Ndryshim në çështjen: ${updatedEntry.paditesi} kundrejt ${updatedEntry.iPaditur}`,
      plainTextContent,
      htmlContent
    );
    console.log(`✅ Edit notification delivered to: ${notificationSettings.emailAddresses.join(', ')}`);
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
    await sendActualEmail(
      notificationSettings.emailAddresses.join(', '),
      'it.system@albpetrol.al',
      `Fshirje e çështjes: ${deletedEntry.paditesi}`,
      plainTextContent,
      htmlContent
    );
    console.log(`✅ Delete notification delivered to: ${notificationSettings.emailAddresses.join(', ')}`);
  } catch (error) {
    console.error('Failed to send delete notification email:', error);
    throw error;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('🔧 TESTING REAL EMAIL CONNECTION - it.system@albpetrol.al');
    console.log('══════════════════════════════════════════════════════════════');
    
    await transporter.verify();
    
    console.log('📧 Email Account: it.system@albpetrol.al');
    console.log('⚙️ System: Albpetrol Legal Management');
    console.log('📝 Delivery Method: Real SMTP Email Delivery');
    console.log('🔔 Court Hearing Alerts: ACTIVE');
    console.log('📬 Case Update Notifications: ACTIVE');
    console.log('✅ SMTP CONNECTION VERIFIED - READY FOR REAL EMAIL DELIVERY');
    console.log('══════════════════════════════════════════════════════════════\n');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection test failed:', error);
    console.log('══════════════════════════════════════════════════════════════\n');
    return false;
  }
}

export async function sendCourtHearingNotification(
  recipientEmail: string,
  fromEmail: string,
  notification: any
): Promise<boolean> {
  try {
    console.log('\n🔍 === DEBUGGING EMAIL NOTIFICATION TIME FORMATTING ===');
    // Parse the hearing date and extract components manually to avoid timezone conversion
    const hearingDateISO = notification.hearingDateTime;
    console.log('📧 Original hearing date from notification:', hearingDateISO);
    
    // Extract date and time components directly from the ISO string
    let displayDateTime;
    if (hearingDateISO.includes('T')) {
      // Format: "2025-08-24T21:31:00.000Z" or "2025-08-24T21:31"
      const [datePart, timePart] = hearingDateISO.split('T');
      const [year, month, day] = datePart.split('-');
      const timeOnly = timePart.split(':').slice(0, 2).join(':'); // Get HH:MM only
      displayDateTime = `${day}.${month}.${year}, ${timeOnly}`;
      console.log('📧 Formatted display time:', displayDateTime);
    } else {
      // Fallback to original formatting if not ISO format
      const hearingDate = new Date(hearingDateISO);
      displayDateTime = hearingDate.toLocaleString('sq-AL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    const formattedDateTime = displayDateTime;
    
    const message = `Nesër, një seancë gjyqësore do të zhvillohet për ${notification.plaintiff} dhe ${notification.defendant} në ${formattedDateTime} (Koha e Shqipërisë)`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Albpetrol SH.A.</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Sistemi i Menaxhimit të Çështjeve Ligjore</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">🏛️ Njoftim për Seancë Gjyqësore</h2>
            <p style="margin: 0; color: #374151; font-size: 16px; font-weight: bold;">
              Nesër do të zhvillohet një seancë gjyqësore
            </p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Detajet e Seancës:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #374151;">
              <li><strong>Paditesi:</strong> ${notification.plaintiff}</li>
              <li><strong>I Paditur:</strong> ${notification.defendant}</li>
              <li><strong>Data dhe Ora:</strong> <span style="color: #dc2626; font-weight: bold;">${formattedDateTime}</span></li>
              <li><strong>Zonë Kohore:</strong> GMT+1 (Koha e Shqipërisë)</li>
              <li><strong>Nr. Çështjës:</strong> ${notification.caseId}</li>
              <li><strong>Lloji i Seancës:</strong> ${notification.hearingType === 'first_instance' ? 'Shkalla e Parë' : 'Apel'}</li>
            </ul>
          </div>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>⏰ Kujtesë:</strong> Kjo seancë gjyqësore do të zhvillohet nesër. Ju lutemi sigurohuni që të jeni të gatshëm për datën dhe orën e caktuar.
            </p>
          </div>
          
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
    
    await sendActualEmail(
      recipientEmail,
      fromEmail,
      'Njoftim për Seancë Gjyqësore - Albpetrol SH.A.',
      message,
      htmlContent
    );
    console.log('✅ Court hearing notification delivered to:', recipientEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send court hearing notification:', error);
    return false;
  }
}

export async function sendCaseUpdateNotification(
  recipientEmail: string,
  fromEmail: string,
  notification: any
): Promise<boolean> {
  try {
    const message = `Përditësim çështjeje: ${notification.paditesi} kundrejt ${notification.iPaditur} u ${notification.updateType === 'created' ? 'krijua' : notification.updateType === 'updated' ? 'përditësua' : 'fshi'}`;
    
    await sendActualEmail(
      recipientEmail,
      fromEmail,
      `Përditësim çështjeje: ${notification.paditesi} kundrejt ${notification.iPaditur} u ${notification.updateType === 'created' ? 'krijua' : notification.updateType === 'updated' ? 'përditësua' : 'fshi'}`,
      message
    );
    console.log('✅ Case update notification delivered to:', recipientEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send case update notification:', error);
    return false;
  }
}