import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateUserManual(): Buffer {
  const doc = new jsPDF();
  let yPosition = 20;

  // Set font for Albanian characters
  doc.setFont('helvetica');

  // Title Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MANUALI I PËRDORUESIT', 105, 40, { align: 'center' });
  
  doc.setFontSize(20);
  doc.text('Sistemi i Menaxhimit të Çështjeve Ligjore', 105, 55, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Albpetrol Sh.A.', 105, 70, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Versioni 2.0 - Gusht 2025', 105, 85, { align: 'center' });

  // Company logo area (placeholder)
  doc.setLineWidth(1);
  doc.rect(85, 100, 40, 30);
  doc.setFontSize(10);
  doc.text('Logo Albpetrol', 105, 118, { align: 'center' });

  // Footer for title page
  doc.setFontSize(10);
  doc.text('© 2025 Albpetrol Sh.A. - Të gjitha të drejtat të rezervuara', 105, 280, { align: 'center' });

  // Add new page for table of contents
  doc.addPage();
  yPosition = 20;

  // Table of Contents
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PËRMBAJTJA', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const tableOfContents = [
    '1. Hyrje në Sistem.....................................................................3',
    '2. Hyrja në Sistem (Login)......................................................4',
    '3. Verifikimi Dy-Faktorësh (2FA)............................................5',
    '4. Paneli Kryesor (Dashboard)................................................6',
    '5. Menaxhimi i të Dhënave.....................................................7',
    '6. Shtimi i Çështjeve të Reja................................................8',
    '7. Shikimi dhe Editimi i të Dhënave.......................................9',
    '8. Eksportimi i të Dhënave..................................................10',
    '9. Menaxhimi i Përdoruesve (Vetëm Administratorët)...........11',
    '10. Cilësimet e Sistemit......................................................12',
    '11. Njoftimet me Email......................................................13',
    '12. Zgjidhja e Problemeve..................................................14',
    '13. Kontakti dhe Mbështetja...............................................15'
  ];

  tableOfContents.forEach(item => {
    doc.text(item, 20, yPosition);
    yPosition += 8;
  });

  // Chapter 1: Introduction
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('1. HYRJE NË SISTEM', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const introText = [
    'Sistemi i Menaxhimit të Çështjeve Ligjore të Albpetrol është një aplikacion web i',
    'zhvilluar për të lehtësuar menaxhimin dhe organizimin e të dhënave ligjore të kompanisë.',
    '',
    'KARAKTERISTIKAT KRYESORE:',
    '• Menaxhimi i sigurt i të dhënave me autentifikim dy-faktorësh',
    '• Ndërfaqe në gjuhën shqipe e optimizuar për përdorues profesionalë',
    '• Sistem rolesh me leje të ndryshme (Përdorues të rregullt dhe Administratorë)',
    '• Eksportim të dhënash në formate Excel dhe CSV',
    '• Njoftimet automatike me email për të gjitha aktivitetet',
    '• Ndjekja e aktivitetit të përdoruesve në kohë reale',
    '• Siguri e avancuar me mbrojtje të llogarisë administrative kryesore',
    '',
    'PËRFITIMET:',
    '• Organizim më i mirë i dokumentacionit ligjor',
    '• Aksesueshmëri nga çdo pajisje me internet',
    '• Bashkëpunim i lehtësuar ndërmjet departamenteve',
    '• Raportim i shpejtë dhe eksportim të dhënash',
    '• Monitorim i aktivitetit dhe auditim i plotë'
  ];

  introText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      // Handle text wrapping
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 2: Login Process
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('2. HYRJA NË SISTEM (LOGIN)', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const loginText = [
    'HAPAT PËR HYRJE NË SISTEM:',
    '',
    '1. HAPJA E APLIKACIONIT',
    '   • Hapni shfletuesin e internetit (Chrome, Firefox, Safari, Edge)',
    '   • Shkruani adresën e sistemit në adresën e dhënë nga administratori',
    '   • Prisni që faqja të ngarkohet plotësisht',
    '',
    '2. FUTJA E KREDENCIALEVE',
    '   • Shkruani adresën tuaj të email-it në fushën "Email"',
    '   • Shkruani fjalëkalimin tuaj në fushën "Fjalëkalimi"',
    '   • Klikoni butonin "Hyr në Sistem"',
    '',
    '3. VERIFIKIMI DY-FAKTORËSH',
    '   • Sistemi do t\'ju dërgojë një kod verifikimi në email',
    '   • Kontrolloni kutinë e email-it tuaj',
    '   • Shkruani kodin 6-shifror në fushën e verifikimit',
    '   • Klikoni "Verifiko Kodin"',
    '',
    'PROBLEMET E MUNDSHME:',
    '• Nëse haroni fjalëkalimin, kontaktoni administratorin',
    '• Nëse nuk merrni kodin e verifikimit, kontrolloni folder-in "Spam"',
    '• Kodi i verifikimit skadon pas 3 minutave',
    '• Për probleme teknike, kontaktoni mbështetjen IT'
  ];

  loginText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 3: Two-Factor Authentication
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3. VERIFIKIMI DY-FAKTORËSH (2FA)', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const twoFAText = [
    'Sistemi përdor autentifikim dy-faktorësh për siguri maksimale.',
    '',
    'PROCESI I VERIFIKIMIT:',
    '',
    '1. PAS FUTJES SË FJALËKALIMIT',
    '   • Do të shfaqet mesazhi "Kodi i verifikimit është dërguar"',
    '   • Kontrolloni email-in tuaj menjëherë',
    '   • Kërkoni email nga "it.system@albpetrol.al"',
    '',
    '2. EMAIL-I I VERIFIKIMIT',
    '   • Tema: "Kodi juaj i verifikimit - Albpetrol Legal System"',
    '   • Përmban një kod 6-shifror (p.sh. 123456)',
    '   • Kodi është i vlefshëm vetëm për 3 minuta',
    '',
    '3. FUTJA E KODIT',
    '   • Kthehuni në faqen e sistemit',
    '   • Shkruani kodin 6-shifror në fushën e dedikuar',
    '   • Klikoni "Verifiko Kodin"',
    '   • Nëse kodi është i saktë, do të hyni në sistem',
    '',
    'RREGULLA SIGURIE:',
    '• Kodi funksionon vetëm një herë',
    '• Pas 3 minutave, kodi skadon automatikisht',
    '• Nëse kodi skadon, duhet të filloni përsëri procesin e hyrjes',
    '• Mos e ndani kodin me persona të tjerë',
    '• Mbyllni gjithmonë shfletuesin pas përdorimit'
  ];

  twoFAText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 4: Dashboard
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('4. PANELI KRYESOR (DASHBOARD)', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const dashboardText = [
    'Paneli kryesor është faqja e parë që shikoni pas hyrjes në sistem.',
    '',
    'ELEMENTET E PANELIT:',
    '',
    '1. STATISTIKAT KRYESORE',
    '   • Totali i Çështjeve: Numri total i çështjeve në sistem',
    '   • Çështjet e Sotme: Çështjet e shtuar sot',
    '   • Çështjet Aktive: Çështjet që janë ende në proces',
    '   • Çështjet e Mbyllura: Çështjet e përfunduara',
    '',
    '2. AKTIVITETI I FUNDIT',
    '   • Lista e 5 çështjeve të fundit të shtuar',
    '   • Informacion mbi krijuesin dhe datën',
    '   • Link i drejtpërdrejtë për shikimin e detajeve',
    '',
    '3. NAVIGIMI',
    '   • Menu anësore për qasje të shpejtë',
    '   • Butoni "Shto Çështje të Re" për shtim të shpejtë',
    '   • Ikona e profilet për cilësimet personale',
    '',
    '4. NJOFTIMET',
    '   • Njoftimet e sistemit shfaqen në krye të faqes',
    '   • Mesazhet e suksesit dhe gabimeve',
    '   • Udhëzimet për veprime të nevojshme'
  ];

  dashboardText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 5: Data Management
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('5. MENAXHIMI I TË DHËNAVE', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const dataText = [
    'FUSHAT E TË DHËNAVE NË SISTEM:',
    '',
    '1. TË DHËNAT THEMELORE',
    '   • Nr. Rendor: Numër identifikimi automatik',
    '   • Paditësi: Emri i paditësit në çështje',
    '   • I Paditur: Emri i të paditurit',
    '   • Objekt: Përshkrimi i objektit të çështjes',
    '',
    '2. TË DHËNAT LIGJORE',
    '   • Nr. Lënde: Numri i lëndës gjyqësore',
    '   • Data e Regjistrimit: Data kur është regjistruar çështja',
    '   • Gjykata: Gjykata kompetente (dropdown menu)',
    '   • Objekti Konkret: Detaje specifike të objektit',
    '',
    '3. PËRFAQËSIMI LIGJOR',
    '   • Avokat i Jashtëm: Emri i avokatit të jashtëm',
    '   • Avokat i Brendshëm: Avokati i kompanisë',
    '   • Statusi: Statusi aktual i çështjes',
    '',
    '4. TË DHËNA ADMINISTRATIVE',
    '   • Përshkrim: Përshkim i detajuar i çështjes',
    '   • Koment: Komente shtesë',
    '   • Data e Krijimit: Automatike',
    '   • Krijuesi: Përdoruesi që e ka shtuar',
    '',
    'ROLET E PËRDORUESVE:',
    '',
    'PËRDORUES TË RREGULLT:',
    '• Mund të shikojnë të gjitha të dhënat',
    '• Mund të shtojnë çështje të reja',
    '• Mund të editojnë vetëm çështjet e tyre',
    '• Mund të eksportojnë të dhëna',
    '',
    'ADMINISTRATORËT:',
    '• Të gjitha të drejtat e përdoruesve të rregullt',
    '• Mund të editojnë dhe fshijnë çdo çështje',
    '• Mund të menaxhojnë përdoruesit',
    '• Mund të konfigurojnë cilësimet e sistemit'
  ];

  dataText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 6: Adding New Cases
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('6. SHTIMI I ÇËSHTJEVE TË REJA', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const addCaseText = [
    'PROCESI I SHTIMIT TË ÇËSHTJES SË RE:',
    '',
    '1. QASJA NË FORMULARIN E SHTIMIT',
    '   • Nga paneli kryesor, klikoni "Shto Çështje të Re"',
    '   • Ose nga menu anësore, zgjidhni "Shto të Dhëna"',
    '   • Do të hapet formulari i shtimit',
    '',
    '2. PLOTËSIMI I FUSHAVE TË DETYRUESHME',
    '   • Fusha e kuqe (*) janë të detyrueshme',
    '   • Paditësi: Shkruani emrin e plotë të paditësit',
    '   • I Paditur: Shkruani emrin e të paditurit',
    '   • Nr. Lënde: Numri zyrtar i lëndës',
    '   • Gjykata: Zgjidhni nga lista dropdown',
    '',
    '3. PLOTËSIMI I FUSHAVE SHTESË',
    '   • Objekt: Përshkrimi i shkurtër i çështjes',
    '   • Data e Regjistrimit: Zgjidhni datën nga kalendari',
    '   • Avokat i Jashtëm/Brendshëm: Emrat e avokatëve',
    '   • Përshkrim: Detaje të plota të çështjes',
    '',
    '4. VALIDIMI DHE RUAJTJA',
    '   • Kontrolloni që të gjitha fushat e detyrueshme janë plotësuar',
    '   • Klikoni "Ruaj të Dhënat"',
    '   • Sistemi do të kontrollojë validitetin e të dhënave',
    '   • Nëse ka gabime, do të shfaqen mesazhe udhëzuese',
    '   • Pas ruajtjes së suksesshme, do të dërgohemi në listën e të dhënave',
    '',
    'RREGULLA VALIDIMI:',
    '• Email duhet të jetë në format të vlefshëm',
    '• Datat nuk mund të jenë në të ardhmen',
    '• Numri i lëndës duhet të jetë unik',
    '• Fushat e tekstit nuk mund të jenë bosh'
  ];

  addCaseText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 7: Viewing and Editing
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('7. SHIKIMI DHE EDITIMI I TË DHËNAVE', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const viewEditText = [
    'SHIKIMI I TË DHËNAVE:',
    '',
    '1. QASJA NË LISTËN E TË DHËNAVE',
    '   • Nga menu anësore, klikoni "Të Dhënat"',
    '   • Do të shfaqet tabela me të gjitha çështjet',
    '   • Tabela është e organizuar në kolonat e të dhënave',
    '',
    '2. NAVIGIMI NË TABELË',
    '   • Përdorni shigjetat për të naviguar ndërmjet faqeve',
    '   • Mund të zgjidhni numrin e rreshtave për faqe',
    '   • Përdorni scroll horizontal për të dhëna të gjera',
    '',
    '3. VEPRIMET E DISPONUESHME',
    '   • Butoni "Shiko" për të parë detajet e plota',
    '   • Butoni "Edito" (vetëm për çështjet tuaja ose administratorët)',
    '   • Butoni "Fshi" (vetëm për administratorët)',
    '',
    'EDITIMI I TË DHËNAVE:',
    '',
    '1. QASJA NË EDITIM',
    '   • Klikoni butonin "Edito" në rreshtin e çështjes',
    '   • Do të hapet formulari me të dhënat ekzistuese',
    '   • Të gjitha fushat do të jenë të plotësuara',
    '',
    '2. NDRYSHIMI I TË DHËNAVE',
    '   • Modifikoni fushat që dëshironi të ndryshoni',
    '   • Mos harroni të ruani ndryshimet',
    '   • Sistemi do të dërgojë njoftim email për ndryshimet',
    '',
    '3. RUAJTJA E NDRYSHIMEVE',
    '   • Klikoni "Ruaj Ndryshimet"',
    '   • Konfirmoni ndryshimet nëse kërkohet',
    '   • Do të dërgoheni përsëri në listën e të dhënave',
    '',
    'LEJET BAZUAR NË ROLE:',
    '• Përdoruesit e rregullt: Vetëm çështjet e krijuara prej tyre',
    '• Administratorët: Të gjitha çështjet në sistem'
  ];

  viewEditText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 8: Export
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('8. EKSPORTIMI I TË DHËNAVE', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const exportText = [
    'Sistemi ofron eksportim të të dhënave në dy formate kryesore.',
    '',
    'FORMATET E EKSPORTIMIT:',
    '',
    '1. EXCEL (.xlsx)',
    '   • Format i përshtatshëm për analizë dhe modifikim',
    '   • Mban formatimin dhe formulat',
    '   • I hapur në Microsoft Excel, LibreOffice, Google Sheets',
    '   • Përmban të gjitha fushat e të dhënave',
    '',
    '2. CSV (Comma Separated Values)',
    '   • Format i thjeshtë dhe universal',
    '   • I hapur në çdo program që mban tabela',
    '   • I përshtatshëm për import në sisteme të tjera',
    '   • Madhësi më e vogël e file-it',
    '',
    'PROCESI I EKSPORTIMIT:',
    '',
    '1. QASJA NË EKSPORTIM',
    '   • Shkoni në faqen "Të Dhënat"',
    '   • Në krye të tabelës, do të shihni butonët e eksportimit',
    '   • "Eksporto Excel" dhe "Eksporto CSV"',
    '',
    '2. FILLIMI I EKSPORTIMIT',
    '   • Klikoni butonin përkatës (Excel ose CSV)',
    '   • Sistemi do të përgatisë file-in',
    '   • Do të shfaqet një mesazh progresie',
    '',
    '3. SHKARKIMI I FILE-IT',
    '   • File-i do të shkarkohet automatikisht',
    '   • Emri i file-it: "Pasqyra_e_Ceshtjeve_YYYY-MM-DD"',
    '   • File-i do të ruhet në folder-in Downloads',
    '',
    'PËRMBAJTJA E EKSPORTIT:',
    '• Të gjitha çështjet që keni leje të shikoni',
    '• Të gjitha fushat e të dhënave',
    '• Formatim i përshtatshëm për printim',
    '• Headers në gjuhën shqipe'
  ];

  exportText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 9: User Management (Admins only)
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('9. MENAXHIMI I PËRDORUESVE (ADMINISTRATORËT)', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const userMgmtText = [
    'Ky seksion është i disponueshëm vetëm për administratorët.',
    '',
    'FUNKSIONET E MENAXHIMIT TË PËRDORUESVE:',
    '',
    '1. SHIKIMI I PËRDORUESVE',
    '   • Lista e të gjithë përdoruesve të sistemit',
    '   • Informatat: Emri, email, roli, data e krijimit',
    '   • Statusi i aktivitetit të fundit',
    '   • Badgje "ROOT" për administratorin kryesor',
    '',
    '2. SHTIMI I PËRDORUESVE TË RINJ',
    '   • Klikoni "Shto Përdorues të Ri"',
    '   • Plotësoni të dhënat: Email, Emri, Mbiemri',
    '   • Zgjidhni rolin: Përdorues i rregullt ose Administrator',
    '   • Sistemi gjeneron fjalëkalim të përkohshëm',
    '   • Fjalëkalimi dërgohet në email të administratorit',
    '',
    '3. NDRYSHIMI I ROLEVE',
    '   • Përdorni dropdown menu për të ndryshuar rolin',
    '   • Opsionet: "Përdorues" dhe "Admin"',
    '   • Ndryshimi aplikohet menjëherë',
    '',
    '4. RIVENDOSJA E FJALËKALIMEVE',
    '   • Klikoni butonin "..." pranë përdoruesit',
    '   • Zgjidhni "Rivendos Fjalëkalimin"',
    '   • Gjenerohet fjalëkalim i ri i përkohshëm',
    '   • Fjalëkalimi i ri shfaqet në një dialog',
    '',
    '5. FSHIRJA E PËRDORUESVE',
    '   • Vetëm për përdoruesit e rregullt',
    '   • Administratori kryesor (ROOT) nuk mund të fshihet',
    '   • Konfirmim i kërkuar para fshirjes',
    '',
    'MBROJTJA E ADMINISTRATORIT KRYESOR:',
    '• Llogaria it.system@albpetrol.al është e mbrojtur',
    '• Nuk mund të fshihet nga asnjë administrator',
    '• Identifikohet me badgjen "ROOT"',
    '• Garanton qasjen administrative të sistemit'
  ];

  userMgmtText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 10: System Settings
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('10. CILËSIMET E SISTEMIT', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const settingsText = [
    'CILËSIMET PERSONALE:',
    '',
    '1. NDRYSHIMI I FJALËKALIMIT',
    '   • Shkoni në "Cilësimet" nga menu',
    '   • Plotësoni fjalëkalimin aktual',
    '   • Shkruani fjalëkalimin e ri (duhet të plotësojë kriteret)',
    '   • Konfirmoni fjalëkalimin e ri',
    '   • Klikoni "Ruaj Ndryshimet"',
    '',
    '2. KRITERET E FJALËKALIMIT',
    '   • Të paktën 8 karaktere',
    '   • Të paktën një shkronjë të madhe',
    '   • Të paktën një numër',
    '   • Të paktën një karakter special (!@#$%^&*)',
    '',
    'CILËSIMET E SISTEMIT (ADMINISTRATORËT):',
    '',
    '1. CILËSIMET E EMAIL-IT',
    '   • Aktivizim/çaktivizim të njoftimeve me email',
    '   • Konfigurimi i temës së email-it',
    '   • Lista e përfituesve të njoftimeve',
    '   • Test i dërgimit të email-it',
    '',
    '2. STATISTIKAT E BAZËS SË TË DHËNAVE',
    '   • Madhësia totale e bazës së të dhënave',
    '   • Hapësira e përdorur',
    '   • Numri i tabelave',
    '   • Informata teknike të sistemit',
    '',
    '3. POLITIKA E FJALËKALIMEVE',
    '   • Rregullat e sigurisë për fjalëkalimet',
    '   • Kërkesa minimale për fuqinë e fjalëkalimit',
    '   • Udhëzime për përdoruesit',
    '',
    'RUAJTJA E CILËSIMEVE:',
    '• Të gjitha ndryshimet duhen ruajtur manualisht',
    '• Butoni "Ruaj Cilësimet" në fund të faqes',
    '• Konfirmimi i ruajtjes shfaqet si njoftim',
    '• Disa cilësime aplikohen menjëherë'
  ];

  settingsText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 11: Email Notifications
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('11. NJOFTIMET ME EMAIL', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const emailText = [
    'Sistemi dërgon njoftimet automatike për të gjitha aktivitetet.',
    '',
    'LLOJET E NJOFTIMEVE:',
    '',
    '1. NJOFTIMI PËR ÇËSHTJE TË RE',
    '   • Dërgohet kur shtohet një çështje e re',
    '   • Përmban të dhënat kryesore të çështjes',
    '   • Informacion mbi krijuesin',
    '   • Link për shikimin e detajeve',
    '',
    '2. NJOFTIMI PËR EDITIM',
    '   • Dërgohet kur modifikohet një çështje',
    '   • Krahasim "Para" dhe "Pas" ndryshimeve',
    '   • Highlightim të fushave të ndryshuara',
    '   • Informacion mbi autorin e ndryshimit',
    '',
    '3. NJOFTIMI PËR FSHIRJE',
    '   • Dërgohet kur fshihet një çështje',
    '   • Përmban të gjitha të dhënat e fshira',
    '   • Informacion mbi administratorin që e ka fshirë',
    '   • Archive i plotë për auditim',
    '',
    '4. VERIFIKIMI DY-FAKTORËSH',
    '   • Kodi i sigurisë për hyrje në sistem',
    '   • Skadon pas 3 minutave',
    '   • Dërgohet në çdo tentativë hyrjeje',
    '',
    'KONFIGURIMI I NJOFTIMEVE (ADMINISTRATORËT):',
    '',
    '1. AKTIVIZIMI/ÇAKTIVIZIMI',
    '   • Nga "Cilësimet e Sistemit"',
    '   • Switch për aktivizim global',
    '   • Aplikohet për të gjitha llojet e njoftimeve',
    '',
    '2. LISTA E PËRFITUESVE',
    '   • Email-et që marrin njoftimet',
    '   • Mund të shtohen email-e të shumtë',
    '   • Ndarja me presje (,)',
    '   • Validimi automatik i adresave',
    '',
    '3. PERSONALIZIMI I TEMËS',
    '   • Tema e email-it për njoftimet',
    '   • Mbështet variabla dinamike',
    '   • Preview i disponueshëm',
    '',
    'ZGJIDHJA E PROBLEMEVE:',
    '• Nëse nuk merrni email-e, kontrolloni folder-in Spam',
    '• Sigurohuni që adresa juaj është në listën e përfituesve',
    '• Kontaktoni administratorin për probleme teknike'
  ];

  emailText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 12: Troubleshooting
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('12. ZGJIDHJA E PROBLEMEVE', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const troubleshootText = [
    'PROBLEMET E ZAKONSHME DHE ZGJIDHJET:',
    '',
    '1. PROBLEME ME HYRJEN NË SISTEM',
    '',
    'Problem: "Email ose fjalëkalim i gabuar"',
    '• Kontrolloni shkrimin e email-it',
    '• Sigurohuni që nuk ka hapësira shtesë',
    '• Provoni të shkruani fjalëkalimin përsëri',
    '• Kontaktoni administratorin për rivendosje',
    '',
    'Problem: "Nuk marr kodin e verifikimit"',
    '• Kontrolloni folder-in Spam/Junk',
    '• Prisni deri në 2 minuta për dërgimin',
    '• Sigurohuni që email-i juaj është aktiv',
    '• Provoni të hyni përsëri për kod të ri',
    '',
    '2. PROBLEME ME FORMULARËT',
    '',
    'Problem: "Nuk mund të ruaj të dhënat"',
    '• Kontrolloni që të gjitha fushat e kuqe janë plotësuar',
    '• Sigurohuni që email-et janë në format të saktë',
    '• Kontrolloni datat (nuk mund të jenë në të ardhmen)',
    '• Rifreshoni faqen dhe provoni përsëri',
    '',
    'Problem: "Faqja nuk ngarkohet"',
    '• Kontrolloni lidhjen me internetin',
    '• Rifreshoni faqen (Ctrl+F5 ose Cmd+Shift+R)',
    '• Provoni një shfletues tjetër',
    '• Pastrojni cache-in e shfletuesit',
    '',
    '3. PROBLEME ME EKSPORTIMIN',
    '',
    'Problem: "File-i nuk shkarkohet"',
    '• Sigurohuni që nuk ka popup blocker aktiv',
    '• Kontrolloni cilësimet e Downloads',
    '• Provoni një shfletues tjetër',
    '• Kontrolloni hapësirën e lirë në disk',
    '',
    '4. PROBLEME ME PERFORMANCE',
    '',
    'Problem: "Sistemi është i ngadaltë"',
    '• Mbyllni tab-a të tjera të shfletuesit',
    '• Restartoni shfletuesin',
    '• Kontrolloni shpejtësinë e internetit',
    '• Raportoni te administratori nëse vazhdon',
    '',
    '5. PROBLEME ME LEJET',
    '',
    'Problem: "Nuk mund të editoj/fshij"',
    '• Kontrolloni që jeni pronari i çështjes',
    '• Vetëm administratorët mund të fshijnë',
    '• Kontaktoni administratorin për ndryshim roli',
    '',
    'HAPA TË PËRGJITHSHËM ZGJIDHJE:',
    '1. Rifreshoni faqen',
    '2. Logout dhe login përsëri',
    '3. Provoni një shfletues tjetër',
    '4. Kontrolloni lidhjen me internetin',
    '5. Kontaktoni mbështetjen teknike'
  ];

  troubleshootText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Chapter 13: Contact and Support
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('13. KONTAKTI DHE MBËSHTETJA', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const contactText = [
    'INFORMACION KONTAKTI:',
    '',
    'MBËSHTETJA TEKNIKE:',
    '• Email: it.system@albpetrol.al',
    '• Telefon: [Numri i telefonit të IT]',
    '• Orari: E Hënë - E Premte, 08:00 - 17:00',
    '',
    'ADMINISTRATORI I SISTEMIT:',
    '• Email: it.system@albpetrol.al',
    '• Për probleme urgjente dhe qasje në sistem',
    '• Për krijimin e llogarive të reja',
    '• Për rivendosjen e fjalëkalimeve',
    '',
    'DEPARTAMENTI LIGJOR:',
    '• Për pyetje mbi përmbajtjen ligjore',
    '• Për udhëzime mbi plotësimin e të dhënave',
    '• Për interpretime të fushave specifike',
    '',
    'SI TË RAPORTONI PROBLEME:',
    '',
    '1. PËRGATITJA E RAPORTIT',
    '   • Përshkruani problemin sa më detajisht',
    '   • Përmendni çfarë po bënit kur ndodhi problemi',
    '   • Specifikoni shfletuesin dhe sistemin operativ',
    '   • Nëse është e mundur, bëni screenshot',
    '',
    '2. INFORMATAT E NEVOJSHME',
    '   • Emri dhe email-i juaj',
    '   • Ora dhe data e problemit',
    '   • Mesazhi i gabimit (nëse ka)',
    '   • Hapat për riprodhim të problemit',
    '',
    '3. PRIORITETET E MBËSHTETJES',
    '   • URGJENT: Pamundësi hyrje në sistem',
    '   • I LARTË: Humbje të dhënash ose funksionalitet kritik',
    '   • NORMAL: Probleme performancë ose bugs jo-kritikë',
    '   • I ULËT: Kërkesa për përmirësime ose funksionalitete të reja',
    '',
    'ORARI I PËRGJIGJES:',
    '• Urgjente: Brenda 2 orëve (orari i punës)',
    '• Të larta: Brenda 1 dite pune',
    '• Normale: Brenda 2-3 ditë pune',
    '• Të ulëta: Brenda 1 jave',
    '',
    'TRAJNIMET DHE DOKUMENTIMI:',
    '',
    '• Ky manual përditësohet rregullisht',
    '• Versioni më i ri disponohet në sistem',
    '• Trajnime periodike për përdoruesit e rinj',
    '• Video udhëzues të disponueshëm me kërkesë',
    '• FAQ (Pyetje të shpeshta) në faqen e sistemit',
    '',
    'FEEDBACK DHE SUGJERIME:',
    '',
    'Mirëpresim feedback-un tuaj për përmirësimin e sistemit:',
    '• Sugjerime për funksionalitete të reja',
    '• Raporte mbi përdorshmërinë',
    '• Ide për optimizimin e proceseve',
    '• Komente mbi interfejsin e përdoruesit'
  ];

  contactText.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 6;
      });
    }
  });

  // Final page with version info and footer
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACION SHTESË', 20, yPosition);
  yPosition += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const finalText = [
    'VERSIONI I SISTEMIT: 2.0',
    'DATA E PUBLIKIMIT: Gusht 2025',
    'KRIJUAR PËR: Albpetrol Sh.A.',
    '',
    'KARAKTERISTIKAT E VERSIONIT AKTUAL:',
    '• Autentifikim dy-faktorësh universal',
    '• Mbrojtje e avancuar e llogarisë administrative',
    '• Njoftimet e plota me email për të gjitha aktivitetet',
    '• Ndjekja e aktivitetit në kohë reale',
    '• Interface e përmirësuar në gjuhën shqipe',
    '• Eksportim i optimizuar në Excel dhe CSV',
    '• Sistem i roleve me kontrolle të detajuara',
    '',
    'SHËNIM I RËNDËSISHËM:',
    'Ky manual përfshin të gjitha funksionalitetet e sistemit deri',
    'në momentin e publikimit. Për funksionalitete të reja ose',
    'ndryshime, konsultohuni me versionin më të ri të manualit',
    'ose kontaktoni mbështetjen teknike.',
    '',
    'SIGURIA DHE PRIVATËSIA:',
    'Sistemi respekton plotësisht standardet e sigurisë së',
    'të dhënave dhe privatësisë. Të gjitha të dhënat janë të',
    'enkriptuara dhe të mbrojtura me masa sigurie të avancuara.',
    '',
    'DISCLAIMER:',
    'Albpetrol Sh.A. rezervon të drejtën për të bërë ndryshime',
    'në sistem dhe në këtë manual pa njoftim paraprak. Për',
    'informacion të përditësuar, referojuni gjithmonë versionit',
    'më të ri të dokumentacionit.'
  ];

  finalText.forEach(line => {
    if (line === '') {
      yPosition += 8;
    } else {
      const splitText = doc.splitTextToSize(line, 170);
      splitText.forEach((textLine: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(textLine, 20, yPosition);
        yPosition += 7;
      });
    }
  });

  // Footer for final page
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Faleminderit që përdorni Sistemin e Menaxhimit të Çështjeve Ligjore!', 105, 285, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}