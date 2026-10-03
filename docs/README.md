# Documentazione — krumiro2.0 + integrazione outatime

Scopo: krumiro2.0 è una PWA che registra le timbrature e calcola l'uscita prevista (vedi il
[README del progetto](../README.md)). Questa documentazione pianifica l'**integrazione con outatime**: l'estensione
Chrome legge il cartellino del portale timbrature, lo salva cifrato sul Firebase del proprietario e una notifica
aggiorna krumiro2.0.

Metodo: skill `metodo-fasi`, adattato in [implementation/gestione-fasi.md](implementation/gestione-fasi.md).
Stato: **F0 in corso — bozza da discutere in plenaria.**

## Indice

| Documento | Contenuto |
|---|---|
| [architecture/integrazione-outatime.md](architecture/integrazione-outatime.md) | inventario dei due repository, architettura, flussi, contratto dati, classificazione e unione |
| [architecture/sicurezza.md](architecture/sicurezza.md) | modello delle minacce, controlli S1–S26, bozza delle regole Firestore, rischi residui |
| [architecture/decisions.md](architecture/decisions.md) | registro decisioni (D1–D5 rilevate, D6–D16 proposte) |
| [implementation/gestione-fasi.md](implementation/gestione-fasi.md) | metodo adattato al progetto |
| [implementation/roadmap.md](implementation/roadmap.md) | fasi proposte F0–F6 e milestone |
| [implementation/progress.md](implementation/progress.md) | avanzamento, Dubbi, Blocchi |
| [superpowers/](superpowers/) | archivio dei piani precedenti all'adozione (D5) |

## Mappa requisiti → documenti

| Requisito dell'utente | Dove |
|---|---|
| Accedo al portale normalmente (nessun passo in più) | integrazione § 4.1 (content script automatico), D11 |
| outatime salva sul **mio** Firebase | D8, sicurezza § 5 (progetto dedicato) |
| Una notifica aggiorna krumiro2.0 | integrazione § 4.2, D10 |
| Assolutamente sicuro | sicurezza (tutto), D6, D13 |
| krumiro2.0 continua a funzionare come oggi | D12, D7 |

## Domande aperte

In ordine di priorità. Ognuna ha la raccomandazione della plenaria; decide l'utente.

- **Q16 — Conflitto con le regole aziendali (bloccante, nuova il 2026-10-03).** Alla Q1 hai risposto che le
  regole interne **non** permettono di portare i dati di presenza su un servizio personale. L'architettura
  Firebase (D8) fa esattamente questo, da un PC aziendale gestito, con un'estensione non pubblicata: è il rischio
  più alto del piano (disciplinare, e un controllo DLP/EDR dell'azienda può rilevarlo), più di qualunque attacco
  tecnico. Il piano Firebase è **sospeso** finché non scegli:
  - **(A) Autorizzazione scritta** dell'azienda (IT/privacy) a usare l'estensione e il servizio personale. Con
    l'autorizzazione il piano Firebase resta com'è, senza notifiche (D18).
  - **(B) Trasferimento offline con QR code** *(raccomandata)*: outatime mostra sul PC un QR cifrato con le
    timbrature recenti; krumiro2.0 lo legge con la fotocamera del telefono. Nessun dato passa dalla rete
    aziendale verso un servizio esterno, nessun Firebase, nessun account, nessun costo: equivale a ricopiare a mano
    il cartellino, che fai già. Costo per te: un'inquadratura dopo aver aperto il portale.
  La plenaria non pianifica una strada che aggira le regole aziendali.
- **Q17 — Telefono.** iPhone o Android? Serve per la lettura del QR (B): su Android Chrome c'è `BarcodeDetector`
  nativo; su iPhone serve una libreria di decodifica dentro la PWA (nuova dipendenza, D1).
- **Q2 — Dove vive il piano.** *Raccomandazione*: documentazione unica in krumiro2.0, outatime rimanda qui (D16).
- **Q7 — Struttura del cartellino.** Serve una descrizione **anonimizzata** dell'HTML di una giornata con tutte le
  diciture possibili (Entrata, Uscita, "per SMART WORKING", "Nessuna timbratura", giustificativi, ferie,
  timbrature corrette a mano…) per i test del parser con HTML sintetico (S25).
  *Raccomandazione*: in F2 una sessione con te sul portale reale (copia con orari e nomi cambiati, mai committata)
  da cui la plenaria scrive la fixture sintetica.
- **Q9 — Regione dei dati** (solo con A). *Raccomandazione*: `europe-west8` (Milano).
- **Q10 — Sessioni** (solo con A). *Raccomandazione*: passphrase chiesta di nuovo solo dopo *Disconnetti*.
- **Q11 — F1 Design.** *Raccomandazione*: F1 leggera senza strumento esterno, `docs/design/pages-and-widgets.md`
  approvato da te (deroga al flusso F1 da registrare).
- **Q12 — "Ora di levarsi" nel portale.** *Raccomandazione*: toglierla in outatime 1.0 (calcoli errati, D9).
- **Q13 — rubadab.** *Raccomandazione*: hook e `.mcp.json` li aggiungi tu dove gira il servizio; fino ad allora
  `Applied lessons: none (rubadab non disponibile)`.
- **Q14 — Effort degli esecutori.** *Raccomandazione*: `medium/high`.
- **Q15 — Distribuzione dell'estensione.** Hai confermato che puoi installarla non pubblicata.
  *Raccomandazione*: caricata non pacchettizzata (nessuna pubblicazione sul Web Store).

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
