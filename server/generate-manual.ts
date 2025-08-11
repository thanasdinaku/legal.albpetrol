import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateUserManual(): Buffer {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
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
    'HAPAT PËR HYRJE NË SISTEM ME SHPJEGIME VIZUALE:',
    '',
    '📸 HAPI 1: HAPJA E APLIKACIONIT',
    'Çfarë do të shihni në print-screen:',
    '   • Hapni shfletuesin tuaj (duhet të shihni ikonën Chrome/Firefox/Safari)',
    '   • Klikoni në shiritin e adresave në krye (fusha e bardhë me tekst)',
    '   • Shkruani URL-në e sistemit që ju dha administratori',
    '   • Shtyni Enter dhe prisni 2-5 sekonda për ngarkimin',
    '   ✓ Sukses: Do të shihni logon e Albpetrol që shfaqet',
    '',
    '📸 HAPI 2: IDENTIFIKIMI I FAQES SË HYRJES', 
    'Në print-screen duhet të shihni EKZAKTËSISHT:',
    '   • Logo e Albpetrol në krye të faqes (ngjyra blu dhe e kuqe)',
    '   • Titullin "HYR NË SISTEM" në mes të faqes',
    '   • Dy fusha të bardha për plotësim:',
    '     - E para me etiketën "Email" (me @ symbol)',
    '     - E dyta me etiketën "Fjalëkalimi" (me simbolin e kyçit)',
    '   • Buton të kaltër "Hyr në Sistem" nën fushat',
    '   • Ngjyrat e Albpetrol në të gjithë dizajnin',
    '',
    '📸 HAPI 3: PLOTËSIMI I KREDENCIALEVE',
    'Si duhet të duket print-screen-i gjatë plotësimit:',
    '   • Klikoni në fushën e parë (Email) - do të shihni kursorin',
    '   • Shkruani email-in tuaj të plotë (shembull: emri.mbiemri@albpetrol.al)',
    '   • Klikoni në fushën e dytë (Fjalëkalimi) - teksti bëhet pika (*****)',
    '   • Shkruani fjalëkalimin tuaj (duhet të shihni pika, jo shkronja)',
    '   • Sigurohuni që të dy fushat kanë tekst (nuk janë bosh)',
    '   ✓ Gatishmëria: Butoni "Hyr në Sistem" bëhet aktiv (blu i ndritshëm)',
    '',
    '📸 HAPI 4: VERIFIKIMI DY-FAKTORËSH',
    'Pas klikimit, faqja e re duhet të tregojë:',
    '   • Titull "Verifikimi Dy-Faktorësh" në krye',
    '   • Mesazh "Kodi është dërguar në email-in tuaj"',
    '   • Fushë për 6 shifra (zakonisht me kufiza të veçantë)',
    '   • Kohëmatës që numëron mbrapsht nga 3:00 minuta',
    '   • Du butona: "Verifiko" dhe "Dërgo Kod të Ri"',
    '   • Ngjyra të njëjta si faqja e hyrjes',
    '',
    '📸 HAPI 5: KONTROLLIMI I EMAIL-IT',
    'Në email (tab i ri ose aplikacion):',
    '   • Hapni kutinë tuaj të email-it',
    '   • Kërkoni email të ri nga "it.system@albpetrol.al"',
    '   • Tema duhet të jetë: "Kodi i Verifikimit për Sistemin Ligjor"',
    '   • Brenda email-it: kod 6-shifror (shembull: 123456)',
    '   • Koha e dërgimit duhet të jetë para pak sekondave',
    '   ⚠️ Nëse nuk e gjeni: kontrolloni folder-in Spam/Junk',
    '',
    '📸 HAPI 6: FUTJA E KODIT DHE PËRFUNDIMI',
    'Kthehuni në tab-in e sistemit dhe:',
    '   • Shkruani kodin 6-shifror në fushën e verifikimit',
    '   • Klikoni "Verifiko" (butoni bëhet aktiv pas 6 shifrave)',
    '   • Prisni 1-2 sekonda për verifikim',
    '   ✓ Sukses: Faqja ndryshon në Dashboard me logon e Albpetrol',
    '',
    'ZGJIDHJA E PROBLEMEVE NË PRINT-SCREEN:',
    '❌ Problem: Faqja e bardhë/bosh → Kontrolloni internetin',
    '❌ Problem: "Email i gabuar" → Kontrolloni shkrimin e email-it',
    '❌ Problem: "Kodi i gabuar" → Kopjoni sërish nga email-i',
    '❌ Problem: "Kodi skadoi" → Klikoni "Dërgo Kod të Ri"'
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
    'PANELI KRYESOR - UDHËZIME ME PRINT-SCREEN:',
    '',
    '📸 PAMJA E PËRGJITHSHME E DASHBOARD-IT:',
    'Pas hyrjes së suksesshme, në print-screen duhet të shihni:',
    '',
    '1. KOKA E FAQES (TOP):',
    '   • Logo e Albpetrol në këndin e majtë sipër',
    '   • Titulli "Pasqyra e Çështjeve Ligjore" në mes',
    '   • Emri juaj dhe roli në këndin e djathtë (p.sh. "Administrator")',
    '   • Ngjyra të bardha dhe blu të Albpetrol',
    '',
    '📸 2. MENU ANËSORE (MAJTAS):',
    'Print-screen i menu-së duhet të tregojë:',
    '   • "Paneli Kryesor" (aktiv, me ngjyrë blu)',
    '   • "Regjistro Çështje" (me ikonë +)',
    '   • "Menaxho Çështjet" (me ikonë tabele)',
    '   • "Menaxhimi i Përdoruesve" (vetëm për admin)',
    '   • "Cilësimet e Sistemit" (vetëm për admin)', 
    '   • "Cilësimet" (për të gjithë)',
    '   • "Shkarko Manualin" (buton i ri)',
    '',
    '📸 3. STATISTIKAT KRYESORE (QENDRA):',
    'Katër karta në një rresht që tregojnë:',
    '   • TOTALI I ÇËSHTJEVE: Numër + ikona folder',
    '   • ÇËSHTJET E SOTME: Numër + ikona kalendar',
    '   • ÇËSHTJET AKTIVE: Numër + ikona rreth',
    '   • ÇËSHTJET E MBYLLURA: Numër + ikona check',
    '   • Secila kartë ka ngjyrë të ndryshme (blu, jeshil, portokalli, gri)',
    '',
    '📸 4. AKTIVITETI I FUNDIT (POSHTË):',
    'Tabela që tregon:',
    '   • Kolonat: Nr. Rendor, Paditësi, Objekt, Data, Krijuesi',
    '   • Deri në 5 rreshta me të dhënat e fundit',
    '   • Nëse nuk ka të dhëna: "Nuk ka çështje të regjistruara ende"',
    '   • Butoni "Shiko të Gjitha" për të parë më shumë',
    '',
    '📸 5. NJOFTIMET (NË KRYE TË FAQES):',
    'Shfaqen mbi statistikat:',
    '   • Mesazhet e gjelbra: Veprime të suksesshme',
    '   • Mesazhet e kuqe: Gabime ose probleme',
    '   • Mesazhet e kaltëra: Informacione të rëndësishme',
    '   • X për mbyllje në këndin e djathtë',
    '',
    'NAVIGIMI NË DASHBOARD:',
    '📸 Si të lëvizni në print-screen:',
    '   • Klikoni butonin në menu anësore (ngjyra ndryshon)',
    '   • Përdorni "Shto Çështje të Re" për shtim të shpejtë',
    '   • Klikoni statistikat për detaje të plota',
    '   • Scroll poshtë për më shumë informacione'
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
    'SHTIMI I ÇËSHTJES SË RE - UDHËZIME ME PRINT-SCREEN:',
    '',
    '📸 HAPI 1: QASJA NË FORMULARIN E SHTIMIT',
    'Si të shkoni tek formulari në print-screen:',
    '   • Varianti 1: Nga Dashboard-i, klikoni butonin blu "Shto Çështje të Re"',
    '   • Varianti 2: Nga menu anësore majtas, klikoni "Regjistro Çështje" (ikona +)',
    '   ✓ Rezultati: Faqja ndryshon dhe tregon formularin e plotë',
    '',
    '📸 HAPI 2: IDENTIFIKIMI I FORMULARIT',
    'Në print-screen e formularit duhet të shihni:',
    '   • Titullin "Shto Çështje të Re" në krye',
    '   • Logo e Albpetrol në këndin e majtë sipër',
    '   • Menu anësore majtas (e njëjtë si Dashboard)',
    '   • Formular në mes me fusha të shumta plotësimi',
    '   • Butona "Ruaj të Dhënat" dhe "Anulo" në fund',
    '',
    '📸 HAPI 3: IDENTIFIKIMI I FUSHAVE TË DETYRUESHME',
    'Çfarë duhet të shihni në çdo fushë:',
    '   • Fusha me (*) të kuqe = TË DETYRUESHME',
    '   • Paditësi* = tekst i bardhë me placeholder gri',
    '   • I Paditur* = tekst i bardhë me placeholder gri',
    '   • Nr. Lënde* = tekst i bardhë për numrin',
    '   • Gjykata* = dropdown me shigjetë poshtë',
    '   • Data e Regjistrimit* = kalendar (ikona kalendar)',
    '',
    '📸 HAPI 4: PLOTËSIMI I FUSHAVE - TEKST',
    'Si duket print-screen-i gjatë plotësimit:',
    '   • Klikoni në fushën "Paditësi" → kursor i zi shfaqet',
    '   • Shkruani emrin (teksti i zi zëvendëson placeholder-in gri)',
    '   • Pas plotësimit: fusha ka tekst të zi në vend të gri',
    '   • Përsëritni për "I Paditur", "Nr. Lënde", "Objekt", etj.',
    '   ✓ Sukses: Teksti i zi tregon plotësim të suksesshëm',
    '',
    '📸 HAPI 5: ZGJEDHJA E GJYKATËS (DROPDOWN)',
    'Si të përdorni dropdown-in në print-screen:',
    '   • Klikoni në fushën "Gjykata" → shfaqet lista me shigjetë',
    '   • Print-screen tregon menu të hapur me opcione:',
    '     - "Gjykata e Shkallës së Parë"',
    '     - "Gjykata e Apelit"',
    '     - "Gjykata Administrative"',
    '   • Klikoni në një opsion → menu mbyllet dhe tregon zgjedhjen',
    '   ✓ Sukses: Fusha tregon gjykatën e zgjedhur',
    '',
    '📸 HAPI 6: ZGJEDHJA E DATËS (KALENDAR)',
    'Si të përdorni kalendarin në print-screen:',
    '   • Klikoni në fushën "Data e Regjistrimit" → hapet kalendar',
    '   • Print-screen tregon kalendar me:',
    '     - Muaji dhe viti në krye',
    '     - Rrjetë me datat e muajit',
    '     - Data e sotme e theksuar',
    '     - Shigjeta për ndryshimin e muajit',
    '   • Klikoni në datën e duhur → kalendari mbyllet',
    '   ✓ Sukses: Data shfaqet në format dd/mm/yyyy',
    '',
    '📸 HAPI 7: RUAJTJA E TË DHËNAVE',
    'Procesi i ruajtjes në print-screen:',
    '   • Kontrolloni që të gjitha fushat me (*) janë plotësuar',
    '   • Nëse ka fusha bosh: butoni "Ruaj" është gri (jo aktiv)',
    '   • Nëse të gjitha plotësuar: butoni "Ruaj" është blu (aktiv)',
    '   • Klikoni "Ruaj të Dhënat"',
    '   • Print-screen tregon: "Duke ruajtur..." për 1-2 sekonda',
    '   ✓ Sukses: Njoftim i gjelbër "Të dhënat u ruajtën me sukses"',
    '',
    'ZGJIDHJA E PROBLEMEVE NË FORMULAR:',
    '❌ Problem: Butoni "Ruaj" gri → Kontrolloni fushat me (*)',
    '❌ Problem: "Kamp i detyrueshëm" → Plotësoni fushat e kuqe',
    '❌ Problem: "Data e pavlefshme" → Zgjidhni datë nga kalendari',
    '❌ Problem: Formulari bosh → Rifreskoni faqen dhe provoni sërish'
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
    'SHIKIMI DHE EDITIMI - UDHËZIME ME PRINT-SCREEN:',
    '',
    '📸 HAPI 1: QASJA NË TABELËN E TË DHËNAVE',
    'Si të shkoni tek tabela në print-screen:',
    '   • Nga menu anësore majtas, klikoni "Menaxho Çështjet" (ikona tabele)',
    '   ✓ Rezultati: Faqja ndryshon dhe tregon tabelën e plotë',
    '',
    '📸 HAPI 2: IDENTIFIKIMI I TABELËS',
    'Në print-screen e tabelës duhet të shihni:',
    '   • Titullin "Menaxhimi i Çështjeve" në krye',
    '   • Butona "Eksporto Excel" dhe "Eksporto CSV" lart djathtas',
    '   • Tabela me kolona: Nr. Rendor, Paditësi, I Paditur, Nr. Lënde, etj.',
    '   • Kolona "Veprime" në fund me butona për çdo rresht',
    '   • Numra faqesh poshtë tabelës (1, 2, 3...)',
    '',
    '📸 HAPI 3: NAVIGIMI NË TABELË',
    'Si të lëvizni në print-screen:',
    '   • Scroll horizontal: Përdorni shigjeten e majtë/djathtë poshtë tabelës',
    '   • Ndërrim faqesh: Klikoni numrat 1, 2, 3 ose shigjetat < >',
    '   • Print-screen tregon: "Faqja 1 nga 5" (shembull)',
    '   ✓ Sukses: Tabela shfaq të dhëna të ndryshme për çdo faqe',
    '',
    '📸 HAPI 4: IDENTIFIKIMI I BUTONAVE TË VEPRIMIT',
    'Në kolonën "Veprime" për çdo rresht duhet të shihni:',
    '   • Buton blu "Shiko" (ikona sy) - i disponueshëm për të gjithë',
    '   • Buton jeshil "Edito" (ikona laps) - vetëm për çështjet tuaja',
    '   • Buton i kuq "Fshi" (ikona trash) - vetëm për administratorë',
    '   • Nëse nuk keni leje: butoni duket gri dhe nuk klikohet',
    '',
    '📸 HAPI 5: SHIKIMI I DETAJEVE (BUTON "SHIKO")',
    'Kur klikoni "Shiko":',
    '   • Hapet dritare (modal) mbi tabelën',
    '   • Print-screen tregon: sfondi bëhet i errët',
    '   • Modal i bardhë në mes me të gjitha të dhënat:',
    '     - Nr. Rendor, Paditësi, I Paditur',
    '     - Nr. Lënde, Data e Regjistrimit, Gjykata',
    '     - Përshkrim i plotë, Komente, etj.',
    '   • Buton "X" lart djathtas për mbyllje',
    '   • Buton "Mbyll" poshtë modalit',
    '',
    '📸 HAPI 6: EDITIMI I TË DHËNAVE (BUTON "EDITO")',
    'Kur klikoni "Edito":',
    '   • Faqja ndryshon dhe tregon formularin e editimit',
    '   • Print-screen tregon të njëjtin formular si "Shto të Re"',
    '   • Dallimi: Të gjitha fushat janë TË PLOTËSUARA me të dhënat ekzistuese',
    '   • Titullin "Edito Çështjen" në vend të "Shto Çështje të Re"',
    '   • Butoni "Ruaj Ndryshimet" në vend të "Ruaj të Dhënat"',
    '',
    '📸 HAPI 7: MODIFIKIMI I TË DHËNAVE',
    'Si të ndryshoni të dhënat në print-screen:',
    '   • Klikoni në fushën që doni të ndryshoni',
    '   • Fshini tekstin e vjetër (Ctrl+A, Delete)',
    '   • Shkruani tekstin e ri',
    '   • Print-screen tregon ndryshimin: tekst i ri në vend të të vjetrit',
    '   • Përsëritni për fusha të tjera sipas nevojës',
    '',
    '📸 HAPI 8: RUAJTJA E NDRYSHIMEVE',
    'Procesi i ruajtjes në print-screen:',
    '   • Klikoni "Ruaj Ndryshimet" (buton blu)',
    '   • Print-screen tregon: "Duke ruajtur..." për 1-2 sekonda',
    '   ✓ Sukses: Njoftim i gjelbër "Ndryshimet u ruajtën me sukses"',
    '   • Faqja kthehet automatikisht në tabelën e të dhënave',
    '   • Email-i dërgohet automatikisht për ndryshimet',
    '',
    'LEJET NË PRINT-SCREEN:',
    '👥 Përdorues i rregullt:',
    '   • "Shiko" aktiv për të gjitha çështjet',
    '   • "Edito" aktiv vetëm për çështjet e krijuara prej tyre',
    '   • "Fshi" gri/jo i disponueshëm',
    '👑 Administrator:',
    '   • Të gjithë butonët aktiv për të gjitha çështjet'
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
    'EKSPORTIMI I TË DHËNAVE - UDHËZIME ME PRINT-SCREEN:',
    '',
    '📸 HAPI 1: QASJA NË BUTONËT E EKSPORTIMIT',
    'Si të gjeni butonët në print-screen:',
    '   • Shkoni në faqen "Menaxho Çështjet" nga menu anësore',
    '   • Në krye të tabelës, lart djathtas, do të shihni:',
    '     - Buton i gjelbër "Eksporto Excel" (ikona Excel)',
    '     - Buton i kaltër "Eksporto CSV" (ikona dok)',
    '   • Të dy butonët janë pranë njëri-tjetrit',
    '',
    '📸 HAPI 2: ZGJEDHJA E FORMATIT',
    'Dallimi në print-screen ndërmjet formateve:',
    '',
    '🟢 EXCEL (.xlsx) - Buton i Gjelbër:',
    '   • Formati ideal për analizë dhe modifikim',
    '   • Hapet në Microsoft Excel, LibreOffice, Google Sheets',
    '   • Mban formatimin dhe ngjyrat',
    '   • Më i mirë për raporte profesionale',
    '',
    '🔵 CSV (.csv) - Buton i Kaltër:',
    '   • Format i thjeshtë dhe universal',
    '   • Madhësi më e vogël e file-it',
    '   • I përshtatshëm për import në sisteme të tjera',
    '   • Hapet në çdo program tabele',
    '',
    '📸 HAPI 3: FILLIMI I EKSPORTIMIT',
    'Procesi në print-screen pas klikimit:',
    '   • Klikoni butonin e zgjedhur (Excel ose CSV)',
    '   • Print-screen tregon: buton bëhet gri për 1-2 sekonda',
    '   • Mesazh "Duke eksportuar..." shfaqet',
    '   • Një progress bar mund të shfaqet nëse ka shumë të dhëna',
    '',
    '📸 HAPI 4: SHKARKIMI AUTOMATIK',
    'Çfarë ndodh në print-screen gjatë shkarkimit:',
    '   • Shfletuesi tregon njoftim shkarkimi (zakonisht poshtë)',
    '   • File-i shkarkohet në folder-in Downloads',
    '   • Emri i file-it: "Pasqyra_e_Ceshtjeve_2025-08-11.xlsx/csv"',
    '   • Njoftim i gjelbër: "Eksportimi u përfundua me sukses"',
    '',
    '📸 HAPI 5: VERIFIKIMI I FILE-IT',
    'Si të kontrolloni file-in e shkarkuar:',
    '   • Hapni folder-in Downloads në kompjuter',
    '   • Kërkoni file-in me emrin "Pasqyra_e_Ceshtjeve..."',
    '   • Madhësia e file-it duhet të jetë > 0 KB',
    '   • Hapeni file-in me programin përkatës',
    '',
    '📸 PËRMBAJTJA E FILE-IT TË EKSPORTUAR:',
    'Çfarë do të shihni kur hapni file-in:',
    '   • Rreshti i parë: Headers në shqip (Nr. Rendor, Paditësi, etj.)',
    '   • Rreshtat e tjerë: Të dhënat e çështjeve',
    '   • Të gjitha fushat e disponueshme në sistem',
    '   • Formatim i pastër dhe i lexueshëm',
    '   • Data e eksportimit në emrin e file-it',
    '',
    'ZGJIDHJA E PROBLEMEVE NË EKSPORTIM:',
    '❌ Problem: Butoni nuk përgjigjet → Rifreskoni faqen',
    '❌ Problem: File-i bosh → Kontrolloni nëse ka të dhëna në tabelë',
    '❌ Problem: Nuk gjen file-in → Kontrolloni folder-in Downloads',
    '❌ Problem: File-i nuk hapet → Instaloni programin përkatës'
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
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: Create a simple PDF with basic content
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('MANUALI I PERDORUESIT', 20, 30);
    doc.setFontSize(12);
    doc.text('Sistemi i Menaxhimit te Ceshtjeve Ligjore - Albpetrol Sh.A.', 20, 50);
    doc.text('Per manualet e plota, kontaktoni mbeshtetjen teknike.', 20, 70);
    return Buffer.from(doc.output('arraybuffer'));
  }
}