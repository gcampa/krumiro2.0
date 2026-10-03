# Modello di sicurezza — outatime → QR → krumiro2.0

Stato: **F0 — riscritto il 2026-10-03 per il trasferimento offline con QR (Q16-B, D19).** La versione per
Firebase è nella storia git (commit `069c21e`). Ogni controllo ha un codice S<n> che task e checklist citano.

## 1. Cosa proteggiamo

| Bene | Perché conta |
|---|---|
| Orari di entrata/uscita | dato personale; rivela presenze, permessi, abitudini |
| Rispetto delle regole aziendali | il trasferimento a un servizio personale è vietato (Q1): il rischio più alto è questo |
| Integrità dei dati in krumiro2.0 | un QR falso o vecchio non deve alterare le giornate |
| Credenziali del portale | **fuori perimetro: outatime non le legge, non le salva, non le trasmette** |

## 2. Chi può attaccare

| Attore | Capacità |
|---|---|
| Chi vede lo schermo del PC | fotografa il QR |
| Chi mostra un QR al telefono | prova a far importare dati falsi |
| Rete aziendale | il portale è in **HTTP**: può alterare la pagina che outatime legge |
| Altre estensioni / pagine | provano a parlare con outatime |
| Catena di fornitura | pacchetto npm compromesso (libreria QR, build) |
| Telefono sbloccato in mano ad altri | vede i dati come oggi |

## 3. Controlli

### Nessun canale di rete
- **S1 — outatime senza rete esterna**: `host_permissions` solo sull'host del portale; nessuna `fetch` verso altri
  host; nessun SDK di terze parti con telemetria. Verifica in F6: nessuna richiesta di rete di outatime (scheda
  Network del service worker).
- **S2 — krumiro2.0 non invia dati**: la lettura del QR avviene nel browser; nessuna chiamata di rete nuova.

### Riservatezza e autenticità del QR
- **S3 — Cifratura autenticata** AES-256-GCM (WebCrypto, nessuna libreria), IV casuale di 12 byte per ogni QR.
  Chi fotografa il QR non legge nulla; un QR modificato o prodotto da altri non si decifra e viene rifiutato.
- **S4 — Chiave mai in chiaro**: `CryptoKey` con `extractable: false` in IndexedDB, su PC e telefono. Origine della
  chiave (passphrase PBKDF2-SHA256 600 000 iterazioni, oppure chiave casuale a 256 bit passata una volta con un QR
  di abbinamento) da decidere nel P di F4 (Q23).
- **S5 — QR vecchi rifiutati**: `lettoIl` non più vecchio dell'ultimo importato per la stessa data; avviso se il QR
  ha più di 12 ore.
- **S6 — QR visibile solo quando serve**: si mostra su richiesta e si nasconde dopo 60 s (modalità esatta nel P di
  F4).

### Estensione outatime
- **S7 — Permessi minimi** (MV3): content script solo su `http://172.16.0.32/*`, nessun `externally_connectable`;
  `scripting`/`activeTab` tolti se il content script li rende inutili.
- **S8 — Solo codice impacchettato** (regola MV3), CSP predefinita non allentata, versioni esatte delle
  dipendenze.
- **S9 — Parsing difensivo**: solo `HH:MM` validi e diciture note, al massimo 31 giorni × 20 timbrature; nessun
  `innerHTML` in scrittura sulla pagina del portale; nessun codice della pagina eseguito.
- **S10 — Niente log di dati**: via `console.log(report)`; log solo di esiti.

### krumiro2.0
- **S11 — Validazione all'ingresso**: tutto ciò che arriva da QR o inserimento manuale passa dalla stessa
  validazione di `normalizzaGiornata` (orari 0–1439, date valide, tipi noti).
- **S12 — Annulla**: ogni import salva la giornata precedente e offre *Annulla* (D15).
- **S13 — Fotocamera solo su richiesta**: si accende al tocco di "Leggi QR", si spegne alla lettura, alla chiusura o
  dopo 30 s.
- **S14 — Content Security Policy** con `<meta http-equiv>`: `default-src 'self'`, nessun `connect-src` esterno.

### Processo
- **S15 — Nessun dato reale nel repository**: HTML del portale solo sintetico.
- **S16 — `npm audit --omit=dev` pulito** alla chiusura di ogni fase; versioni esatte.
- **S17 — Revisione di sicurezza** in F6 con questa lista come checklist.

## 4. Matrice minacce → controlli

| Minaccia | Controlli | Esito |
|---|---|---|
| Violazione delle regole aziendali sul trasferimento dei dati | S1, S2 | nessun dato esce in rete; solo lo schermo che già guardi |
| Foto del QR | S3, S4, S6 | testo cifrato, visibile per poco |
| QR falso mostrato al telefono | S3, S11 | rifiutato |
| QR vecchio riproposto | S5 | rifiutato o segnalato |
| Pagina del portale alterata in rete | S9, S11 | al massimo orari falsi, correggibili; nessun codice eseguito |
| Altra estensione | S7 | nessun canale esposto |
| Pacchetto compromesso | S8, S16 | versioni esatte, audit, nessun codice remoto |

## 5. Rischi residui (da accettare in R-F0)

- **Integrità dal portale HTTP**: se la pagina viene alterata sulla rete aziendale, outatime cifra orari falsi.
  krumiro2.0 mostra l'origine "portale" e permette di correggere.
- **Installazione sul PC aziendale**: hai confermato (Q1) che puoi installare un'estensione non pubblicata; outatime
  1.0 non trasmette nulla in rete, ma resta software tuo su un PC gestito.
- **Chiave**: se è una passphrase, la sicurezza di S3 dipende dalla sua robustezza (Q23).
