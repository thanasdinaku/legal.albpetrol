# Manual i Detajuar i Përdoruesit - Sistemi i Menaxhimit të Çështjeve Ligjore Albpetrol

## Përmbajtja

1. [Hyrje në Sistem](#1-hyrje-në-sistem)
2. [Dashboard Kryesor](#2-dashboard-kryesor)
3. [Menaxhimi i Çështjeve](#3-menaxhimi-i-çështjeve)
4. [Tabela e të Dhënave](#4-tabela-e-të-dhënave)
5. [Eksportimi i të Dhënave](#5-eksportimi-i-të-dhënave)
6. [Menaxhimi i Përdoruesve (Admin)](#6-menaxhimi-i-përdoruesve-admin)
7. [Cilësimet e Sistemit](#7-cilësimet-e-sistemit)
8. [Email Njoftimet](#8-email-njoftimet)
9. [Siguria dhe Fjalëkalimet](#9-siguria-dhe-fjalëkalimet)
10. [Problemet e Zakonshme](#10-problemet-e-zakonshme)

---

## 1. Hyrje në Sistem

### 1.1 Aksesi në Sistem
- **URL Lokal**: `https://10.5.20.31`
- **URL Publik**: `https://legal.albpetrol.al`

### 1.2 Procesi i Identifikimit

#### Hapi 1: Faqja e Hyrjes
1. Hapni naviguesin dhe shkruani adresën e sistemit
2. Do të shfaqet faqja e hyrjes me logon e Albpetrol
3. Fushat e kërkuara:
   - **Adresa e Email-it**: Shkruani email-in tuaj të regjistruar
   - **Fjalëkalimi**: Shkruani fjalëkalimin tuaj

#### Hapi 2: Verifikimi me Dy Faktorë (2FA)
1. Pas shtypjes së butonit "Kyçu", do të dërgohet një kod verifikimi në email
2. Kontrolloni kutinë e postës suaj (dhe spam folder)
3. Shkruani kodin 6-shifror në fushën e verifikimit
4. Shtypni "Verifiko" për të hyrë në sistem

### 1.3 Llojet e Përdoruesve
- **Administrator**: Aksesi i plotë në të gjitha funksionet
- **Përdorues i Rregullt**: Mund të shikojë të gjitha çështjet, por vetëm të editojë/fshijë çështjet e veta

---

## 2. Dashboard Kryesor

### 2.1 Përmbledhja e Statistikave
Në krye të dashboard-it shfaqen:
- **Totali i Çështjeve**: Numri i përgjithshëm i çështjeve të regjistruara
- **Çështjet e Sotme**: Çështjet e shtuar sot
- **Çështjet Aktive**: Çështjet që janë në proces
- **Çështjet e Mbyllura**: Çështjet e përfunduara

### 2.2 Aktiviteti i Fundit
Shfaq një listë të aktiviteteve të fundit në sistem:
- Çështjet e shtuar së fundmi
- Ndryshimet e bëra
- Përdoruesit që kanë qenë aktiv

### 2.3 Navigimi
Menuja anësore përmban:
- **Dashboard**: Faqja kryesore
- **Shtimi i Çështjes**: Për të shtuar çështje të reja
- **Tabela e të Dhënave**: Për të parë të gjitha çështjet
- **Menaxhimi i Përdoruesve**: (Vetëm për administratorë)
- **Cilësimet**: Cilësimet personale dhe të sistemit

---

## 3. Menaxhimi i Çështjeve

### 3.1 Shtimi i Çështjes së Re

#### Hapi 1: Aksesi në Formular
1. Klikoni "Shtimi i Çështjes" në menunë anësore
2. Do të hapet formulari i plotë i regjistrimit

#### Hapi 2: Plotësimi i të Dhënave Bazë
**Informacionet e Përgjithshme:**
- **Nr. Rendor**: Automatikisht i gjeneruar nga sistemi
- **Emri i Palës**: Emri i plotë i palës së interesuar
- **Objekti i Çështjes**: Përshkrim i shkurtër i çështjes
- **Lloji i Çështjes**: Zgjidhni nga lista dropdown

#### Hapi 3: të Dhënat e Gjykatës
**Gjykata:**
- Zgjidhni gjykatën përkatëse nga dropdown menu:
  - Gjykata e Apelit Tiranë
  - Gjykata e Shkallës së Parë Tiranë
  - Gjykata e Apelit Durrës
  - Gjykata e Shkallës së Parë Durrës
  - Etj.

**të Dhënat e Procesit:**
- **Nr. i Çështjes së Gjykatës**: Numri zyrtar i gjykatës
- **Data e Fillimit**: Data kur ka filluar çështja
- **Data e Fundit të Seancës**: Data e seancës së fundit
- **Data e Seancës së Ardhshme**: Nëse ka seancë të planifikuar

#### Hapi 4: Status dhe Prioriteti
- **Statusi**: Zgjidhni statusin aktual (Në Proces, E Mbyllur, E Pezulluar)
- **Prioriteti**: I ulët, Mesatar, I lartë, Kritik

#### Hapi 5: Përshkrimi i Detajuar
- **Përshkrimi**: Shkruani një përshkrim të plotë të çështjes
- **Komentet**: Shënime shtesë ose komente

#### Hapi 6: Ruajtja
1. Kontrolloni të gjitha fushat për saktësi
2. Klikoni "Ruaj Çështjen"
3. Sistemi do të shfaqë një mesazh konfirmimi
4. Email njoftimi do të dërgohet automatikisht (nëse është aktivizuar)

### 3.2 Editimi i Çështjes

#### Aksesi në Editim
1. Shkoni te "Tabela e të Dhënave"
2. Gjeni çështjen që doni të editoni
3. Klikoni butonin "Edito" në kolonën e veprimeve

#### Ndryshimi i të Dhënave
1. Ndryshoni fushat e dëshiruara
2. Sistemi do të regjistroj automatikisht:
   - Kush e bëri ndryshimin
   - Kur u bë ndryshimi
   - Cilat fusha u ndryshuan
3. Klikoni "Ruaj Ndryshimet"

### 3.3 Shikimi i Çështjes (Read-Only)
1. Klikoni butonin "Shiko" për të parë detajet pa mundësinë e editimit
2. Shfaqen të gjitha informacionet në një modal
3. Përdoruesit e rregullt mund të shohin vetëm çështjet që nuk janë të tyret

---

## 4. Tabela e të Dhënave

### 4.1 Shikimi i të Dhënave
Tabela shfaq të gjitha çështjet me kolonat:
- Nr. Rendor
- Emri i Palës
- Objekti i Çështjes
- Gjykata
- Statusi
- Data e Krijimit
- Veprimet (Shiko/Edito/Fshi)

### 4.2 Filtrat dhe Kërkimi
**Kërkimi i Shpejtë:**
- Kutia e kërkimit filtron të gjitha kolonat
- Shkruani çfarëdo termi për të gjetur çështjet përkatëse

**Navigimi në Faqe:**
- Sistemi shfaq 10 çështje për faqe
- Përdorni butonat "Mëparshme/Tjetër" për të naviguar

### 4.3 Veprimet mbi Çështjet

#### Për Përdoruesit e Rregullt:
- **Shiko**: Mund të shohin të gjitha çështjet
- **Edito**: Vetëm çështjet e veta
- **Fshi**: Nuk kanë të drejtë fshirjeje

#### Për Administratorët:
- **Shiko/Edito/Fshi**: Të gjitha çështjet pa kufizim

---

## 5. Eksportimi i të Dhënave

### 5.1 Eksporti Excel
1. Shkoni te "Tabela e të Dhënave"
2. Klikoni butonin "Eksporto Excel"
3. Fajli do të shkarkohet automatikisht
4. Emri i fajlit: `cesjtje_ligjore_YYYY-MM-DD.xlsx`

### 5.2 Eksporti CSV
1. Klikoni butonin "Eksporto CSV"
2. Fajli do të shkarkohet si `.csv`
3. Mund të hapet me Excel ose aplikacione të tjera

### 5.3 Përmbajtja e Eksportit
Fajllat e eksportuar përmbajnë:
- Të gjitha fushat e çështjeve
- Headers në gjuhën shqipe
- Formatimi i duhur i datave
- Kодировка UTF-8 për karakteret shqipe

---

## 6. Menaxhimi i Përdoruesve (Admin)

### 6.1 Shtimi i Përdoruesit të Ri
1. Shkoni te "Menaxhimi i Përdoruesve"
2. Klikoni "Shto Përdorues të Ri"
3. Plotësoni:
   - **Email-i**: Adresa e email-it (do të jetë username)
   - **Emri**: Emri i përdoruesit
   - **Mbiemri**: Mbiemri i përdoruesit
   - **Roli**: Përdorues ose Administrator
4. Sistemi gjeneron një fjalëkalim të përkohshëm
5. Dërgoni të dhënat te përdoruesi i ri

### 6.2 Menaxhimi i Roleve
**Ndryshimi i Rolit:**
1. Në listën e përdoruesve, klikoni dropdown-in e rolit
2. Zgjidhni rolin e ri (User/Admin)
3. Ndryshimi aplikohet menjëherë

### 6.3 Fshirja e Përdoruesve
1. Klikoni butonin "Fshi" pranë përdoruesit
2. Konfirmoni fshirjen
3. **Kujdes**: Përdoruesi default `it.system@albpetrol.al` nuk mund të fshihet

---

## 7. Cilësimet e Sistemit

### 7.1 Ndryshimi i Fjalëkalimit
1. Shkoni te "Cilësimet"
2. Seksioni "Ndryshoni Fjalëkalimin"
3. Plotësoni:
   - Fjalëkalimi aktual
   - Fjalëkalimi i ri
   - Konfirmimi i fjalëkalimit të ri
4. Klikoni "Ruaj Ndryshimet"

#### Kërkesat për Fjalëkalimin:
- Minimumi 8 karaktere
- Të paktën një shkronjë të madhe
- Të paktën një numër
- Të paktën një karakter special (!@#$%^&*)

### 7.2 Cilësimet e Sistemit (Admin)
**Statistikat e Bazës së të Dhënave:**
- Numri total i përdoruesve
- Numri total i çështjeve
- Madhësia e bazës së të dhënave

**Politika e Fjalëkalimeve:**
- Shfaqet politika aktuale e fjalëkalimeve
- Nuk mund të ndryshohet nga ndërfaqja (për siguri)

---

## 8. Email Njoftimet

### 8.1 Konfigurimi (Admin)
1. Shkoni te "Cilësimet e Sistemit"
2. Seksioni "Email Njoftimet"
3. Aktivizoni/ç'aktivizoni njoftimet
4. Shtoni email adresat për marrjen e njoftimeve
5. Testoni konfigurimin me butonin "Testo Email"

### 8.2 Llojet e Njoftimeve

#### Çështje e Re
- Dërgohet kur krijohet çështje e re
- Përmban të gjitha detajet e çështjes
- Numri rendor automatik

#### Editimi i Çështjes
- Dërgohet kur ndryshohet çështje ekzistuese
- Shfaq krahasimin "Para/Pas" ndryshimit
- Detajet e ndryshimeve

#### Fshirja e Çështjes
- Dërgohet kur fshihet çështje
- Përmban të gjitha të dhënat e çështjes së fshirë
- Për auditim dhe rikuperim

### 8.3 Formati i Email-eve
- Subject në shqip me identifikues të qartë
- Përmbajtje e strukturuar në HTML
- Logo e Albpetrol në header
- Nënshkrim profesional

---

## 9. Siguria dhe Fjalëkalimet

### 9.1 Verifikimi me Dy Faktorë (2FA)
**Për të gjithë përdoruesit (përfshi administratorët):**
- Çdo hyrje kërkon kod verifikimi
- Kodi dërgohet në email
- Skadimi i kodit: 3 minuta
- Ri-dërgimi i kodit: Pasi të skadojë i pari

### 9.2 Sesionet dhe Siguria
- **Kohëzgjatja e sesionit**: 7 ditë
- **Logout automatik**: Pas inaktivitetit të gjatë
- **Cookies të sigurt**: HTTPOnly dhe Secure flags
- **Mbrojtja nga CSRF**: Token-a të sigur

### 9.3 Kontrolli i Aksesit
**Rate Limiting:**
- Maksimumi 100 kërkesa për 15 minuta (të gjitha endpoint-et)
- Maksimumi 50 kërkesa për 15 minuta (endpoint-et sensitive)

**Mbrojtja nga sulmete:**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict Transport Security (HSTS)

---

## 10. Problemet e Zakonshme

### 10.1 Probleme me Hyrjen

#### Problem: "Email ose fjalëkalim i gabuar"
**Zgjidhja:**
1. Kontrolloni saktësinë e email-it
2. Sigurohuni që fjalëkalimi është i saktë
3. Kontaktoni administratorin për rivendosje

#### Problem: "Shumë kërkesa, provoni më vonë"
**Zgjidhja:**
1. Prisni 15 minuta
2. Shmangni kliket e shumta të njëpasnjëshme
3. Rifresko faqen dhe provoni përsëri

### 10.2 Probleme me Email Verifikimin

#### Problem: Nuk po marr kodin e verifikimit
**Zgjidhja:**
1. Kontrolloni spam folder-in
2. Prisni disa minuta (mund të ketë vonesë)
3. Provoni të ri-dërgoni kodin
4. Kontaktoni IT support nëse problemi vazhdon

#### Problem: Kodi është skaduar
**Zgjidhja:**
1. Kthehuni në faqen e hyrjes
2. Ribëni login-in për kod të ri
3. Shkruani kodin brenda 3 minutave

### 10.3 Probleme me Formularët

#### Problem: Formulari nuk ruhet
**Zgjidhja:**
1. Kontrolloni që të gjitha fushat e detyrueshme janë plotësuar
2. Sigurohuni që datat janë në formatin e saktë
3. Rifresko faqen dhe provoni përsëri

#### Problem: Lista dropdown nuk punon
**Zgjidhja:**
1. Rifresko faqen
2. Kontrolloni lidhjen me internetin
3. Provoni një navigator tjetër

### 10.4 Probleme me Eksportimin

#### Problem: Fajlli nuk shkarkohet
**Zgjidhja:**
1. Kontrolloni cilësimet e browser-it për shkarkime
2. Çaktivizoni ad-blocker-ët për këtë faqe
3. Provoni një navigator tjetër

### 10.5 Probleme me Performance

#### Problem: Sistemi është i ngadaltë
**Zgjidhja:**
1. Kontrolloni lidhjen me internetin
2. Mbyllni tab-a të tjera të panevojshme
3. Rifresko faqen
4. Kontaktoni IT support nëse problemi vazhdon

---

## Kontakti për Mbështetje

**Email Teknik**: it.system@albpetrol.al  
**Linja e Ndihmës**: [Numri i telefonit]

**Raporti i Problemeve të Sigurisë**:
- Email: it.system@albpetrol.al
- Subject: [SECURITY] Problema e Sigurisë

---

*Manual i përditësuar më: 13 Gusht 2025*  
*Versioni: 2.0*  
*© 2025 Albpetrol - Sistemi i Menaxhimit të Çështjeve Ligjore*