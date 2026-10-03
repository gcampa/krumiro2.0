# Documentazione — krumiro2.0 + integrazione outatime

Scopo: krumiro2.0 è una PWA che registra le timbrature e calcola l'uscita prevista (vedi il
[README del progetto](../README.md)). Questa documentazione pianifica l'**integrazione con outatime**: prima krumiro2.0
adotta le regole di calcolo di outatime, poi acquisisce le timbrature del portale (a mano, poi con un QR cifrato
mostrato da outatime sul PC e letto dal telefono, senza servizi esterni).

Metodo: skill `metodo-fasi`, adattato in [implementation/gestione-fasi.md](implementation/gestione-fasi.md).
Stato: **F0 in corso — architettura QR approvata (D19), ordine delle fasi approvato (D20); da chiudere le domande
di F2 (Q24–Q29).**

## Indice

| Documento | Contenuto |
|---|---|
| [architecture/regole-outatime.md](architecture/regole-outatime.md) | gestione oraria di outatime v0.2.3 (Presenza, FILM, Smart working), formula unica, confronto sui 17 casi di test |
| [architecture/integrazione-outatime.md](architecture/integrazione-outatime.md) | inventario dei due repository, architettura QR, flusso, contratto dati, classificazione e unione |
| [architecture/sicurezza.md](architecture/sicurezza.md) | modello delle minacce, controlli S1–S17, rischi residui |
| [architecture/decisions.md](architecture/decisions.md) | registro decisioni D1–D21 |
| [implementation/gestione-fasi.md](implementation/gestione-fasi.md) | metodo adattato al progetto |
| [implementation/roadmap.md](implementation/roadmap.md) | fasi F0, F2–F6 e milestone |
| [implementation/progress.md](implementation/progress.md) | avanzamento, Dubbi, Blocchi |
| [superpowers/](superpowers/) | archivio dei piani precedenti all'adozione (D5) |

## Mappa requisiti → documenti

| Requisito dell'utente | Dove |
|---|---|
| Gestione oraria di outatime in krumiro2.0, orari configurabili, FILM | regole-outatime, D21, F2 |
| Inserimento manuale delle timbrature del portale | integrazione § 6–7, D15, F3 |
| Accedo al portale normalmente, i dati arrivano a krumiro2.0 | D19, integrazione § 4, F4–F5 |
| Rispetto delle regole aziendali (nessun servizio personale) | D19, sicurezza S1–S2 |
| Assolutamente sicuro | sicurezza (tutto), D6 |
| Solo per me, pubblicata da `gcampa` | D17 |

## Domande aperte

Ognuna ha la raccomandazione della plenaria; decide l'utente. Le prime cinque bloccano la pianificazione di F2.

### Per F2 — gestione oraria di outatime ([regole-outatime.md](architecture/regole-outatime.md))
- **Q24 — Modello a configurazioni.** krumiro2.0 adotta le tre configurazioni di outatime v0.2.3 con un'unica
  formula (verificata sui 17 casi di test di outatime):

  | | Presenza | Presenza FILM | Smart working |
  |---|---|---|---|
  | Ingresso minimo | 08:30 | 08:30 | 07:00 |
  | Pausa minima | 60 min | 30 min | 30 min |
  | Finestra della pausa minima | — | 13:00–15:00 | — |
  | Uscita minima | 17:30 | 17:00 | 17:30 |
  | Ore dovute | 8:00 | 8:00 | 8:00 |

  *Raccomandazione*: tutti i valori modificabili in *Impostazioni → Orari*; **FILM** è un interruttore globale
  (come il popup di outatime) che sceglie quale configurazione vale per i giorni in presenza; **Smart working** si
  sceglie per giornata (interruttore nella schermata del giorno). Le ore dovute per giorno della settimana
  (sab–dom 0) restano come oggi. Un backup v1 importato porta giornate e tolleranza sigaretta; le regole orarie
  partono dai valori di outatime (D21).
- **Q25 — FILM, pausa dopo le 15:00.** outatime conta solo i minuti di pausa prima delle 13:00 e quelli oltre i 30
  dentro 13:00–15:00: una pausa 14:30–15:30 dà uscita 17:00 come una di 30 minuti. È la regola o una svista?
  *Raccomandazione*: svista; anche i minuti dopo le 15:00 ritardano l'uscita (pausa 14:30–15:30 → 17:30).
- **Q26 — Esempio dell'issue #2.** "Entrata 09:00, pausa 13:01–13:42, uscita 17:11" non torna con la regola
  (17:41); il test di outatime usa entrata 08:30. *Raccomandazione*: l'esempio ha un refuso; vale 17:41 con
  entrata 09:00 e 17:11 con 08:30.
- **Q27 — Fasce obbligatorie in smart working.** L'issue #2 cita 10:00–12:30 e 15:00–17:30 obbligatorie, non
  implementate in outatime. *Raccomandazione*: due fasce configurabili nella configurazione Smart working; se una
  timbratura le lascia scoperte, la giornata mostra l'avviso "Fascia obbligatoria 10:00–12:30 non coperta", senza
  cambiare il calcolo.
- **Q28 — Etichette e totali.** *Raccomandazione*: "**Ora di levarsi 👋**" al posto di "Uscita prevista"; nei
  dettagli della giornata e nello storico **🐫 Effettivi** (somma reale delle coppie entrata/uscita) e
  **Straordinari** (effettivi − ore dovute, se positivi). Il 💸 **Volontariato** (effettivi − ore pagate dal
  portale) arriva in F3, quando si inseriscono le ore pagate.
- **Q29 — Riferimento di outatime.** `main` di outatime è fermo alla 0.1; la versione in uso è `v0.2.3` sul branch
  `firefox-support`. *Raccomandazione*: il piano usa `v0.2.3` come riferimento; portare `firefox-support` in
  `main` è un'azione tua su outatime, fuori da questo piano (da fare prima di F4).

### Processo
- **Q11 — F1 Design.** *Raccomandazione*: nessuna F1 separata (deroga registrata): F2 e F3 aggiungono campi e un
  dialogo nello stile esistente, descritti per esteso nei task; le schermate del QR (outatime e lettore) si
  progettano nel P di F4 in `docs/design/pages-and-widgets.md`, approvato da te.
- **Q14 — Effort degli esecutori.** *Raccomandazione*: `medium/high` (calcolo, classificazione, unione,
  cifratura sono `high`).
- **Q13 — rubadab.** *Raccomandazione*: hook e `.mcp.json` li aggiungi tu dove gira il servizio; fino ad allora
  `Applied lessons: none (rubadab non disponibile)`.
- **Q2 — Dove vive il piano.** *Raccomandazione*: documentazione unica in krumiro2.0, outatime rimanda qui (D16).

### Per fasi successive (si chiudono nel loro P)
- **Q7 — Struttura del cartellino** (F4): la struttura è già descritta dalla fixture sintetica di
  `test/content.spec.ts` di outatime v0.2.3; resta da sapere se esistono diciture oltre a Entrata/Uscita/SMART
  WORKING (ferie, giustificativi, timbrature corrette).
- **Q12 — "Ora di levarsi" nella pagina del portale** (F4): *raccomandazione* tenerla (è la funzione principale di
  outatime) e allinearla alle risposte Q25–Q26.
- **Q15 — Distribuzione dell'estensione** (F4): *raccomandazione* lo zip Chrome delle release di outatime, caricato
  non pacchettizzato (come oggi).
- **Q17 — Telefono** (F5): iPhone o Android, per la lettura del QR.
- **Q23 — Chiave del QR** (F4): passphrase scritta su PC e telefono, oppure chiave casuale passata una volta con un
  QR di abbinamento (più robusta, nessuna password da ricordare). *Raccomandazione*: QR di abbinamento.

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
- **Q18–Q22** (pausa minima, fascia pranzo, entrata dopo le 09:30, smart working, etichette) → 2026-10-03:
  superate. Erano basate su outatime 0.1; l'utente ha chiarito: orari configurabili, configurazione FILM, portare
  in krumiro2.0 la gestione oraria di outatime → sostituite da Q24–Q29 su outatime v0.2.3.
