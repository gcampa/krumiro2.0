# Pausa sigaretta — design

Data: 2026-10-02 · Branch: `feature/pausa-sigaretta`

## Obiettivo

Un bottone **Pausa sigaretta** che registra un'uscita e apre una schermata con un countdown
e una sigaretta che si consuma. Al rientro:

- pausa entro la **tolleranza** (predefinita 11 min, configurabile) → la pausa si cancella:
  nessuna timbratura resta registrata;
- pausa oltre la tolleranza → la pausa diventa **permesso a blocchi da 30 min**
  (12–30 min → 30 min, 31–60 → 1h, 61–90 → 1h30, …).

Richiesto dall'utente: bottone, timbratura di uscita, finestra con countdown, sigaretta che si
consuma, cancellazione automatica entro la tolleranza, 30 min di permesso oltre (a blocchi),
tolleranza configurabile.

Scelte di design concordate: rappresentazione con etichetta sull'uscita (approccio A),
orari reali conservati, ore coperte invariate, nessuna conversione in pausa pranzo,
schermata a tutto schermo dentro l'app.

## Dati

- `Evento.sigaretta?: true` — ammesso solo su `USCITA_PERMESSO`. Indica che il permesso
  aperto da quell'uscita è una pausa sigaretta.
- `Impostazioni.tolleranzaSigaretta: number` — minuti, predefinito **11**, intervallo 0–60.
- Nessun cambio di `VERSIONE_CORRENTE`: entrambi i campi sono opzionali/con default e
  `normalizza` li gestisce:
  - `normalizzaGiornata` conserva `sigaretta: true` solo se `tipo === 'USCITA_PERMESSO'`;
  - `normalizzaImpostazioni` legge `tolleranzaSigaretta` con `intIn(v, 0, 60)`, altrimenti 11.
- **CSV**: l'evento si esporta come `10:05 Uscita in permesso (sigaretta)` e l'import
  riconosce il suffisso `(sigaretta)` solo su *Uscita in permesso* (come oggi `(pausa N)` sul
  rientro).
- **Istante preciso di inizio**: per il countdown al secondo si salva in una chiave locale
  separata `timbrature-sigaretta` = `{ data, eventoId, inizio }` (`inizio` = epoch ms), come le
  preferenze di tema e banner. Non fa parte dei dati né del backup. Se manca o non corrisponde
  all'evento, l'inizio è l'orario della timbratura (minuto esatto, secondi a 0). Viene rimossa al
  rientro o all'annullamento.

## Regole (logica pura, `src/core/sigaretta.ts`)

- `BLOCCO_PERMESSO_SIGARETTA = 30` (costante).
- `permessoSigaretta(durataMinuti)` → `max(1, ceil(durata / 30)) × 30`: una pausa sigaretta
  registrata vale almeno un blocco, anche se uscita e rientro cadono nello stesso minuto
  (possibile con tolleranza 0).
- `esitoRientroSigaretta(trascorsiMs, tolleranzaMin)` →
  - `'annulla'` se `trascorsiMs ≤ tolleranza × 60 000` (confronto al secondo, coerente
    con la sigaretta che si vede finire);
  - `'permesso'` altrimenti.
- `sigarettaInCorso(giornata)` → l'evento `USCITA_PERMESSO` con `sigaretta` che ha portato la
  giornata nello stato `IN_PERMESSO` (ultimo evento valido), oppure `null`.

## Calcolo (`src/core/calcolo.ts`)

- L'intervallo `permesso` aperto da un'uscita con `sigaretta` porta il flag `sigaretta: true`.
- Per un intervallo sigaretta **chiuso** di durata `d`:
  - permesso conteggiato = `permessoSigaretta(d)`;
  - eccedenza `permessoSigaretta(d) − d` tolta dalle lavorate (stesso schema della penalità
    di pausa minima). Se il lavoro registrato non basta ad assorbirla (sigaretta nei primi minuti
    di lavoro), la parte non assorbita non viene conteggiata finché non c'è abbastanza lavoro:
    le ore coperte non superano mai il tempo trascorso;
  - **nessuna** sovrapposizione con la fascia pranzo: non genera ripartizione pausa/permesso
    e non consuma la pausa da scalare.
- Intervallo sigaretta **aperto** (pausa in corso): conta la durata reale, come un permesso
  normale.
- Effetto: ore coperte, saldo e uscita prevista **non cambiano**; cambia solo la ripartizione
  lavorate ↔ permesso (si consuma permesso).
- Il calcolo applica i blocchi a qualunque permesso sigaretta registrato, anche se gli orari
  vengono corretti a mano dopo (la tolleranza si applica solo al momento del rientro).

## Azioni (`src/core/statoGiornata.ts`)

- Nuova azione `PAUSA_SIGARETTA`, etichetta *Pausa sigaretta*.
- In `AL_LAVORO` è la **prima** azione secondaria (con e senza pausa fatta).

## Interfaccia

### Bottone e avvio (`src/ui/giorno.ts`)

- Tocco su *Pausa sigaretta*: nessuna conferma. Registra `USCITA_PERMESSO` con
  `sigaretta: true` all'orario corrente, salva l'istante preciso, apre la schermata.

### Schermata (`src/ui/sigaretta.ts`)

- `<dialog>` a tutto schermo, sempre scuro (indipendente dal tema).
- In alto: *Pausa sigaretta* · *uscita alle HH:MM*.
- Al centro: sigaretta orizzontale in SVG inline — filtro arancio a sinistra, cartina bianca,
  brace pulsante e un po' di cenere sulla punta, filo di fumo che sale. La cartina si accorcia
  linearmente nella durata della tolleranza; la brace avanza verso il filtro.
- Sotto: countdown grande `mm:ss` e nota *Rientra entro le HH:MM per non segnare nulla*.
- Scaduta la tolleranza: resta solo il filtro, il fumo si ferma, il timer diventa rosso e conta
  in avanti (`+mm:ss`), nota *Al rientro: 30 min di permesso* (il valore segue i blocchi, calcolato
  sui minuti come farà il calcolo).
- Tolleranza 0: la sigaretta parte già consumata (stato "scaduta").
- Bottoni: **Rientro** (principale) e **Annulla pausa** (link piccolo; conferma, poi elimina
  l'uscita: serve per il tocco per errore).
- Non si chiude toccando lo sfondo né con Esc/Indietro (evento `cancel` annullato).
- Aggiornamento ogni secondo ricalcolando dall'istante salvato: corretta anche dopo standby.
- `prefers-reduced-motion`: niente fumo né pulsazione; la sigaretta si accorcia comunque.
- `main.ts` già non ridisegna con un `dialog[open]`: il refresh periodico non la disturba.

### Rientro

- Esito `annulla`: elimina l'uscita sigaretta. Toast *Pausa sigaretta di N min: non conteggiata*.
- Esito `permesso`: aggiunge `RIENTRO_PERMESSO` all'orario corrente (senza la proposta di
  ripartizione pranzo). Toast *Rientro alle HH:MM · 30 min di permesso*.
- In entrambi i casi rimuove la chiave `timbrature-sigaretta`.

### Ripristino

- Al render della vista *Oggi*, se `sigarettaInCorso(giornata)` non è null e la schermata non è
  già aperta, la schermata si riapre (app chiusa, ricaricata, tornata in primo piano).
- Le giornate passate rimaste in permesso sigaretta seguono le regole esistenti
  (*Manca la timbratura di uscita*), senza schermata.

### Timeline ed editor

- L'uscita sigaretta mostra il dettaglio *🚬 pausa sigaretta*; il rientro corrispondente mostra
  *N min di permesso* (blocchi).
- L'editor conserva il flag modificando l'orario; se il tipo cambia da *Uscita in permesso*,
  il flag viene rimosso. Nessuna casella per aggiungerlo a mano.

### Impostazioni (`src/ui/impostazioni.ts`)

- Nuova scheda **Pausa sigaretta** con *Tolleranza (min)*, 0–60, passo 1 (`inputMinuti` riceve
  un parametro `step`), nota *entro questo tempo la pausa non viene conteggiata*.
- Il ripristino dei predefiniti la riporta a 11.

### Aiuto (`src/ui/aiutoTesti.ts`)

- Voce `pausa-sigaretta` nella sezione *I bottoni*, `azione: 'PAUSA_SIGARETTA'`, con tolleranza
  dalle impostazioni correnti e esempi dei blocchi (15 min → 30 min, 42 min → 1h).
- README: una riga nella sezione *Come si usa* e una nella tabella *Regole di calcolo*.

## Test (Vitest)

- `sigaretta.test.ts`: `permessoSigaretta` (0 → 30, 1, 12, 30, 31, 60, 61), `esitoRientroSigaretta`
  al confine (tolleranza esatta → annulla, +1 s → permesso, tolleranza 0),
  `sigarettaInCorso`.
- `calcolo.test.ts`: permesso sigaretta 15 min → 30 di permesso, lavorate −15, coperte
  invariate; 42 min → 1h; sigaretta in fascia pranzo senza pausa → nessuna ripartizione;
  sigaretta aperta → durata reale.
- `migrazioni.test.ts`: `sigaretta` conservato solo su `USCITA_PERMESSO`;
  `tolleranzaSigaretta` predefinita e fuori intervallo.
- `csv.test.ts`: andata e ritorno di `(sigaretta)`.
- `statoGiornata.test.ts`: `PAUSA_SIGARETTA` prima secondaria in `AL_LAVORO`
  (aggiornare le aspettative esistenti).
- Schermata provata a mano nel browser (`npm run dev`), in tema chiaro e scuro.

## Fuori dallo scopo

- Notifiche, suoni o vibrazione allo scadere (le PWA su iPhone non possono senza push).
- Durata del blocco di permesso configurabile (resta 30 min).
- Aggiungere a mano una pausa sigaretta dall'editor.
