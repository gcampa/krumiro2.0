# Documentazione — krumiro2.0 + integrazione outatime

Scopo: krumiro2.0 è una PWA che registra le timbrature e calcola l'uscita prevista (vedi il
[README del progetto](../README.md)). Questa documentazione pianifica l'**integrazione con outatime**: prima krumiro2.0
adotta le regole di calcolo di outatime, poi acquisisce le timbrature del portale (a mano, poi con un QR cifrato
mostrato da outatime sul PC e letto dal telefono, senza servizi esterni).

**Requisito dell'utente: krumiro2.0 con provider dati outatime.** outatime fornisce le timbrature (dal
cartellino del portale) e la tabella oraria, che è la fonte di verità (D27, D28); krumiro2.0 non inventa regole che
outatime non ha.

Metodo: skill `metodo-fasi`, adattato in [implementation/gestione-fasi.md](implementation/gestione-fasi.md).
Stato: **F0 completa, in attesa di R-F0** — domande di F2 chiuse (D21–D26), piano di F2 scritto.

## Indice

| Documento | Contenuto |
|---|---|
| [architecture/regole-outatime.md](architecture/regole-outatime.md) | gestione oraria di outatime v0.2.3 (Presenza, FILM, Smart working), formula unica, confronto sui 17 casi di test |
| [architecture/integrazione-outatime.md](architecture/integrazione-outatime.md) | inventario dei due repository, architettura QR, flusso, contratto dati, classificazione e unione |
| [architecture/sicurezza.md](architecture/sicurezza.md) | modello delle minacce, controlli S1–S17, rischi residui |
| [architecture/decisions.md](architecture/decisions.md) | registro decisioni D1–D32 |
| [implementation/gestione-fasi.md](implementation/gestione-fasi.md) | metodo adattato al progetto |
| [implementation/README.md](implementation/README.md) | istruzioni per l'esecutore, regole B/W, comandi, DoD |
| [implementation/prompts.md](implementation/prompts.md) | prompt del progetto |
| [implementation/F2-gestione-oraria.md](implementation/F2-gestione-oraria.md) | piano di F2: 17 task |
| [implementation/f2-sessioni.md](implementation/f2-sessioni.md) | sessioni, prompt e checklist di F2 |
| [implementation/F3-pausa-caffe.md](implementation/F3-pausa-caffe.md) | piano di F3: pausa caffè, cronometro sigaretta o birra (7 task) |
| [implementation/roadmap.md](implementation/roadmap.md) | fasi F0, F2–F7 e milestone |
| [implementation/progress.md](implementation/progress.md) | avanzamento, Dubbi, Blocchi |
| [implementation/outatime-unione-main.md](implementation/outatime-unione-main.md) | valutazione e procedura per riunire outatime in `main` (D22) |
| [superpowers/](superpowers/) | archivio dei piani precedenti all'adozione (D5) |

## Mappa requisiti → documenti

| Requisito dell'utente | Dove |
|---|---|
| Gestione oraria di outatime in krumiro2.0, orari configurabili, FILM | regole-outatime, D21, F2 |
| Inserimento manuale delle timbrature del portale | integrazione § 6–7, D15, F4 |
| Accedo al portale normalmente, i dati arrivano a krumiro2.0 | D19, integrazione § 4, F5–F6 |
| Rispetto delle regole aziendali (nessun servizio personale) | D19, sicurezza S1–S2 |
| Assolutamente sicuro | sicurezza (tutto), D6 |
| Solo per me, pubblicata da `gcampa` | D17 |
| Pausa caffè (ogni 2h di lavoro) come cronometro: sigaretta o birra, durata configurabile | D29, D31, F3 |
| Pausa pranzo 1h–1h30 (FILM 30 min–1h30): avviso oltre il massimo | D32, F2 |

## Domande aperte

Nessuna blocca F2. Restano quelle delle fasi successive, da chiudere nel loro P (a scelta multipla).

- **Q7 — Struttura del cartellino** (F4/F5): la fixture sintetica di `test/content.spec.ts` di outatime descrive la
  struttura; resta da sapere se esistono diciture oltre a Entrata/Uscita/SMART WORKING (ferie, giustificativi,
  timbrature corrette).
- **Q12 — "Ora di levarsi" nella pagina del portale** (F5): *raccomandazione* tenerla e allinearla a D23.
- **Q15 — Distribuzione dell'estensione** (F5): *raccomandazione* zip Chrome delle release, caricato non
  pacchettizzato.
- **Q17 — Telefono** (F6): iPhone o Android, per la lettura del QR.
- **Q23 — Chiave del QR** (F5): passphrase oppure QR di abbinamento. *Raccomandazione*: QR di abbinamento.

## Domande chiuse

- **Q1 — Fattibilità sul PC** → 2026-10-03: PC aziendale gestito; estensione non pubblicata installabile;
  `*.googleapis.com` raggiungibile; regole interne **non** permettono il trasferimento a un servizio personale
  (→ Q16); il cartellino mostra subito le timbrature di oggi; indirizzo: host `http://172.16.0.32/` del manifest
  di outatime (il content script verifica la presenza di `[data-giorno]`).
- **Q3 — Utenti e pubblicazione** → 2026-10-03: solo ed esclusivamente il proprietario; la pubblicazione su
  `ricky79.github.io` va sostituita → D17.
- **Q4 — Cifratura end-to-end** → 2026-10-03: sì → D6 approvata (con B vale per il contenuto del QR).
- **Q5 — Manuali vs portale** → 2026-10-03: raccomandazione approvata → D15.
- **Q6 — Classificazione** → 2026-10-03: raccomandazione approvata → D15.
- **Q8 — Notifiche** → 2026-10-03: nessuna notifica → D18 (D10 scartata).
- **Q16 — Conflitto con le regole aziendali** → 2026-10-03: opzione B, trasferimento offline con QR → D19; D8
  scartata. Ordine delle fasi → D20.
- **Q9, Q10** (regione dei dati, sessioni) → 2026-10-03: decadute con D19 (nessun server).
- **Q24 — Configurazioni** → 2026-10-03: FILM globale, smart working per giornata, tutto modificabile → D21.
- **Q25 — FILM, pausa dopo le 15:00** → 2026-10-03: come outatime (non riduce il lavoro) → D23.
- **Q26 — Esempio issue #2** → 2026-10-03: FILM = 30 min di pausa e sempre 8 ore di lavoro; 09:00 + 13:01–13:42 →
  17:41 → D23.
- **Q27 — Fasce obbligatorie** → 2026-10-03: per configurazione, solo avviso; FILM fino alle 17:00 → D23.
- **Q28 — Etichette e totali** → 2026-10-03: Ora di levarsi 👋, Effettivi, Straordinari; Volontariato in F4 → D23.
- **Q29 — outatime in `main`** → 2026-10-03: sì → D22, PR gcampa/outatime#3.
- **Q2 — Documentazione** → 2026-10-03: tutto in krumiro2.0 → D16.
- **Q11 — F1** → 2026-10-03: nessuna fase di design → D26.
- **Q13 — rubadab** → 2026-10-03: hook dopo, in locale → D25.
- **Q14 — Effort** → 2026-10-03: solo medium → D24.
- **Q18–Q22** (pausa minima, fascia pranzo, entrata dopo le 09:30, smart working, etichette) → 2026-10-03:
  superate. Erano basate su outatime 0.1; l'utente ha chiarito: orari configurabili, configurazione FILM, portare
  in krumiro2.0 la gestione oraria di outatime → sostituite da Q24–Q29 su outatime v0.2.3.
