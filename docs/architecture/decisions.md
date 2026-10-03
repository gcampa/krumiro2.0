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
**Stato**: approvata il 2026-10-03 (Q2). Con D19 non c'è la cartella `firebase/`.
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
**Stato**: approvata il 2026-10-03 (Q24); dettagli in D23.
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

## D22 — outatime: `main` allineato alla release 0.2.3
**Stato**: approvata il 2026-10-03 (Q29); PR in bozza [gcampa/outatime#3](https://github.com/gcampa/outatime/pull/3)
aperta da Claude, merge dell'utente.
**Decisione**: si porta `firefox-support` in `main` di outatime con una PR e un commit di merge (opzione A di
[outatime-unione-main.md](../implementation/outatime-unione-main.md)); poi si eliminano `firefox-support` e
`feature/bun-firefox` e si lavora solo da `main`.
**Motivo**: richiesta dell'utente di rispettare quanto rilasciato nell'ultima versione; oggi il ramo predefinito
mostra la 0.1. Il merge conserva la storia e lascia i tag `v0.2.0`–`v0.2.3` raggiungibili da `main`.
**Conseguenze**: nessun cambio di codice né nuova release (`main` = `v0.2.3` + `.npmrc`); F4 parte da `main`.

## D23 — Dettagli del calcolo della gestione oraria
**Stato**: approvata il 2026-10-03 (Q25–Q28, fasce per configurazione); i punti marcati *(plenaria)* sono
dedotti dalla plenaria per rendere eseguibili i task, l'utente può sostituirli con una nuova voce.
**Decisione**:
- Configurazione: ingresso minimo, pausa minima, "pausa minima solo nella fascia pranzo" (FILM), fascia pranzo,
  pausa prevista (`pausaDaScalare`), uscita minima, fasce obbligatorie (max 4); valori predefiniti di outatime nella
  tabella di [F2-gestione-oraria.md](../implementation/F2-gestione-oraria.md).
- **FILM** (Q25, Q26): pausa minima 30 sui minuti di pausa dentro 13:00–15:00, calcolata sulla giornata intera; i
  minuti prima delle 13:00 contano come pausa; **i minuti dopo le 15:00 non riducono il lavoro** (come outatime).
  Con entrata 09:00 e pausa 13:01–13:42 l'uscita è 17:41 (sempre 8 ore di lavoro).
- FILM: vedi D28 (configurazione del profilo dell'utente). La regola intermedia "FILM salvato sul giorno" del
  2026-10-03 è ritirata dall'utente prima di essere implementata.
- ~~Uscita minima solo nei giorni con le ore dovute predefinite~~ → sostituito il 2026-10-03: **uscita minima
  sempre**, come outatime (D27); non vale solo nei giorni liberi (0 ore dovute: sabato e domenica con le impostazioni
  predefinite di krumiro2.0). outatime non ha giorni con ore diverse da 8:00: nessun caso o test del piano ne
  inventa (correzione del 2026-10-03).
- **Pausa prevista** separata dalla pausa minima *(plenaria)*: serve a non cambiare i risultati dei 92 test storici;
  i predefiniti coincidono con la pausa minima (60/30/30).
- **Durante la pausa** l'ora di levarsi si stima simulando il rientro *(plenaria)*: tiene conto di FILM e uscita
  minima.
- **Fasce obbligatorie per configurazione**, solo avviso, valutate quando la fascia è conclusa; coprono lavoro,
  permessi, permesso a inizio giornata e uscita anticipata. Predefinite: Presenza e Smart working 10:00–12:30 e
  15:00–17:30; FILM 10:00–12:30 e 15:00–17:00.
- **Effettivi** = minuti reali delle sole coppie entrata/uscita complete, come EFFETTIVI di outatime (D27; il tratto
  ancora aperto non conta); **Straordinari** = effettivi − ore dovute del giorno (Q28; con 8h coincide con outatime);
  "Ora di levarsi 👋" al posto di "Uscita prevista"; 💸 Volontariato in F3.
**Motivo**: risposte dell'utente del 2026-10-03; i 17 casi di outatime e i 92 test storici restano veri.
**Conseguenze**: task T2.01–T2.17; schema v2.

## D24 — Effort degli esecutori: solo medium
**Stato**: approvata il 2026-10-03 (Q14).
**Decisione**: tutti i task con `Effort: medium`; un task che richiederebbe `high` si spezza; formule, firme, testi
e casi di test sono scritti nel file di fase.
**Motivo**: scelta dell'utente.
**Conseguenze**: F2 ha 17 task in 7 sessioni più la chiusura.

## D25 — rubadab: hook in locale
**Stato**: approvata il 2026-10-03 (Q13).
**Decisione**: il modello degli hook è
[rubadab-settings.example.json](../implementation/rubadab-settings.example.json) (progetto `krumiro2.0`); l'utente lo
copia in `.claude/settings.json` e crea `.mcp.json` sulla macchina dove gira rubadab. Fino ad allora
`Applied lessons: none (rubadab non disponibile)`.
**Motivo**: la sessione cloud non raggiunge `localhost:8899`; un hook attivo qui fallirebbe a ogni prompt.
**Conseguenze**: punto fisso 1 rinviato all'attivazione locale.

## D26 — Nessuna fase F1 di design
**Stato**: approvata il 2026-10-03 (Q11).
**Decisione**: niente F1 separata; F2 e F3 descrivono i controlli nuovi nei task, nello stile esistente; le
schermate del QR si progettano nel P di F4.
**Motivo**: interfaccia nuova piccola, nello stile già definito.
**Conseguenze**: deroga allo scheletro (F1 "solo se c'è UI") registrata in progress.md.

## D27 — La tabella oraria di outatime è la fonte di verità
**Stato**: approvata il 2026-10-03 (indicazione dell'utente).
**Decisione**: per orari e calcoli che outatime definisce (ingresso minimo, pausa minima, finestra FILM, uscita
minima, ora di levarsi, effettivi) vale outatime v0.2.3: [regole-outatime.md](regole-outatime.md) § 1–3 e i casi di
`test/lib.spec.ts` di outatime. krumiro2.0 aggiunge solo ciò che outatime non definisce (permessi, sigaretta,
giornate passate, stima prima della pausa, fasce obbligatorie) senza contraddirlo.
**Motivo**: richiesta esplicita dell'utente.
**Conseguenze**: un risultato di krumiro2.0 diverso da outatime è un difetto o un Dubbio per la plenaria, mai un
valore atteso da adattare (regola B9 del README dell'esecutore); sostituite le due regole dedotte in D23 (FILM su
tutti i giorni, uscita minima solo nei giorni normali) e allineati gli Effettivi.

## D28 — FILM è una configurazione del profilo dell'utente
**Stato**: approvata il 2026-10-03 (indicazione dell'utente); sostituisce "FILM salvato sul giorno" (D23, ritirata).
**Decisione**: FILM è una proprietà dell'utente, come `filmEnabled` nel `chrome.storage.local` di outatime: un solo
valore `Impostazioni.film` in *Impostazioni → Profilo*, che vale per tutti i giorni in presenza (anche quelli
passati); nessun campo `film` sulle giornate, nessun pulsante FILM nella giornata, nessuna colonna che lo reimporti
dal CSV. "Ripristina valori predefiniti" non tocca il profilo. Lo smart working resta una scelta per giornata.
**Motivo**: "La modalità FILM è una configurazione di profilo, è legata all'utenza" (utente); coerente con outatime
(D27).
**Conseguenze**: T2.01, T2.02, T2.09, T2.11, T2.14, T2.15, T2.17 e la checklist R1 aggiornati.
