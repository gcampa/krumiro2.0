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

In ordine di priorità: le prime bloccano l'architettura. Ognuna ha la raccomandazione della plenaria; decide
l'utente.

- **Q1 — Fattibilità sul PC del portale.** Il PC da cui apri il portale è aziendale e gestito? Puoi installare
  un'estensione non pubblicata (modalità sviluppatore) o solo dal Chrome Web Store? Da quella rete si raggiunge
  `*.googleapis.com`? Le regole interne permettono di portare i tuoi dati di presenza su un servizio personale?
  Il cartellino mostra le timbrature di **oggi** subito dopo la timbratura? Qual è il percorso esatto della pagina
  (es. `http://172.16.0.32/…`)?
  *Raccomandazione*: verificarlo prima di tutto; se l'estensione non è installabile o la rete blocca Google, il
  piano cambia (es. lettura da altro dispositivo). **Bloccante.**
- **Q2 — Dove vive il piano.** *Raccomandazione*: documentazione unica e configurazione Firebase in krumiro2.0,
  outatime rimanda qui (D16).
- **Q3 — Utenti e pubblicazione.** La funzione è solo per te o anche per altri utenti di krumiro2.0? Da dove si
  pubblica la PWA che userai (`ricky79.github.io` del README o un Pages di `gcampa`)? Chi è ricky79 rispetto al
  progetto?
  *Raccomandazione*: solo tu, allowlist di un UID (S3); la funzione resta invisibile/inutile per gli altri;
  pubblicazione dal repository di cui controlli il deploy, perché la PWA riceve la tua sessione Firebase.
- **Q4 — Cifratura end-to-end.** *Raccomandazione*: sì (D6), passphrase ≥ 12 caratteri inserita una volta per
  dispositivo. Alternativa: solo regole Firestore (più semplice, ma Google e un errore di configurazione vedono i
  dati).
- **Q5 — Timbrature manuali vs portale.** Quando arriva il portale, cosa succede a quelle toccate a mano?
  *Raccomandazione*: il portale vince sugli orari; tipo e annotazioni manuali abbinati entro 10 min si conservano;
  i manuali non abbinati si tolgono con **Annulla** per 10 s (integrazione § 7). Alternative: (b) il portale
  sostituisce tutto il giorno; (c) krumiro2.0 propone le differenze e tu confermi ogni volta.
- **Q6 — Classificazione.** Una coppia Uscita→Entrata nella fascia pranzo è pausa, le altre permesso, l'ultima
  Uscita è `USCITA` (anche se prima delle ore dovute: saldo negativo, non uscita anticipata). Va bene?
  *Raccomandazione*: sì (integrazione § 6); l'uscita anticipata resta un'annotazione manuale che l'unione conserva.
- **Q7 — Struttura del cartellino.** Serve una descrizione **anonimizzata** dell'HTML di una giornata con tutte le
  diciture possibili (Entrata, Uscita, "per SMART WORKING", "Nessuna timbratura", giustificativi, ferie,
  timbrature corrette a mano…) per scrivere i test del parser con HTML sintetico (S25).
  *Raccomandazione*: in F2 una sessione con te sul portale reale (copia dell'HTML con orari e nomi cambiati, mai
  committata) da cui la plenaria scrive la fixture sintetica.
- **Q8 — Notifiche.** *Raccomandazione*: Cloud Function + FCM (D10), piano Blaze con budget 1 € e avviso; il
  consumo atteso è nelle quote gratuite. Alternative: (b) Web Push inviata direttamente dall'estensione con chiave
  VAPID salvata sul PC (niente Blaze, codice non standard, chiave di invio su un PC aziendale); (c) nessuna
  notifica, aggiornamento solo quando apri krumiro2.0 (M1 lo dà già).
- **Q9 — Regione dei dati.** *Raccomandazione*: `europe-west8` (Milano) per Firestore e funzione.
- **Q10 — Sessioni.** Dopo quanto tempo l'estensione e la PWA chiedono di nuovo la passphrase?
  *Raccomandazione*: mai sul dispositivo finché non fai *Disconnetti* (chiave non esportabile, S8); revoca a
  distanza con *Cancella dati sul server* + cambio passphrase.
- **Q11 — F1 Design.** La UI nuova è piccola (sezione Impostazioni, etichetta "portale", toast Annulla, popup
  dell'estensione). *Raccomandazione*: F1 leggera senza strumento di design esterno: `docs/design/pages-and-widgets.md`
  con schizzi testuali nello stile esistente, approvata da te (deroga al flusso F1 da registrare).
- **Q12 — "Ora di levarsi" nel portale.** outatime 0.1 scrive ore e uscita dentro la pagina del portale.
  *Raccomandazione*: toglierla in 1.0 (calcoli errati, D9; meno codice che modifica la pagina aziendale). Se la
  vuoi, si rifà in F6 leggendo il calcolo da krumiro2.0.
- **Q13 — rubadab.** In questa sessione cloud i tool `rubadab_*` non ci sono e il servizio
  (`http://localhost:8899`) non è raggiungibile. *Raccomandazione*: gli hook in `.claude/settings.json` e
  `.mcp.json` li aggiungi tu sulla macchina dove gira rubadab; fino ad allora ogni riga di progress.md riporta
  `Applied lessons: none (rubadab non disponibile)`.
- **Q14 — Effort degli esecutori.** *Raccomandazione*: `medium/high` — cifratura, parser, classificazione e
  unione sono logica `high`.
- **Q15 — Distribuzione dell'estensione.** Caricata "non pacchettizzata" sul tuo Chrome o pubblicata sul Chrome
  Web Store come **non in elenco**? *Raccomandazione*: dipende da Q1; non in elenco dà aggiornamenti automatici
  e funziona con le policy che vietano la modalità sviluppatore.

## Domande chiuse

Nessuna.
