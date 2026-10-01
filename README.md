# Timbrature

Web app installabile (PWA) per registrare le timbrature di lavoro dall'iPhone e sapere
a che ora si può uscire. Funziona offline, non ha backend: **i dati restano sul telefono**
(localStorage del browser).

App pubblicata: **https://ricky79.github.io/krumiro2.0/**

## Installare l'app sull'iPhone

1. Apri **Safari** (deve essere Safari: le altre app non permettono di installare le PWA
   su iOS) e vai su `https://ricky79.github.io/krumiro2.0/`.
2. Tocca il pulsante **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri e scegli **Aggiungi alla schermata Home**.
   Su iOS 18 e successivi verifica che **Apri come app web** sia attivo.
4. Conferma il nome "Timbrature" e tocca **Aggiungi**.
5. Apri l'app dall'icona sulla schermata Home: parte a tutto schermo, senza la barra di Safari.

Dopo la prima apertura l'app funziona anche **senza connessione**. Quando pubblichi una
nuova versione, viene scaricata in background e applicata alla successiva apertura.

### Attenzione ai dati

- I dati dell'app installata sono separati da quelli di Safari: usa sempre l'icona sulla Home.
- Se elimini l'app dalla schermata Home, iOS cancella anche i suoi dati.
- L'app chiede al sistema la memoria persistente (`navigator.storage.persist()`), ma
  conviene comunque fare ogni tanto un **backup**: *Impostazioni → Esporta backup completo (JSON)*
  e salvalo in File/iCloud. Per ripristinarlo: *Impostazioni → Importa CSV o backup JSON…*.

## Come si usa

- **Oggi**: il bottone grande propone l'azione più probabile
  (Entrata → Inizio pausa → Fine pausa → Uscita). Sotto trovi le azioni secondarie:
  *Esco in permesso*, *Rientro da permesso*, *Uscita anticipata*, *Entro dopo*
  (permesso a inizio giornata). In alto vedi l'**uscita prevista**, le ore coperte e il saldo.
- Tocca una timbratura nella timeline per **modificarla o eliminarla**. Con
  *+ Aggiungi timbratura* puoi inserirne una a mano, per esempio se l'hai dimenticata.
- **Storico**: le giornate del mese con lavorate, permesso e saldo, più il riepilogo mensile
  (permesso usato e saldo del mese). Con *+ Giornata dimenticata* inserisci un giorno passato.
- **Impostazioni**: ore dovute (anche diverse per giorno della settimana), fascia pranzo,
  pausa da scalare, pausa minima, orario di inizio conteggio, export e import dei dati.
- **Aiuto**: risposte ai dubbi più comuni (per esempio la differenza tra *Esco in permesso*
  e *Uscita anticipata*), con ricerca. I link **?** nelle schermate aprono direttamente
  la risposta che riguarda quel punto. Gli esempi usano le tue impostazioni correnti.

## Regole di calcolo

| Regola | Default |
|---|---|
| Ore dovute | 8h lun–ven, 0 sab–dom (configurabili per giorno) |
| Ore coperte | ore lavorate + ore di permesso |
| Saldo | coperte − dovute |
| Uscita prevista (al lavoro) | adesso + (dovute − coperte); se la pausa non è ancora fatta e l'uscita cade dopo la fascia pranzo, si aggiunge la pausa da scalare |
| Timbrature prima delle 08:30 | contano come 08:30 (in tutti i calcoli) |
| Pausa più breve di 30 min | conta come 30 min (in tutti i calcoli) |
| Pausa pranzo | non conta come coperta |
| Permesso a metà giornata | conta come coperto |
| Uscita anticipata | le ore mancanti diventano permesso (saldo 0) |
| Permesso che copre la fascia pranzo (12:00–14:30) senza pausa registrata | fino a 60 min diventano pausa; al rientro l'app mostra la ripartizione proposta (es. "1h pausa + 1h30 permesso"), che puoi modificare prima di confermare |

Se la sequenza degli eventi è incoerente (per esempio *Fine pausa* senza *Inizio pausa*),
l'app non va in crash: segnala la giornata come **da correggere**, spiega il problema
e calcola i totali ignorando gli eventi incoerenti.

## Export CSV

Il CSV usa `;` come separatore e la virgola per i decimali, con BOM UTF-8: si apre
direttamente con Excel in italiano. Contiene una riga per giorno (ore dovute, lavorate,
permesso, saldo in ore decimali e l'elenco delle timbrature). Su iPhone si apre il foglio
di condivisione (Mail, File, AirDrop…); dove la condivisione non è disponibile il file
viene scaricato. Lo stesso CSV si può reimportare: le giornate presenti vengono
sovrascritte, le impostazioni restano invariate.

## Sviluppo

Richiede Node.js 22.

```bash
npm install
npm run dev        # server di sviluppo
npm test           # test Vitest del modulo di calcolo
npm run build      # typecheck + build statica in dist/
npm run preview    # anteprima della build
npm run icone      # rigenera le icone PNG (script senza dipendenze)
```

Struttura:

```
src/core/      logica pura, senza DOM: tipi, macchina a stati, calcolo, riepilogo, CSV
src/storage/   localStorage, schema versionato e migrazioni
src/ui/        viste (Oggi/giornata, Storico, Impostazioni, Aiuto), dialoghi, editor
               (i testi dell'aiuto sono in src/ui/aiutoTesti.ts)
tests/         test Vitest
```

### Deploy su GitHub Pages

Il workflow `.github/workflows/deploy.yml` esegue test e build a ogni push su `main`
e pubblica `dist/` su GitHub Pages. Va configurato una volta sola:

1. Su GitHub apri **Settings → Pages**.
2. In **Build and deployment → Source** scegli **GitHub Actions**.

Il `base` in `vite.config.ts` è `/krumiro2.0/`. Se rinomini il repository, aggiornalo.

### Schema dei dati

I dati sono salvati nella chiave `timbrature` di localStorage, con un campo `version`.
Se lo schema cambia, aggiungi un passo in `MIGRAZIONI` (`src/storage/migrazioni.ts`)
e incrementa `VERSIONE_CORRENTE`. Se i dati salvati non sono leggibili, l'app ne conserva
una copia in una chiave `timbrature-corrotto-<timestamp>` e riparte da zero.
