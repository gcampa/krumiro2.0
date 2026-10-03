# Documentazione — krumiro2.0 + integrazione outatime

Scopo: krumiro2.0 è una PWA che registra le timbrature e calcola l'uscita prevista (vedi il
[README del progetto](../README.md)). Questa documentazione pianifica l'**integrazione con outatime**: prima krumiro2.0
adotta le regole di calcolo di outatime, poi acquisisce le timbrature del portale (a mano, poi con un QR cifrato
mostrato da outatime sul PC e letto dal telefono, senza servizi esterni).

Metodo: skill `metodo-fasi`, adattato in [implementation/gestione-fasi.md](implementation/gestione-fasi.md).
Stato: **F0 in corso — architettura QR approvata (D19), ordine delle fasi approvato (D20); da chiudere le domande
di F2 (Q18–Q22).**

## Indice

| Documento | Contenuto |
|---|---|
| [architecture/regole-outatime.md](architecture/regole-outatime.md) | regole di calcolo di outatime, confronto misurato con krumiro2.0 |
| [architecture/integrazione-outatime.md](architecture/integrazione-outatime.md) | inventario dei due repository, architettura QR, flusso, contratto dati, classificazione e unione |
| [architecture/sicurezza.md](architecture/sicurezza.md) | modello delle minacce, controlli S1–S17, rischi residui |
| [architecture/decisions.md](architecture/decisions.md) | registro decisioni D1–D20 |
| [implementation/gestione-fasi.md](implementation/gestione-fasi.md) | metodo adattato al progetto |
| [implementation/roadmap.md](implementation/roadmap.md) | fasi F0, F2–F6 e milestone |
| [implementation/progress.md](implementation/progress.md) | avanzamento, Dubbi, Blocchi |
| [superpowers/](superpowers/) | archivio dei piani precedenti all'adozione (D5) |

## Mappa requisiti → documenti

| Requisito dell'utente | Dove |
|---|---|
| Timbrare a mano con orari, configurazioni e convenzioni di outatime | regole-outatime, F2 |
| Inserimento manuale delle timbrature del portale | integrazione § 6–7, D15, F3 |
| Accedo al portale normalmente, i dati arrivano a krumiro2.0 | D19, integrazione § 4, F4–F5 |
| Rispetto delle regole aziendali (nessun servizio personale) | D19, sicurezza S1–S2 |
| Assolutamente sicuro | sicurezza (tutto), D6 |
| Solo per me, pubblicata da `gcampa` | D17 |

## Domande aperte

Ognuna ha la raccomandazione della plenaria; decide l'utente. Le prime cinque bloccano la pianificazione di F2.

### Per F2 — timbratura manuale con le regole di outatime ([regole-outatime.md](architecture/regole-outatime.md))
- **Q18 — Pausa minima.** outatime conta almeno 60 min di pausa pranzo; krumiro2.0 oggi 30.
  *Raccomandazione*: 60 come nuovo valore predefinito (resta modificabile in Impostazioni). Con questo solo
  cambio krumiro2.0 dà la stessa uscita di outatime in tutti i casi misurati.
- **Q19 — Fascia pranzo.** outatime usa 12:30–14:30 per riconoscere la pausa e 13:00–14:30 per normalizzarla;
  krumiro2.0 oggi 12:00–14:30. Qual è la regola aziendale?
  *Raccomandazione*: se non c'è una regola scritta, 12:30–14:30 (la finestra con cui outatime riconosce la pausa).
- **Q20 — Entrata dopo le 09:30.** outatime non calcola l'uscita; krumiro2.0 la calcola come sempre. Cosa prevede
  l'azienda per chi entra dopo la fascia flessibile?
  *Raccomandazione*: nuova impostazione "Fine fascia di ingresso" (09:30); se l'entrata la supera krumiro2.0
  calcola comunque l'uscita e mostra l'avviso "Entrata dopo la fascia flessibile (09:30): verifica se serve un
  permesso". Alternativa: il tempo tra 09:30 e l'entrata diventa automaticamente permesso a inizio giornata.
- **Q21 — Smart working.** outatime riconosce "Entrata/Uscita per SMART WORKING" con lo stesso calcolo.
  *Raccomandazione*: in krumiro2.0 una giornata può essere segnata "Smart working" (interruttore nella giornata),
  visibile nella timeline, nello storico e nel CSV, senza effetto sul calcolo; servirà anche per i dati del
  portale (campo `smart` del contratto).
- **Q22 — Totali ed etichette.** outatime mostra "Ora di levarsi 👋", ⏱️ Official Timing e 🐫 Effective timing.
  *Raccomandazione*: etichetta "Ora di levarsi 👋" al posto di "Uscita prevista" nella schermata Oggi; nei
  dettagli della giornata, accanto alle ore lavorate (= Official), una riga "Effettive" con il tempo reale tra le
  timbrature (senza minimo delle 08:30 e senza pausa minima). Alternativa: solo l'etichetta.

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
- **Q7 — Struttura del cartellino** (F4): descrizione anonimizzata dell'HTML con tutte le diciture.
- **Q12 — "Ora di levarsi" nella pagina del portale** (F4): tenerla in outatime 1.0 o lasciarla solo a krumiro2.0.
- **Q15 — Distribuzione dell'estensione** (F4): *raccomandazione* caricata non pacchettizzata.
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
