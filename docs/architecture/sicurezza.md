# Modello di sicurezza — integrazione outatime / Firebase / krumiro2.0

Stato: **bozza F0 — SOSPESA il 2026-10-03** (Q16). Con D18 decadono S19–S21 e S23. Il primo rischio del piano
non è tecnico: è la violazione delle regole aziendali (§ 6). Requisito dell'utente: "assolutamente sicuro". Nessun
sistema lo è in assoluto: questo documento dice **da cosa** ci si protegge, **come**, e quali **rischi residui** si
accettano esplicitamente (§ 6). Ogni controllo ha un codice S<n> che task e checklist citano.

## 1. Cosa proteggiamo

| Bene | Perché conta |
|---|---|
| Orari di entrata/uscita dell'utente | dato personale; rivela abitudini, presenze, permessi |
| Account Google del proprietario | dà accesso al progetto Firebase e ai dati |
| Progetto Firebase (configurazione, regole, fatturazione) | chi lo controlla legge/scrive/cancella e può generare costi |
| Telefono dell'utente (notifiche) | una notifica falsa o insistente è un fastidio o un phishing |
| Credenziali del portale aziendale | **fuori perimetro: outatime non le legge, non le salva, non le trasmette mai** |

## 2. Chi può attaccare

| Attore | Capacità ragionevole |
|---|---|
| Internet | conosce la configurazione web di Firebase (è pubblica nella PWA e nell'estensione), può chiamare le API |
| Altro utente Google | può tentare di registrarsi al progetto e leggere/scrivere |
| Google/Firebase (o chi ne compromette i server) | vede tutto ciò che è salvato in chiaro e i metadati |
| Rete aziendale | il portale è in **HTTP** in chiaro: chi è sulla rete può alterare la pagina che outatime legge |
| Altre estensioni / pagine | possono provare a mandare messaggi al service worker di outatime |
| Catena di fornitura | un pacchetto npm compromesso nella build |
| Furto del telefono o del PC sbloccato | accesso alla sessione già autenticata |

## 3. Controlli

### Identità e accesso
- **S1 — Solo login Google** sul progetto Firebase; tutti gli altri provider disattivati.
- **S2 — Registrazione chiusa**: dopo il primo accesso del proprietario, in *Authentication → Settings → User
  actions* si disattiva "Enable create (sign-up)". Protezione da enumerazione email attiva.
- **S3 — Allowlist nelle regole**: oltre a `request.auth.uid == uid`, l'UID deve essere nell'elenco esplicito del
  proprietario (anche se S2 venisse riaperta per errore, un nuovo utente non vede nulla, nemmeno il suo ramo).
- **S4 — Account Google del proprietario con verifica in due passaggi** (chiave di sicurezza o app); il progetto
  Firebase ha un solo membro IAM (Owner = proprietario).

### Regole Firestore (bozza da far diventare `firebase/firestore.rules` in F2)
- **S5 — Nega tutto per default**, consenti solo i percorsi elencati, con **validazione dello schema** (chiavi
  esatte, tipi, dimensioni, `aggiornatoIl == request.time`).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function proprietario(uid) {
      return request.auth != null
        && request.auth.uid == uid
        && request.auth.token.firebase.sign_in_provider == 'google.com'
        && request.auth.token.email_verified == true
        && uid in ['<UID_DEL_PROPRIETARIO>'];
    }
    function b64(s, min, max) { return s is string && s.size() >= min && s.size() <= max; }
    function cifrato(d) { return d.v == 1 && b64(d.iv, 16, 16) && b64(d.ct, 24, 4096); }

    match /utenti/{uid} {
      allow read: if proprietario(uid);
      allow create, update: if proprietario(uid)
        && request.resource.data.keys().hasOnly(['v', 'kdf', 'verifica'])
        && request.resource.data.kdf.iter >= 600000
        && cifrato(request.resource.data.verifica);

      match /giornate/{data} {
        allow read, delete: if proprietario(uid);
        allow create, update: if proprietario(uid)
          && data.matches('^20[0-9]{2}-[01][0-9]-[0-3][0-9]$')
          && request.resource.data.keys().hasOnly(['v', 'iv', 'ct', 'aggiornatoIl', 'scadeIl'])
          && cifrato(request.resource.data)
          && request.resource.data.aggiornatoIl == request.time
          && request.resource.data.scadeIl is timestamp;
      }
      match /dispositivi/{id} {
        allow read, delete: if proprietario(uid);
        allow create, update: if proprietario(uid)
          && request.resource.data.keys().hasOnly(['token', 'creatoIl', 'ultimoUsoIl', 'scadeIl'])
          && request.resource.data.token is string && request.resource.data.token.size() <= 4096;
      }
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```
- **S6 — Test delle regole sull'emulatore** (`@firebase/rules-unit-testing`) in CI: anonimo, altro UID, UID non in
  allowlist, provider diverso da Google, chiavi in più, `ct` troppo lungo, data malformata, `aggiornatoIl` falso →
  tutti **negati**; proprietario con documento valido → consentito. Nessun deploy di regole senza suite verde.

### Riservatezza dei dati
- **S7 — Cifratura end-to-end** AES-256-GCM (WebCrypto, nessuna libreria). Chiave derivata dalla **passphrase**
  dell'utente con PBKDF2-SHA256, 600 000 iterazioni (minimo OWASP 2023), sale casuale di 16 byte nel profilo.
  IV casuale di 12 byte per ogni scrittura; AAD = `uid/data`.
- **S8 — Chiave mai esportabile né salvata in chiaro**: `CryptoKey` con `extractable: false` conservata in
  IndexedDB (PWA e estensione). La passphrase non si salva da nessuna parte e non si invia mai in rete.
- **S9 — Minimizzazione**: solo data, minuti, verso, flag smart (contratto § 5.1). Niente nome, matricola, URL,
  HTML, cookie. Conservazione 90 giorni con TTL di Firestore (`scadeIl`).
- **S10 — Dati in UE**: Firestore e Cloud Function in `europe-west8` (Milano) o `eur3`, deciso in Q9.

### Estensione outatime
- **S11 — Permessi minimi**: `host_permissions` solo sul percorso del cartellino del portale e sugli host Firebase
  necessari; via `scripting`/`activeTab` se il content script dichiarato li rende inutili (decisione nel P di F3).
- **S12 — Solo codice incluso nel pacchetto** (regola MV3): SDK Firebase impacchettato con versione esatta, nessuno
  script remoto, CSP predefinita di MV3 non allentata.
- **S13 — Messaggi verificati**: il service worker accetta solo `chrome.runtime.onMessage` con
  `sender.id === chrome.runtime.id` e `sender.url` sul portale; nessun `externally_connectable`.
- **S14 — Parsing difensivo**: la pagina del portale è HTTP e può essere alterata in rete (§ 2). Il parser accetta
  solo `HH:MM` validi e le diciture note, massimo 31 giorni × 20 timbrature, scarta il resto e non esegue nulla
  della pagina; non usa `innerHTML` in scrittura sul portale.
- **S15 — Niente log di dati**: via `console.log(report)`; log solo di esiti ("3 giorni sincronizzati").

### PWA krumiro2.0
- **S16 — Content Security Policy** con `<meta http-equiv>` (GitHub Pages non permette intestazioni):
  `default-src 'self'`, `connect-src` limitato agli host Firebase usati, niente `unsafe-eval`.
- **S17 — Firebase caricato solo se la sincronizzazione è attiva** (import dinamico): chi non la usa non scarica e
  non esegue l'SDK.
- **S18 — Disconnessione e cancellazione**: *Impostazioni → Sincronizzazione → Disconnetti* fa logout, cancella la
  chiave locale e il token del dispositivo; *Cancella dati sul server* elimina `giornate` e `dispositivi`.

### Notifiche
- **S19 — Credenziali di invio solo lato server**: la Cloud Function usa l'identità del progetto; nessuna chiave di
  servizio in repository, estensione o PWA.
- **S20 — Notifica senza contenuto**: testo fisso "Timbrature aggiornate"; un attaccante che riuscisse a inviare
  notifiche non può mostrare orari "veri" e non c'è nessun link esterno (il clic apre solo `start_url`).
- **S21 — Token del dispositivo** con scadenza (60 giorni senza uso → cancellato dalla funzione); token rifiutati da
  FCM cancellati subito.

### Chiavi API, quote, costi
- **S22 — Chiave API web limitata** in Google Cloud Console alle sole API usate (Identity Toolkit, Secure Token,
  Firestore, FCM Registration) e, per la PWA, al referrer del dominio GitHub Pages. La chiave **non è un segreto**:
  la sicurezza sta in S1–S5, non nel nasconderla.
- **S23 — Budget con avviso** (es. 1 €) sul conto di fatturazione se il piano è Blaze (Q8).

### Catena di fornitura e processo
- **S24 — Versioni esatte** di `firebase`, `firebase-functions`, `firebase-admin`, `@firebase/rules-unit-testing`;
  `npm ci`; `npm audit --omit=dev` pulito alla chiusura di ogni fase.
- **S25 — Nessun dato reale nel repository**: le prove del parser usano HTML **sintetico** ricostruito dalla
  struttura del portale, mai una pagina reale salvata.
- **S26 — Revisione di sicurezza** obbligatoria in Fn (consolidamento) con questa lista come checklist.

## 4. Matrice minacce → controlli

| Minaccia | Controlli | Esito |
|---|---|---|
| Uno sconosciuto si registra e legge i miei dati | S2, S3, S5, S6, S7 | negato dalle regole; anche se passasse, legge solo testo cifrato |
| Furto della configurazione Firebase dalla PWA | S5, S22 | inutile senza login del proprietario |
| Google/Firebase legge i dati | S7, S8, S9 | vede solo `ct`; restano visibili data del giorno e istante di scrittura (§ 6) |
| Pagina del portale alterata in rete | S14, S5 (schema) | al massimo orari falsi in krumiro2.0, nessun codice eseguito |
| Altra estensione manda dati falsi a outatime | S13 | messaggi rifiutati |
| Notifiche false | S19, S20, S21 | serve compromettere il progetto; il testo non porta dati né link |
| Pacchetto npm compromesso | S12, S24 | versioni esatte, audit, nessun codice remoto |
| Telefono o PC rubato e sbloccato | S8, S18 | accesso come il proprietario finché non si disconnette da un altro dispositivo (Q10) |
| Costi imprevisti | S23, quote | avviso a soglia minima |

## 5. Configurazione manuale (la fa il proprietario, con checklist in F2)

1. Crea progetto Firebase dedicato (nessun altro uso), regione UE (S10).
2. Authentication: abilita solo Google (S1); protezione enumerazione email.
3. Primo accesso del proprietario dalla PWA in locale → annota l'UID → inseriscilo nell'allowlist (S3) → chiudi la
   registrazione (S2).
4. Firestore in modalità produzione; deploy delle regole solo da `firebase/` dopo i test (S6).
5. Politica TTL su `giornate.scadeIl` e `dispositivi.scadeIl` (S9, S21).
6. Chiavi API limitate (S22); budget e avviso (S23).
7. Account Google con 2FA (S4).

## 6. Rischi residui (da accettare esplicitamente in plenaria)

- **Metadati visibili** a Google: quali giorni hanno dati e l'istante dell'ultima scrittura (≈ quando si è aperto il
  portale dopo una timbratura).
- **Integrità dal portale**: se la pagina HTTP viene alterata sulla rete aziendale, outatime trasmette orari falsi
  (cifrati e autentici dal punto di vista di krumiro2.0). Mitigazione: krumiro2.0 mostra sempre l'origine
  "portale" e permette di correggere.
- **Passphrase debole**: la sicurezza di S7 dipende da lei. Minimo imposto: 12 caratteri (Q4).
- **Politiche aziendali**: verificato il 2026-10-03 (Q1): le regole interne **non** permettono di portare i dati di
  presenza su un servizio personale. Rischio **non accettabile** senza autorizzazione scritta (Q16-A); con il
  trasferimento offline via QR (Q16-B) il rischio non si presenta.
