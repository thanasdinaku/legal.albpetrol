export function generateSimpleManual(): string {
  const htmlContent = `
<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manuali i Përdoruesit - Sistemi i Menaxhimit të Çështjeve Ligjore</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 2.5em;
        }
        .header h2 {
            color: #64748b;
            margin: 10px 0;
            font-size: 1.5em;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h3 {
            color: #1e40af;
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
            font-size: 1.3em;
        }
        .section h4 {
            color: #374151;
            margin-top: 20px;
        }
        .steps {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .warning {
            background: #fef2f2;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
        }
        .info {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
        }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MANUALI I PËRDORUESIT</h1>
        <h2>Sistemi i Menaxhimit të Çështjeve Ligjore</h2>
        <p><strong>Albpetrol Sh.A.</strong></p>
        <p>Versioni 2.0 - Gusht 2025</p>
    </div>

    <div class="section">
        <h3>1. HYRJE NË SISTEM</h3>
        <div class="info">
            <p><strong>Sistemi i Menaxhimit të Çështjeve Ligjore</strong> është një aplikacion web i zhvilluar për të lehtësuar menaxhimin dhe organizimin e të dhënave ligjore të kompanisë Albpetrol.</p>
        </div>
        
        <h4>Karakteristikat Kryesore:</h4>
        <ul>
            <li>Menaxhimi i sigurt i të dhënave me autentifikim dy-faktorësh</li>
            <li>Ndërfaqe në gjuhën shqipe e optimizuar për përdorues profesionalë</li>
            <li>Sistem rolesh me leje të ndryshme (Përdorues të rregullt dhe Administratorë)</li>
            <li>Eksportim të dhënash në formate Excel dhe CSV</li>
            <li>Njoftimet automatike me email për të gjitha aktivitetet</li>
            <li>Ndjekja e aktivitetit të përdoruesve në kohë reale</li>
        </ul>
    </div>

    <div class="section">
        <h3>2. HYRJA NË SISTEM (LOGIN)</h3>
        <div class="steps">
            <h4>Hapat për hyrje në sistem:</h4>
            <ol>
                <li><strong>Hapja e aplikacionit:</strong> Hapni shfletuesin dhe shkruani adresën e sistemit</li>
                <li><strong>Futja e kredencialeve:</strong> Shkruani email-in dhe fjalëkalimin tuaj</li>
                <li><strong>Verifikimi dy-faktorësh:</strong> Shkruani kodin 6-shifror nga email-i</li>
                <li><strong>Qasja në sistem:</strong> Pas verifikimit do të hyni në panelin kryesor</li>
            </ol>
        </div>
        
        <div class="warning">
            <h4>Rregulla Sigurie:</h4>
            <ul>
                <li>Kodi i verifikimit skadon pas 3 minutave</li>
                <li>Mos e ndani kodin me persona të tjerë</li>
                <li>Mbyllni gjithmonë shfletuesin pas përdorimit</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h3>3. PANELI KRYESOR (DASHBOARD)</h3>
        <p>Paneli kryesor është faqja e parë që shikoni pas hyrjes në sistem dhe përmban:</p>
        
        <h4>Elementet e Panelit:</h4>
        <ul>
            <li><strong>Statistikat Kryesore:</strong> Totali i çështjeve, çështjet e sotme, aktive dhe të mbyllura</li>
            <li><strong>Aktiviteti i Fundit:</strong> Lista e 5 çështjeve të fundit të shtuar</li>
            <li><strong>Navigimi:</strong> Menu anësore për qasje të shpejtë në funksionalitete</li>
            <li><strong>Njoftimet:</strong> Mesazhet e sistemit dhe udhëzimet</li>
        </ul>
    </div>

    <div class="section">
        <h3>4. MENAXHIMI I TË DHËNAVE</h3>
        
        <h4>Fushat e të dhënave në sistem:</h4>
        <div class="info">
            <h4>Të dhënat themelore:</h4>
            <ul>
                <li>Nr. Rendor (automatik)</li>
                <li>Paditësi</li>
                <li>I Paditur</li>
                <li>Objekt</li>
            </ul>
            
            <h4>Të dhënat ligjore:</h4>
            <ul>
                <li>Nr. Lënde</li>
                <li>Data e Regjistrimit</li>
                <li>Gjykata (dropdown menu)</li>
                <li>Objekti Konkret</li>
            </ul>
            
            <h4>Përfaqësimi ligjor:</h4>
            <ul>
                <li>Avokat i Jashtëm</li>
                <li>Avokat i Brendshëm</li>
                <li>Statusi</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h3>5. SHTIMI I ÇËSHTJEVE TË REJA</h3>
        <div class="steps">
            <h4>Procesi i shtimit:</h4>
            <ol>
                <li><strong>Qasja:</strong> Klikoni "Shto Çështje të Re" nga paneli ose menu</li>
                <li><strong>Plotësimi:</strong> Plotësoni të gjitha fushat e detyrueshme (të shënuara me *)</li>
                <li><strong>Validimi:</strong> Kontrolloni që të gjitha të dhënat janë të sakta</li>
                <li><strong>Ruajtja:</strong> Klikoni "Ruaj të Dhënat" për të përfunduar</li>
            </ol>
        </div>
    </div>

    <div class="section">
        <h3>6. ROLET E PËRDORUESVE</h3>
        
        <div class="info">
            <h4>Përdorues të Rregullt:</h4>
            <ul>
                <li>Mund të shikojnë të gjitha të dhënat</li>
                <li>Mund të shtojnë çështje të reja</li>
                <li>Mund të editojnë vetëm çështjet e tyre</li>
                <li>Mund të eksportojnë të dhëna</li>
            </ul>
        </div>
        
        <div class="steps">
            <h4>Administratorët:</h4>
            <ul>
                <li>Të gjitha të drejtat e përdoruesve të rregullt</li>
                <li>Mund të editojnë dhe fshijnë çdo çështje</li>
                <li>Mund të menaxhojnë përdoruesit</li>
                <li>Mund të konfigurojnë cilësimet e sistemit</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h3>7. EKSPORTIMI I TË DHËNAVE</h3>
        <p>Sistemi ofron eksportim në dy formate:</p>
        
        <h4>Excel (.xlsx):</h4>
        <ul>
            <li>Format i përshtatshëm për analizë dhe modifikim</li>
            <li>I hapur në Microsoft Excel, LibreOffice, Google Sheets</li>
        </ul>
        
        <h4>CSV (Comma Separated Values):</h4>
        <ul>
            <li>Format universal për import në sisteme të tjera</li>
            <li>Madhësi më e vogël e file-it</li>
        </ul>
        
        <div class="steps">
            <p><strong>Për të eksportuar:</strong> Shkoni në faqen "Të Dhënat" dhe klikoni "Eksporto Excel" ose "Eksporto CSV"</p>
        </div>
    </div>

    <div class="section">
        <h3>8. NJOFTIMET ME EMAIL</h3>
        <p>Sistemi dërgon njoftimet automatike për:</p>
        <ul>
            <li><strong>Çështje të reja:</strong> Kur shtohet një çështje e re</li>
            <li><strong>Editimet:</strong> Kur modifikohet një çështje (me krahasim para/pas)</li>
            <li><strong>Fshirjet:</strong> Kur fshihet një çështje (për auditim)</li>
            <li><strong>Verifikimi 2FA:</strong> Kodet e sigurisë për hyrje</li>
        </ul>
    </div>

    <div class="section">
        <h3>9. ZGJIDHJA E PROBLEMEVE</h3>
        
        <div class="warning">
            <h4>Probleme të zakonshme:</h4>
            <ul>
                <li><strong>"Email ose fjalëkalim i gabuar":</strong> Kontrolloni shkrimin dhe kontaktoni administratorin</li>
                <li><strong>"Nuk marr kodin e verifikimit":</strong> Kontrolloni folder-in Spam</li>
                <li><strong>"Nuk mund të ruaj të dhënat":</strong> Kontrolloni fushat e kuqe (të detyrueshme)</li>
                <li><strong>"Sistemi është i ngadaltë":</strong> Mbyllni tab-a të tjera, restartoni shfletuesin</li>
            </ul>
        </div>
        
        <div class="steps">
            <h4>Hapa të përgjithshëm zgjidhje:</h4>
            <ol>
                <li>Rifreshoni faqen (Ctrl+F5)</li>
                <li>Logout dhe login përsëri</li>
                <li>Provoni një shfletues tjetër</li>
                <li>Kontrolloni lidhjen me internetin</li>
                <li>Kontaktoni mbështetjen teknike</li>
            </ol>
        </div>
    </div>

    <div class="section">
        <h3>10. KONTAKTI DHE MBËSHTETJA</h3>
        
        <div class="info">
            <h4>Mbështetja Teknike:</h4>
            <ul>
                <li><strong>Email:</strong> it.system@albpetrol.al</li>
                <li><strong>Orari:</strong> E Hënë - E Premte, 08:00 - 17:00</li>
            </ul>
            
            <h4>Prioritetet e mbështetjes:</h4>
            <ul>
                <li><strong>URGJENT:</strong> Pamundësi hyrje në sistem (2 orë)</li>
                <li><strong>I LARTË:</strong> Humbje të dhënash (1 ditë pune)</li>
                <li><strong>NORMAL:</strong> Probleme performancë (2-3 ditë pune)</li>
                <li><strong>I ULËT:</strong> Kërkesa për përmirësime (1 javë)</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>Sistemi i Menaxhimit të Çështjeve Ligjore - Versioni 2.0</strong></p>
        <p>© 2025 Albpetrol Sh.A. - Të gjitha të drejtat të rezervuara</p>
        <p><em>Faleminderit që përdorni sistemin tonë!</em></p>
    </div>
</body>
</html>
  `;
  
  return htmlContent;
}