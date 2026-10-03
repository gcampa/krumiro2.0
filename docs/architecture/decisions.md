# Registro decisioni

Ogni voce è definitiva finché una nuova voce non la sostituisce esplicitamente. Le voci con **Stato: proposta**
non valgono finché l'utente non le approva in plenaria (punto fisso 13): l'approvazione cambia lo stato in
"approvata il <data>" senza riscrivere il testo; un cambiamento crea una nuova voce.

---

## Rilevate all'adozione (2026-10-03)

## D1 — Stack di krumiro2.0
**Stato**: rilevata all'adozione.
**Decisione**: TypeScript 5.9 senza framework (helper `el()` in `src/ui/dom.ts`), Vite 8, vite-plugin-pwa 1.3
(`generateSW`), Vitest 5, Node.js 22.
**Motivo**: scelta già incorporata nel codice (`package.json`, `vite.config.ts`).
**Conseguenze**: nessuna nuova dipendenza senza una decisione; le funzioni nuove seguono la struttura
`src/core` (logica pura) · `src/storage` · `src/ui`.

## D2 — Dati locali versionati
**Stato**: rilevata all'adozione.
**Decisione**: dati in `localStorage` chiave `timbrature`, `version: 1`; ogni cambio di forma passa da
`MIGRAZIONI` in `src/storage/migrazioni.ts`; un campo **opzionale** nuovo non cambia `VERSIONE_CORRENTE` ma va
conservato e validato in `normalizza` (precedente: `Evento.sigaretta`).
**Motivo**: codice e README esistenti.
**Conseguenze**: `Evento.origine` (D15) segue questa regola.

## D3 — Lingua
**Stato**: rilevata all'adozione.
**Decisione**: testi dell'interfaccia, nomi di funzioni e variabili, commenti e documenti in italiano.
**Motivo**: convenzione di tutto il codice esistente.
**Conseguenze**: vale anche per le parti nuove di outatime (F4); il codice esistente di outatime v0.2.3 ha nomi in inglese e resta com'è.

## D4 — Deploy
**Stato**: rilevata all'adozione.
**Decisione**: GitHub Pages da `main` con `.github/workflows/deploy.yml` (test + build); `base` `/krumiro2.0/`.
**Motivo**: workflow esistente.
**Conseguenze**: nessun header HTTP configurabile (CSP via `<meta>`, S16); l'origine del deploy è un punto aperto
(Q3).

## D5 — Lavoro chiuso prima dell'adozione
**Stato**: rilevata all'adozione.
**Decisione**: calcolo, PWA, aiuto, tema scuro, banner di installazione e pausa sigaretta (piani in
`docs/superpowers/`) sono una fase "chiusa prima dell'adozione", versione 1.5.0, baseline 92 test.
**Motivo**: § Adozione della skill: la storia non si riscrive.
**Conseguenze**: `docs/superpowers/` resta come archivio; i piani nuovi stanno in `docs/implementation/`.

---

## Proposte per l'integrazione outatime (2026-10-03)

Dettaglio in [integrazione-outatime.md](integrazione-outatime.md) e [sicurezza.md](sicurezza.md).

## D6 — Cifratura end-to-end con passphrase
**Stato**: approvata il 2026-10-03 (Q4). Con l'opzione B di Q16 si applica al contenuto del QR.
**Decisione**: i dati su Firestore sono solo AES-256-GCM; chiave da passphrase (PBKDF2-SHA256, 600 000
iterazioni), mai salvata in chiaro né inviata; minimo 12 caratteri.
**Motivo**: "assolutamente sicuro" — le regole Firestore proteggono dagli estranei, la cifratura anche da un
errore di configurazione e dal fornitore.
**Conseguenze**: notifiche senza contenuto (S20); la passphrase si inserisce una volta su PC e una su telefono;
persa la passphrase si azzera il ramo e si risincronizza dal portale (D7).

## D7 — Il portale è la fonte di verità
**Stato**: proposta.
**Decisione**: Firebase è un canale di trasporto, non un archivio: i dati si possono cancellare e vengono
ricreati alla prossima apertura del portale; il backup resta quello di krumiro2.0.
**Motivo**: riduce il valore dei dati sul server e semplifica recupero e rotazione delle chiavi.
**Conseguenze**: conservazione breve (D13); nessuna sincronizzazione da krumiro2.0 verso Firebase.

## D8 — Firebase come backend
**Stato**: ~~proposta~~ scartata il 2026-10-03: le regole aziendali non permettono il trasferimento dei dati a
un servizio personale (Q1 → Q16); sostituita da D19.
**Decisione**: Authentication (solo Google), Firestore, Cloud Functions 2ª gen., Cloud Messaging, in un progetto
dedicato del proprietario, regione UE (Q9).
**Motivo**: richiesta esplicita; un unico fornitore per login, dati in tempo reale e notifiche.
**Conseguenze**: krumiro2.0 non è più "senza backend" quando la sincronizzazione è attiva: README e Aiuto da
aggiornare (F6).

## D9 — outatime trasmette timbrature grezze
**Stato**: proposta.
**Decisione**: outatime invia solo `GiornataPortale` (data, minuti, verso, smart); tutti i calcoli (pausa,
permessi, uscita prevista) restano in krumiro2.0.
**Motivo**: una sola implementazione delle regole di calcolo; i calcoli di outatime 0.1 hanno difetti noti.
**Conseguenze**: il destino della visualizzazione "Ora di levarsi" nella pagina del portale è Q12.

## D10 — Notifiche con Cloud Function + FCM
**Stato**: ~~proposta~~ scartata il 2026-10-03 (Q8), sostituita da D18.
**Decisione**: funzione `notificaGiornata` su `onDocumentWritten(utenti/{uid}/giornate/{data})` che, se la data è
oggi, invia una Web Push generica ai token di `utenti/{uid}/dispositivi`.
**Motivo**: le credenziali di invio restano sul server (S19); è il percorso standard supportato da Firebase.
**Conseguenze**: piano Blaze con budget e avviso (S23); su iPhone la notifica arriva solo con PWA installata
(iOS 16.4+) e permesso concesso.

## D11 — outatime 1.0 riscritta
**Stato**: ~~proposta~~ superata il 2026-10-03: outatime v0.2.3 è già TypeScript con build, test e CI; F4 la estende
(cifratura e QR) invece di riscriverla. Restano esbuild e Jest in outatime.
**Decisione**: TypeScript, build Vite, test Vitest, CI GitHub Actions, content script automatico sulla pagina del
cartellino, service worker per autenticazione e scrittura, popup per accesso, passphrase e stato.
**Motivo**: MV3 vieta codice remoto (l'SDK va impacchettato); serve un parser testato.
**Conseguenze**: il file `background.js` 0.1 viene sostituito; versione `1.0.0`.

## D12 — Sincronizzazione opzionale in krumiro2.0
**Stato**: ~~proposta~~ decaduta il 2026-10-03 con D8 (nessun server).
**Decisione**: disattivata di default; si attiva in *Impostazioni → Sincronizzazione portale*; l'SDK Firebase si
carica con import dinamico solo se attiva.
**Motivo**: chi non la usa non cambia nulla (dimensione, privacy, funzionamento offline).
**Conseguenze**: il budget di precache va misurato (baseline 98.96 KiB) e l'SDK escluso dal precache iniziale.

## D13 — Conservazione 90 giorni
**Stato**: ~~proposta~~ decaduta il 2026-10-03 con D8 (nessun server).
**Decisione**: campo `scadeIl` = scrittura + 90 giorni con politica TTL di Firestore; token dispositivo 60 giorni
senza uso.
**Motivo**: minimizzazione (S9); il cartellino copre al più il mese corrente.
**Conseguenze**: krumiro2.0 legge solo gli ultimi 40 giorni.

## D14 — Codice condiviso copiato con vettori di prova
**Stato**: proposta.
**Decisione**: tipo `GiornataPortale` e modulo di cifratura esistono in entrambi i repository, identici; un file
di vettori di prova (testo in chiaro, passphrase, sale, iv, ct attesi) è copiato in entrambi e testato in entrambi.
**Motivo**: evita un pacchetto npm privato e il suo ciclo di rilascio per ~150 righe. I vettori sono JSON, quindi
li leggono sia Vitest (krumiro2.0) sia Jest (outatime).
**Conseguenze**: ogni modifica del contratto è un task in entrambi i repository nella stessa fase.

## D15 — Classificazione e unione
**Stato**: approvata il 2026-10-03 (Q5, Q6).
**Decisione**: regole di [integrazione-outatime.md § 6–7](integrazione-outatime.md#6-classificazione-entratauscita--eventi-krumiro20-proposta-vedi-domanda-q6);
`Evento.origine?: 'portale'`.
**Motivo**: il portale conosce solo Entrata/Uscita; le annotazioni manuali (sigaretta, uscita anticipata, pausa
confermata) non devono perdersi.
**Conseguenze**: logica di dominio `high`, con test dedicati in `tests/portale.test.ts`.

## D16 — Documentazione unica in krumiro2.0
**Stato**: proposta (Q2). Con D19 non c'è la cartella `firebase/`.
**Decisione**: `docs/` di krumiro2.0 contiene architettura, sicurezza, piano e avanzamento dell'intera
integrazione; outatime ha solo un `docs/README.md` che rimanda qui; la configurazione Firebase sta in
`krumiro2.0/firebase/`.
**Motivo**: un solo progress.md e una sola roadmap per un lavoro che attraversa due repository.
**Conseguenze**: i task di outatime indicano il repository nel percorso (`outatime:src/…`); le fasi che toccano
outatime hanno un branch omonimo anche lì e una PR per repository.

---

## Esiti della plenaria del 2026-10-03

## D17 — Utente unico e pubblicazione dal repository del proprietario
**Stato**: approvata il 2026-10-03 (Q3).
**Decisione**: l'integrazione serve solo ed esclusivamente al proprietario (`gcampa`). La PWA si pubblica dal
GitHub Pages di `gcampa/krumiro2.0` (`https://gcampa.github.io/krumiro2.0/`) al posto di `ricky79.github.io`.
**Motivo**: il proprietario deve controllare il codice che gira con i suoi dati; nessun altro utente da gestire.
**Conseguenze**: README, `vite.config.ts` (commento e `BASE` invariato `/krumiro2.0/`), Aiuto e link di
installazione da aggiornare in un task di F2; Pages da attivare su `gcampa/krumiro2.0` (manuale, utente); i dati
già salvati sul telefono con l'app di `ricky79.github.io` stanno in un'altra origine: si portano con *Esporta
backup JSON* → *Importa* (passo nella checklist). Con Firebase (Q16-A) l'allowlist ha un solo UID (S3).

## D18 — Nessuna notifica
**Stato**: approvata il 2026-10-03 (Q8).
**Decisione**: nessuna notifica push; krumiro2.0 si aggiorna quando riceve i dati (apertura dell'app con Q16-A,
lettura del QR con Q16-B).
**Motivo**: scelta dell'utente.
**Conseguenze**: niente Cloud Function, niente FCM, niente piano Blaze (S19–S21, S23 decadono); la fase F5
Notifiche esce dalla roadmap.

## D19 — Trasferimento offline con QR
**Stato**: approvata il 2026-10-03 (Q16-B).
**Decisione**: outatime legge il cartellino e mostra un QR cifrato (AES-256-GCM) con le ultime giornate;
krumiro2.0 lo legge con la fotocamera, lo decifra, classifica e unisce (D15). Nessun servizio esterno, nessun
account, nessun traffico di rete verso l'esterno.
**Motivo**: le regole aziendali vietano il trasferimento dei dati di presenza a un servizio personale (Q1); il QR
equivale a ricopiare il cartellino a mano.
**Conseguenze**: D8, D10, D12, D13 non si applicano; un'inquadratura per ogni aggiornamento; modello di sicurezza
riscritto ([sicurezza.md](sicurezza.md)); formato del QR in [integrazione-outatime.md § 5.2](integrazione-outatime.md#52-contenuto-del-qr-proposta-si-fissa-nel-p-di-f4).

## D20 — Ordine delle fasi
**Stato**: approvata il 2026-10-03.
**Decisione**: prima la timbratura manuale in krumiro2.0 con le regole di outatime (F2), poi l'acquisizione:
inserimento manuale delle timbrature del portale (F3), outatime con QR (F4), lettura del QR in krumiro2.0 (F5),
consolidamento (F6).
**Motivo**: richiesta dell'utente; ogni fase dà qualcosa di usabile; F3 costruisce classificazione e unione senza
dipendere dall'estensione.
**Conseguenze**: roadmap e gestione-fasi riscritte; confronto delle regole in
[regole-outatime.md](regole-outatime.md).

## D21 — Gestione oraria a configurazioni (Presenza, FILM, Smart working)
**Stato**: proposta (Q24).
**Decisione**: krumiro2.0 calcola l'uscita con la formula unica di
[regole-outatime.md § 2](regole-outatime.md#2-una-sola-formula-per-le-tre-configurazioni-proposta-d21) e tre
configurazioni con i valori predefiniti di outatime v0.2.3, tutti modificabili in Impostazioni: ingresso minimo,
pausa minima, finestra della pausa minima (facoltativa), uscita minima, ore dovute. FILM è una scelta globale
(come il popup di outatime); smart working si sceglie per giornata. Le regole di krumiro2.0 che outatime non ha
(permessi, sigaretta, uscita anticipata, giornate passate) restano.
**Motivo**: richiesta dell'utente ("portare in krumiro2.0 la gestione oraria di outatime", orari configurabili,
FILM); la formula riproduce i 17 casi di test di outatime.
**Conseguenze**: cambia la forma di `Impostazioni` → `VERSIONE_CORRENTE` 2 con migrazione v1→v2 (eccezione a D2,
che vale per i soli campi opzionali); `Giornata.smart` nuovo; test di krumiro2.0 con i 17 casi di outatime come
casi di riferimento.
