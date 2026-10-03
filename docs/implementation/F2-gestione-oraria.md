# F2 — Gestione oraria di outatime

Obiettivo: krumiro2.0 calcola l'ora di uscita con le tre configurazioni di outatime v0.2.3 (Presenza, Presenza
FILM, Smart working), con tutti gli orari modificabili, e mostra "Ora di levarsi 👋", Effettivi, Straordinari e le
fasce obbligatorie scoperte. Pubblicazione su `https://gcampa.github.io/krumiro2.0/`.

Uscita (dall'interfaccia, `npm run dev`, `http://localhost:5173/krumiro2.0/`, dati puliti, giorno feriale, dopo le 15:01):
1. Impostazioni → Orari: FILM disattivato. Oggi: Aggiungi timbratura Entrata 08:25, Inizio pausa 13:00,
   Fine pausa 14:00 → "Ora di levarsi 👋" **17:30**.
2. Attivo FILM; giornata con Entrata 08:30, Inizio pausa 12:55, Fine pausa 13:10 → **17:05**.
3. Disattivo FILM; giornata in Smart working con Entrata 07:15, Inizio pausa 12:30, Fine pausa 15:00 → **17:45**.
4. Una giornata passata in Presenza con Entrata 08:00, Uscita 17:00 (nessuna pausa) mostra Effettivi 9h e
   l'avviso "Fascia obbligatoria 15:00–17:30 non coperta".
5. App pubblicata su `https://gcampa.github.io/krumiro2.0/` con versione 2.0.0 in Impostazioni.

Riferimenti: [regole-outatime.md](../architecture/regole-outatime.md), D21, D23, D27 (la tabella oraria di outatime è
la fonte di verità), D17,
[decisions.md](../architecture/decisions.md). Regole trasversali B1–B9, W1–W6 in [README.md](README.md).
Effort del progetto: **solo medium** (D24): ogni task tocca un modulo e ha formule, firme, testi e casi scritti qui.

**Allineamento al codice (pianificazione del 2026-10-03, `main` @ `1440056`, 92 test).** Da non "ripristinare":
- Il motore `calcolaGiornata` (`src/core/calcolo.ts`) resta: intervalli lavoro/pausa/permesso, sigaretta,
  ripartizioni. I task cambiano **da dove** legge i parametri (configurazione della giornata) e aggiungono
  FILM, uscita minima, effettivi, straordinari e fasce. Non riscrivere il motore.
- I 92 test esistenti restano con gli stessi risultati attesi: girano con la configurazione "legacy" di
  `tests/helpers.ts` (T2.03), che riproduce le regole di krumiro2.0 1.5.0.
- Le impostazioni vecchie (`pranzo`, `pausaDaScalare`, `orarioMinimoConteggio`, `pausaMinima`) restano nel tipo
  fino a T2.16, così ogni task compila; da T2.03 il calcolo non le legge più.
- `store.modificaGiornata` cancella una giornata vuota: da T2.11 una giornata con solo `smart` non è vuota, e una
  giornata nuova registra `film` dalle impostazioni (FILM salvato sul giorno, D23).
- Il CSV si legge per nome di colonna (`importaCsv`): le colonne nuove si aggiungono in fondo.

Valori predefiniti (D21, D23; minuti dalla mezzanotte tra parentesi):

| Campo | `presenza` | `film` | `smart` |
|---|---|---|---|
| `ingressoMinimo` | 08:30 (510) | 08:30 (510) | 07:00 (420) |
| `pausaMinima` | 60 | 30 | 30 |
| `pausaMinimaSoloInFascia` | false | true | false |
| `fasciaPranzo` | 12:00–14:30 (720–870) | 13:00–15:00 (780–900) | 12:00–14:30 (720–870) |
| `pausaDaScalare` | 60 | 30 | 30 |
| `uscitaMinima` | 17:30 (1050) | 17:00 (1020) | 17:30 (1050) |
| `fasceObbligatorie` | 10:00–12:30, 15:00–17:30 (600–750, 900–1050) | 10:00–12:30, 15:00–17:00 (600–750, 900–1020) | 10:00–12:30, 15:00–17:30 (600–750, 900–1050) |

Configurazione "legacy" dei test (riproduce 1.5.0): `ingressoMinimo` 510, `pausaMinima` 30,
`pausaMinimaSoloInFascia` false, `fasciaPranzo` 720–870, `pausaDaScalare` 60, `uscitaMinima` 0,
`fasceObbligatorie` [].

---

## T2.01 — Tipi e valori predefiniti delle configurazioni          Effort: medium
Riferimenti: regole-outatime.md § 1–2; D21; D23.
1. **Core** `src/core/tipi.ts`, dopo `IMPOSTAZIONI_PREDEFINITE` aggiungere (e prima di essa i tipi):
   ```ts
   /** Configurazioni orarie di outatime: presenza, presenza FILM, smart working. */
   export type IdConfigurazione = 'presenza' | 'film' | 'smart';
   export const ID_CONFIGURAZIONI: readonly IdConfigurazione[] = ['presenza', 'film', 'smart'];
   export const ETICHETTE_CONFIGURAZIONE: Record<IdConfigurazione, string> = {
     presenza: 'Presenza',
     film: 'Presenza FILM',
     smart: 'Smart working',
   };
   export interface Fascia {
     inizio: number;
     fine: number;
   }
   export interface ConfigurazioneOraria {
     /** Le timbrature precedenti contano da quest'ora. */
     ingressoMinimo: number;
     /** Una pausa più breve conta come questa durata. */
     pausaMinima: number;
     /** FILM: la pausa minima vale solo per i minuti di pausa dentro la fascia pranzo. */
     pausaMinimaSoloInFascia: boolean;
     fasciaPranzo: Fascia;
     /** Pausa aggiunta all'uscita se non è ancora fatta; quota di permesso che diventa pausa. */
     pausaDaScalare: number;
     /** L'ora di levarsi non è mai prima di questa (0 = nessuna). */
     uscitaMinima: number;
     /** Fasce da coprire con lavoro o permesso; al massimo 4. */
     fasceObbligatorie: Fascia[];
   }
   ```
   `CONFIGURAZIONI_PREDEFINITE: Record<IdConfigurazione, ConfigurazioneOraria>` con i valori della tabella in testa
   a questo file. In `Impostazioni` aggiungere `film: boolean;` e
   `configurazioni: Record<IdConfigurazione, ConfigurazioneOraria>;` (i campi vecchi restano).
   In `IMPOSTAZIONI_PREDEFINITE`: `film: false`, `configurazioni: CONFIGURAZIONI_PREDEFINITE`.
   In `Giornata` aggiungere `/** Giornata in smart working. */ smart?: true;` e
   `/** FILM salvato sul giorno; assente = segue l'impostazione FILM (giornata non ancora salvata). */ film?: boolean;`.
2. **Core** nuovo `src/core/configurazioni.ts`:
   ```ts
   export function configurazioneGiornata(g: Giornata, imp: Impostazioni): IdConfigurazione {
     if (g.smart === true) return 'smart';
     return (g.film ?? imp.film) ? 'film' : 'presenza';
   }
   export function clonaConfigurazione(c: ConfigurazioneOraria): ConfigurazioneOraria {
     return { ...c, fasciaPranzo: { ...c.fasciaPranzo }, fasceObbligatorie: c.fasceObbligatorie.map((f) => ({ ...f })) };
   }
   ```
3. **Storage** `src/storage/migrazioni.ts`, `clonaImpostazioni`: aggiungere
   `configurazioni: { presenza: clonaConfigurazione(i.configurazioni.presenza), film: clonaConfigurazione(i.configurazioni.film), smart: clonaConfigurazione(i.configurazioni.smart) }`.
   `normalizzaImpostazioni` per ora copia `film` e `configurazioni` dai predefiniti (la validazione è T2.02).
4. **Test** nuovo `tests/configurazioni.test.ts`:
   - giornata senza `smart` e senza `film`: impostazioni `film: false` → `'presenza'`, `film: true` → `'film'`;
     giornata `film: false` con impostazioni `film: true` → `'presenza'`; giornata `film: true` con impostazioni
     `film: false` → `'film'`; giornata `smart: true, film: true` → `'smart'`.
   - `clonaConfigurazione(CONFIGURAZIONI_PREDEFINITE.film)` modificata (`fasceObbligatorie[0].inizio = 0`) non cambia
     `CONFIGURAZIONI_PREDEFINITE.film.fasceObbligatorie[0].inizio` (resta 600).
   - `CONFIGURAZIONI_PREDEFINITE.film.uscitaMinima === 1020` e `.smart.ingressoMinimo === 420`.
**Verifica**: `npm test` (93 + nuovi, tutti verdi; `migrazioni.test.ts` "dati senza version" deve restare verde) ·
`npm run typecheck` senza errori.
**Fuori scope**: calcolo, interfaccia, validazione delle configurazioni importate.

## T2.02 — Schema v2: migrazione e validazione                       Effort: medium
Riferimenti: D2, D21; `src/storage/migrazioni.ts`.
1. **Storage** `src/storage/migrazioni.ts`: `VERSIONE_CORRENTE = 2`. `MIGRAZIONI[1]` porta a `version: 2` e mette
   `film: false` in ogni giornata di `d.giornate` che sia un oggetto (le giornate già salvate restano Presenza, D23);
   le impostazioni v1 non hanno `film`/`configurazioni`: li riempie `normalizzaImpostazioni` con i predefiniti di
   outatime. Il passo `0` resta `version: 1`.
2. `normalizzaImpostazioni`: `imp.film = v.film === true`. Per ogni `id` di `ID_CONFIGURAZIONI`, se
   `isObj(v.configurazioni) && isObj(v.configurazioni[id])` normalizzare con la nuova
   `normalizzaConfigurazione(grezzo, predefinita): ConfigurazioneOraria`:
   - `ingressoMinimo`: `intIn(…, 0, 1439)`; `pausaMinima`: `intIn(…, 0, 240)`; `pausaDaScalare`: `intIn(…, 0, 240)`;
     `uscitaMinima`: `intIn(…, 0, 1439)`; `pausaMinimaSoloInFascia`: `=== true`;
     `fasciaPranzo`: valida se `inizio` 0–1439, `fine` 0–1440, `fine > inizio`;
     `fasceObbligatorie`: array, al massimo i primi 4 elementi validi come `fasciaPranzo`, gli altri scartati.
   - ogni valore non valido → quello di `predefinita` (clonata).
3. `normalizzaGiornata`: se `g.smart === true` la giornata ha `smart: true`, altrimenti il campo non c'è; se
   `typeof g.film === 'boolean'` la giornata ha `film: g.film`, altrimenti il campo non c'è.
4. **Test** `tests/migrazioni.test.ts`:
   - "dati senza version" e tutti gli altri test esistenti restano invariati, salvo `version: 1` atteso → ora
     `VERSIONE_CORRENTE` (2).
   - v1 con `impostazioni: { pausaMinima: 20, tolleranzaSigaretta: 5 }` → `film` false, `configurazioni` uguale a
     `CONFIGURAZIONI_PREDEFINITE`, `tolleranzaSigaretta` 5.
   - v2 con `configurazioni.film.pausaMinima: 45` e `configurazioni.smart.uscitaMinima: 2000` → film 45, smart 1050.
   - v2 con 5 fasce valide in `presenza` → ne restano 4; fascia `{ inizio: 900, fine: 800 }` → scartata.
   - giornata con `smart: true` → conservato; con `smart: 'si'` → assente.
   - v1 con una giornata → dopo la migrazione `film: false`; v2 con giornata `film: true` → conservato; `film: 'si'`
     → assente.
   - `{ version: 3 }` → `ErroreMigrazione`.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: rimozione dei campi vecchi (T2.16), interfaccia.

## T2.03 — Calcolo: parametri dalla configurazione della giornata      Effort: medium
Riferimenti: regole-outatime.md § 2; `src/core/calcolo.ts`.
1. **Test helper** `tests/helpers.ts`:
   ```ts
   /** Regole di krumiro2.0 1.5.0: i test storici girano con queste. */
   export const CONFIGURAZIONE_LEGACY: ConfigurazioneOraria = {
     ingressoMinimo: 510, pausaMinima: 30, pausaMinimaSoloInFascia: false,
     fasciaPranzo: { inizio: 720, fine: 870 }, pausaDaScalare: 60, uscitaMinima: 0, fasceObbligatorie: [],
   };
   export function impostazioni(modifiche: Partial<Impostazioni> = {}, presenza: Partial<ConfigurazioneOraria> = {}): Impostazioni {
     const base = clonaImpostazioni(IMPOSTAZIONI_PREDEFINITE);
     base.configurazioni.presenza = { ...clonaConfigurazione(CONFIGURAZIONE_LEGACY), ...presenza };
     return { ...base, ...modifiche };
   }
   /** Impostazioni predefinite di outatime (nessuna modifica legacy). */
   export function impostazioniOutatime(modifiche: Partial<Impostazioni> = {}): Impostazioni {
     return { ...clonaImpostazioni(IMPOSTAZIONI_PREDEFINITE), ...modifiche };
   }
   ```
   Chiamate da aggiornare: `tests/calcolo.test.ts` riga con `orarioMinimoConteggio: h('07:30')` →
   `impostazioni({}, { ingressoMinimo: h('07:30') })`; riga con `pranzo: { inizio: h('13:00'), fine: h('14:00') }, pausaDaScalare: 45`
   → `impostazioni({}, { fasciaPranzo: { inizio: h('13:00'), fine: h('14:00') }, pausaDaScalare: 45 })`;
   `tests/aiuto.test.ts` riga con `pranzo: { inizio: 750, fine: 840 }, pausaDaScalare: 45` → resta com'è in
   questo task (l'aiuto legge ancora i campi vecchi fino a T2.15).
2. **Core** `src/core/calcolo.ts`, `calcolaGiornata`: in testa
   `const cfg = imp.configurazioni[configurazioneGiornata(giornata, imp)];` e sostituire **tutte** le letture:
   `imp.orarioMinimoConteggio` → `cfg.ingressoMinimo`; `imp.pausaMinima` → `cfg.pausaMinima`;
   `imp.pausaDaScalare` → `cfg.pausaDaScalare`; `imp.pranzo.inizio/fine` → `cfg.fasciaPranzo.inizio/fine`.
   Dopo la modifica `grep -n "imp\.\(pranzo\|pausaDaScalare\|pausaMinima\|orarioMinimoConteggio\)" src/core/calcolo.ts`
   non trova nulla.
3. **Test** in `tests/calcolo.test.ts`, nuovo `describe('configurazione della giornata')`:
   - giornata `smart: true`, `impostazioni({}, {})` con `configurazioni.smart.ingressoMinimo = h('07:00')`:
     Entrata 07:15, Inizio pausa 12:00, Fine pausa 13:00, adesso 14:00 → `lavorati` 345 (dalle 07:15, non dalle 08:30).
   - stessa giornata senza `smart` → `lavorati` 270 (dalle 08:30, legacy).
**Verifica**: `npm test` → i 92 test storici verdi con gli stessi valori attesi + nuovi · `npm run typecheck`.
**Fuori scope**: FILM, uscita minima, effettivi, interfaccia.

## T2.04 — Calcolo: pausa minima FILM                                  Effort: medium
Riferimenti: regole-outatime.md § 1–2; D23 (Q25: i minuti dopo la fascia non contano, come outatime).
1. **Core** `src/core/calcolo.ts`, passo 2 ("Lavoro e pause"). Oggi la pausa minima si applica a ogni pausa
   conclusa. Con `cfg.pausaMinimaSoloInFascia` la regola vale sulla giornata intera:
   - nel ciclo esistente, per gli intervalli `pausa`: se `cfg.pausaMinimaSoloInFascia` è vero, una pausa **aperta**
     si somma a `pausaRegistrataMin` come oggi e una pausa **chiusa** si salta (`continue`); se è falso il ciclo
     resta identico a oggi;
   - dopo il ciclo:
   ```ts
   // FILM: minimo sui minuti di pausa dentro la fascia; i minuti dopo la fascia non riducono il lavoro.
   const chiuse = intervalli.filter((i) => i.tipo === 'pausa' && !i.aperto);
   if (cfg.pausaMinimaSoloInFascia && chiuse.length > 0) {
     const { inizio, fine } = cfg.fasciaPranzo;
     const totale = chiuse.reduce((s, i) => s + (i.a - i.da), 0);
     const dentro = chiuse.reduce((s, i) => s + sovrapposizione(i.da, i.a, inizio, fine), 0);
     const dopo = chiuse.reduce((s, i) => s + sovrapposizione(i.da, i.a, fine, MINUTI_GIORNO), 0);
     const mancante = Math.max(0, cfg.pausaMinima - dentro);
     penalitaPausa += mancante - dopo;
     pausaRegistrataMin += totale - dopo + mancante;
   }
   ```
   `penalitaPausa` può diventare negativa: `lavoroNetto = Math.max(0, lavoroLordo - penalitaPausa)` resta com'è.
   Importare `MINUTI_GIORNO` da `./tempo`.
2. **Test** `tests/calcolo.test.ts`, `describe('FILM')` con `impostazioniOutatime({ film: true })`, adesso = fine
   pausa + 1 min, uscita attesa (`formattaOra(r.uscitaPrevista)`):
   | Entrata | Pausa | Atteso |
   |---|---|---|
   | 09:00 | 13:00–13:30 | 17:30 |
   | 08:20 | 13:00–13:30 | 17:00 |
   | 08:30 | 12:55–13:10 | 17:05 |
   | 08:30 | 13:01–13:42 | 17:11 |
   | 08:30 | 12:30–13:00 | 17:30 |
   | 09:00 | 13:01–13:42 | 17:41 (Q26) |
   | 08:30 | 14:30–15:30 | 17:00 (Q25) |
   Nota: con l'uscita minima non ancora implementata (T2.05) questi casi passano già, perché nessuno scende sotto 17:00.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: uscita minima, stima durante la pausa, interfaccia.

## T2.05 — Calcolo: uscita minima e stima durante la pausa              Effort: medium
Riferimenti: regole-outatime.md § 2; D23.
1. **Core** `src/core/tipi.ts`, `RisultatoGiornata`: aggiungere
   `configurazione: IdConfigurazione;` e `/** True se l'ora di levarsi è stata portata all'uscita minima. */ uscitaPrevistaMinima: boolean;`.
2. **Core** `src/core/calcolo.ts`, passo 5 ("Uscita prevista"):
   - ramo `IN_PAUSA`: sostituire il calcolo con una simulazione del rientro:
     ```ts
     const rientro = pausaInCorso ? Math.max(ora, pausaInCorso.da + cfg.pausaMinima) : ora;
     const simulata: Giornata = { ...giornata, eventi: [...giornata.eventi, { id: '__rientro__', tipo: 'FINE_PAUSA', minuti: rientro }] };
     const sim = calcolaGiornata(simulata, imp, rientro);
     uscitaPrevista = sim.uscitaPrevista;
     uscitaPrevistaMinima = sim.uscitaPrevistaMinima;
     ```
     (`let uscitaPrevistaMinima = false;` dichiarato accanto a `uscitaPrevistaConPausa`).
   - dopo entrambi i rami, se `uscitaPrevista !== null && cfg.uscitaMinima > 0 && dovuti > 0 && uscitaPrevista < cfg.uscitaMinima`:
     `uscitaPrevista = cfg.uscitaMinima; uscitaPrevistaMinima = true;` (nel ramo `IN_PAUSA` la simulazione
     l'ha già applicata: la condizione resta falsa).
   - nel risultato: `configurazione: configurazioneGiornata(giornata, imp)`, `uscitaPrevistaMinima`.
3. **Test** `tests/calcolo.test.ts`:
   - `describe('uscita minima')` con `impostazioniOutatime()` (Presenza): Entrata 08:00, pausa 13:30–13:40, adesso
     13:41 → 17:30 e `uscitaPrevistaMinima` false (17:30 è il risultato del calcolo); Smart working (`smart: true`):
     Entrata 08:25, pausa 13:00–14:00, adesso 14:01 → 17:30 e `uscitaPrevistaMinima` true.
   - giorno con ore dovute 360 (venerdì 6h, `minutiDovuti.perGiorno[5] = 360`, data `2026-10-02`): Entrata 08:30,
     pausa 12:30–13:30, adesso 13:31 → 17:30 e `uscitaPrevistaMinima` true (come outatime, D27).
   - giorno libero (`SABATO`, dovute 0): Entrata 09:00, adesso 10:00 → 09:00 e `uscitaPrevistaMinima` false
     (l'uscita minima non vale con 0 ore dovute).
   - durante la pausa, Presenza outatime: Entrata 08:30, Inizio pausa 13:00, adesso 13:20 → 17:30
     (rientro stimato 14:00).
   - i test storici (legacy, `uscitaMinima` 0) restano verdi.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: effettivi, fasce, interfaccia.

## T2.06 — Calcolo: effettivi e straordinari                           Effort: medium
Riferimenti: regole-outatime.md § 3.
1. **Core** `src/core/tipi.ts`, `RisultatoGiornata`: `/** Minuti reali tra entrate e uscite, senza minimi. */ effettivi: number;`
   e `/** Effettivi oltre le ore dovute. */ straordinari: number;`.
2. **Core** `src/core/calcolo.ts`, nuova funzione esportata:
   ```ts
   /** Somma dei tratti di lavoro conclusi, con gli orari reali (come EFFETTIVI di outatime: solo coppie complete). */
   export function minutiEffettivi(eventiValidi: readonly Evento[]): number {
     let totale = 0;
     let inizio: number | null = null;
     for (const e of eventiValidi) {
       if (e.tipo === 'ENTRATA' || e.tipo === 'FINE_PAUSA' || e.tipo === 'RIENTRO_PERMESSO') inizio = e.minuti;
       else if (inizio !== null) {
         totale += Math.max(0, e.minuti - inizio);
         inizio = null;
       }
     }
     return totale;
   }
   ```
   In `calcolaGiornata`: `effettivi = minutiEffettivi(analisi.eventiValidi)`,
   `straordinari = Math.max(0, effettivi - dovuti)`.
3. **Test**: Entrata 08:11, Inizio pausa 13:20, Fine pausa 13:46, Uscita 18:39 (giornata passata) → effettivi 602,
   straordinari 122 (il caso `getUnpaidTime` di outatime: 309 + 293 minuti); oggi Entrata 08:00, Inizio pausa 12:00,
   adesso 12:30 → effettivi 240; oggi Entrata 08:00, adesso 09:30 → effettivi 0 (tratto aperto non contato, come
   outatime); sabato (`SABATO`, dovute 0) Entrata 09:00 Uscita 11:00 → straordinari 120.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: interfaccia, riepilogo mensile.

## T2.07 — Calcolo: fasce obbligatorie scoperte                        Effort: medium
Riferimenti: D23 (fasce per configurazione, solo avviso).
1. **Core** `src/core/tipi.ts`, `RisultatoGiornata`: `/** Fasce obbligatorie concluse e non coperte. */ fasceScoperte: Fascia[];`.
2. **Core** nuovo `src/core/fasce.ts`:
   ```ts
   /** Tratti coperti con orari reali: lavoro, permessi intermedi, permesso a inizio giornata, uscita anticipata. */
   export function trattiCoperti(g: Giornata, eventiValidi: readonly Evento[], adesso: number | null): Fascia[]
   export function fasceScoperte(fasce: readonly Fascia[], tratti: readonly Fascia[], adesso: number | null): Fascia[]
   ```
   - `trattiCoperti`: un tratto si apre a `ENTRATA`, `FINE_PAUSA`, `USCITA_PERMESSO`, `RIENTRO_PERMESSO` e si
     chiude all'evento valido successivo (`INIZIO_PAUSA` chiude lavoro; `USCITA_PERMESSO` chiude lavoro e apre
     permesso; `RIENTRO_PERMESSO` chiude permesso e apre lavoro; `USCITA` chiude); `USCITA_ANTICIPATA` aggiunge il
     tratto `[minuti, 1440]`; tratto aperto finale fino ad `adesso` (se null, nessuno); se
     `g.permessoInizioMinuti > 0` e c'è un'`ENTRATA`, tratto `[0, prima entrata]`.
   - `fasceScoperte`: considera solo le fasce con `adesso === null || fascia.fine <= adesso`; una fascia è scoperta
     se la somma delle sovrapposizioni con i tratti è minore di `fine − inizio`.
   In `calcolaGiornata`: `fasceScoperte = dovuti > 0 && analisi.eventiValidi.length > 0 ? fasceScoperte(cfg.fasceObbligatorie, trattiCoperti(giornata, analisi.eventiValidi, adesso), adesso) : []`.
3. **Test** nuovo `tests/fasce.test.ts` con le fasce 600–750 e 900–1050:
   - giornata passata Entrata 08:00, Uscita 17:00 → scoperta solo `{ 900, 1050 }`.
   - Entrata 09:00, Inizio pausa 13:00, Fine pausa 14:00, Uscita 17:30 → nessuna.
   - Entrata 09:00, Uscita in permesso 11:00, Rientro 12:00, Uscita 17:30 → nessuna (permesso copre).
   - Entrata 09:00, Uscita anticipata 16:00 → nessuna.
   - oggi, adesso 12:00, Entrata 10:30 → nessuna (la fascia 10:00–12:30 non è conclusa).
   - oggi, adesso 13:00, Entrata 10:30 → scoperta `{ 600, 750 }`.
   - permesso a inizio giornata 120, Entrata 10:30, Uscita 17:30 → nessuna.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: interfaccia.

## T2.08 — Casi di riferimento di outatime                             Effort: medium
Riferimenti: regole-outatime.md § 2 (tabella dei 17 casi).
1. **Test** nuovo `tests/outatime.test.ts`: `it.each` sui 17 casi della tabella di regole-outatime.md § 2, colonna
   "outatime = formula", con `impostazioniOutatime()`; giorno `GIOVEDI`; Smart working = giornata con
   `smart: true`; FILM = `impostazioniOutatime({ film: true })`; eventi Entrata, Inizio pausa, Fine pausa; adesso =
   fine pausa + 1 min; atteso `formattaOra(r.uscitaPrevista)` (formato `HH:MM`, es. `'08:25'` in ingresso,
   `'17:30'` atteso). Più i casi Q25 (08:30 · 14:30–15:30 → 17:00, FILM) e Q26 (09:00 · 13:01–13:42 → 17:41, FILM).
2. Nessuna modifica a `src/`: se un caso fallisce, è un Dubbio per la plenaria (non correggere il calcolo).
**Verifica**: `npm test` → 19 casi nuovi verdi.
**Fuori scope**: qualsiasi modifica al codice applicativo.

## T2.09 — Impostazioni → Orari: FILM e configurazioni                 Effort: medium
Riferimenti: D21, D23; `src/ui/impostazioni.ts`. Regole W1–W4.
1. **UI** `src/ui/impostazioni.ts`: togliere le schede "Pausa pranzo" e "Conteggio" (tranne il pulsante di
   ripristino, che si sposta in "Orari"). Aggiungere dopo "Ore dovute" la scheda:
   - `h2.titolo-sezione` **"Orari"**; riga `'Abilita FILM'` con `input type=checkbox` (`aria-label` "Abilita FILM"),
     nota `'pausa di 30 min tra 13:00 e 15:00 nei giorni in presenza, da oggi in poi'`; al cambio
     `store.modificaImpostazioni((i) => void (i.film = check.checked));`, poi, se esiste già la giornata di oggi
     (`store.giornate[adesso.data]`), `store.modificaGiornata(adesso.data, (g) => void (g.film = check.checked));`,
     poi `salvato();`. Le giornate passate non cambiano (D23).
   - per ogni `id` di `ID_CONFIGURAZIONI` un `details.configurazione` con `summary` =
     `` `${ETICHETTE_CONFIGURAZIONE[id]} · ingresso ${formattaOra(c.ingressoMinimo)} · pausa ${c.pausaMinima} min · uscita ${c.uscitaMinima > 0 ? formattaOra(c.uscitaMinima) : 'libera'}` ``
     e le righe (con `riga(...)`, `inputHHMM`, `inputMinuti` esistenti), ognuna salva con
     `store.modificaImpostazioni((i) => void (i.configurazioni[id].<campo> = v)); salvato();`:
     | Etichetta | Controllo | Nota |
     |---|---|---|
     | `Ingresso minimo` | `inputHHMM` | `le timbrature precedenti contano da quest'ora` |
     | `Pausa minima (min)` | `inputMinuti(…, 240, 5)` | `una pausa più breve conta come questa durata` |
     | `Pausa minima solo nella fascia pranzo` | checkbox | `regola FILM: conta solo la pausa dentro la fascia` |
     | `Inizio fascia pranzo` / `Fine fascia pranzo` | `inputHHMM` | — (stessi controlli e toast di oggi: `L'inizio deve precedere la fine`, `La fine deve seguire l'inizio`) |
     | `Pausa prevista (min)` | `inputMinuti(…, 240, 5)` | `si aggiunge all'uscita se la pausa non è ancora fatta` |
     | `Uscita minima` | `inputHHMM` | `00:00 = nessuna; non vale nei giorni liberi (0 ore dovute)` |
   - pulsante `Ripristina valori predefiniti` con conferma: titolo `Ripristinare le impostazioni?`, testo
     `Tornano i valori di outatime (Presenza 08:30–17:30 con 60 min di pausa, FILM 17:00 con 30 min tra 13:00 e 15:00, Smart working dalle 07:00), FILM spento, 8h lun–ven e tolleranza sigaretta 11 min. Le timbrature e il FILM salvato sulle giornate non vengono toccati.`
2. **Stile** `src/style.css`, in coda: `details.configurazione { border-top: 1px solid var(--bordo); padding: 8px 0; }`
   e `details.configurazione > summary { cursor: pointer; font-weight: 600; padding: 8px 0; }` (`--bordo` esiste
   già in `:root` e nel tema scuro).
3. **Test**: nessun test automatico (vista DOM). 
**Verifica**: `npm run build` · `npm test` · nel browser (se oggi è sabato o domenica, prima Impostazioni → Ore dovute
di quel giorno: togli "predefinito" e imposta 08:00): Impostazioni → Orari → attivo "Abilita FILM" → Oggi con
Entrata 08:30, Inizio pausa 12:55, Fine pausa 13:10 mostra 17:05; apro "Presenza FILM", porto "Uscita minima" a 18:00
→ Oggi mostra 18:00. Ripristina → Oggi torna 17:05 (la giornata di oggi resta FILM: è salvato sul giorno) e
"Abilita FILM" è spento.
**Fuori scope**: fasce obbligatorie (T2.10), etichette della schermata Oggi (T2.12).

## T2.10 — Impostazioni → Orari: fasce obbligatorie                    Effort: medium
Riferimenti: D23. Regole W1–W4.
1. **UI** `src/ui/impostazioni.ts`, dentro ogni `details.configurazione` (T2.09), dopo "Uscita minima":
   - titolo `p.nota` `Fasce obbligatorie (avviso se restano scoperte):`
   - per ogni fascia `k`: riga `Fascia ${k + 1}` con due `selettoreOra` (aria `Fascia ${k + 1} inizio` /
     `Fascia ${k + 1} fine`) e pulsante `btn btn-secondario` `Rimuovi`. Al cambio: se `inizio >= fine` →
     `toast('L\'inizio deve precedere la fine')` e nessun salvataggio; altrimenti salva e `salvato()`.
   - pulsante `+ Aggiungi fascia` (nascosto se le fasce sono già 4): aggiunge `{ inizio: 600, fine: 750 }`.
   - dopo `Rimuovi` / `Aggiungi` la vista si ridisegna da sola (lo store notifica `render`).
**Verifica**: `npm run build` · `npm test` · nel browser: Smart working → Rimuovi la fascia 2 → resta "Fascia 1
10:00–12:30"; `+ Aggiungi fascia` 4 volte → al quarto il pulsante sparisce; fascia con inizio 16:00 e fine 15:00 →
toast "L'inizio deve precedere la fine" e valore non salvato (ricaricando la pagina resta il precedente).
**Fuori scope**: avviso nella schermata del giorno (T2.12).

## T2.11 — Giornata: smart working, FILM del giorno e configurazione   Effort: medium
Riferimenti: D21; `src/ui/giorno.ts`, `src/storage/store.ts`.
1. **Storage** `src/storage/store.ts`, `modificaGiornata`: `const esisteva = data in this.dati.giornate;` prima della
   modifica; dopo `modifica(g)`, se `!esisteva && g.film === undefined` → `g.film = this.dati.impostazioni.film`
   (una giornata nuova registra il FILM del momento). La giornata si cancella solo se
   `g.eventi.length === 0 && g.permessoInizioMinuti === 0 && g.smart !== true`.
2. **UI** `src/ui/giorno.ts`, `vistaGiorno`: sottotitolo
   `` `${formattaDataLunga(data)} · ${ETICHETTE_CONFIGURAZIONE[r.configurazione]}` ``; sotto il sottotitolo un
   `button.chip` con testo `🏠 Smart working`, `aria-pressed` = `String(giornata.smart === true)`; al tocco
   `store.modificaGiornata(data, (g) => { if (g.smart) delete g.smart; else g.smart = true; })` e
   `toast(giornata.smart ? 'Smart working tolto' : 'Smart working attivato')`. Accanto, solo se la giornata non è in
   smart working, un `button.chip` `FILM` con `aria-pressed` = `String(r.configurazione === 'film')`; al tocco
   `store.modificaGiornata(data, (g) => void (g.film = !(g.film ?? store.impostazioni.film)))` e
   `toast(r.configurazione === 'film' ? 'FILM tolto per questa giornata' : 'FILM attivato per questa giornata')`.
   Entrambi i pulsanti valgono per oggi e per le giornate passate.
3. **Test**: nessun test automatico (lo store usa `localStorage` e non ha test); la Verifica nel browser copre la
   regola di cancellazione.
**Verifica**: `npm run build` · `npm test` · nel browser: Oggi senza timbrature → tocco "🏠 Smart working" → il
sottotitolo finisce con "· Smart working" e ricaricando resta; tocco di nuovo → "· Presenza" (o "· Presenza FILM"
con FILM attivo); tocco "FILM" → il sottotitolo passa da "· Presenza" a "· Presenza FILM" e viceversa, solo per
quella giornata (una giornata passata non cambia).
**Fuori scope**: CSV (T2.14), etichette dell'uscita (T2.12).

## T2.12 — Giornata: "Ora di levarsi 👋", effettivi, straordinari, fasce   Effort: medium
Riferimenti: Q28; `src/ui/giorno.ts`.
1. **UI** `src/ui/giorno.ts`, `schedaRiepilogo`:
   - `'Uscita prevista'` → `'Ora di levarsi 👋'`.
   - nota: se `r.uscitaPrevistaMinima` → `'uscita minima della configurazione'`; il ramo
     `uscitaPrevistaConPausa` usa `store.impostazioni.configurazioni[r.configurazione].pausaDaScalare` al posto di
     `store.impostazioni.pausaDaScalare`. Ordine dei rami: `IN_PAUSA`, `uscitaPrevistaMinima`,
     `uscitaPrevistaConPausa`, `passata`.
   - in `dl.statistiche` dopo `Permesso`: `stat('🐫 Effettivi', formattaDurata(r.effettivi))` e
     `stat('Straordinari', formattaDurata(r.straordinari))`.
2. **UI** nuova funzione `boxFasce(fasce: Fascia[]): HTMLElement` (stessa struttura di `boxProblemi`, classe
   `scheda avviso-problemi`, `role: 'status'`): etichetta `⚠︎ Fasce obbligatorie`, un `li` per fascia
   `` `Fascia obbligatoria ${formattaOra(f.inizio)}–${formattaOra(f.fine)} non coperta` ``, nota
   `Copri la fascia con lavoro o permesso, oppure cambia le fasce in Impostazioni → Orari.`. In `vistaGiorno`
   dopo `boxProblemi`: `r.fasceScoperte.length > 0 ? boxFasce(r.fasceScoperte) : null`.
**Verifica**: `npm run build` · `npm test` · nel browser: Oggi con Entrata 08:30 → la scheda dice "Ora di levarsi 👋";
giornata passata (Storico → + Giornata dimenticata) con Entrata 08:00, Uscita 17:00 → Effettivi 9h, Straordinari 1h,
avviso "Fascia obbligatoria 15:00–17:30 non coperta".
**Fuori scope**: storico mensile (T2.13), testi dell'aiuto (T2.15).

## T2.13 — Storico: effettivi e straordinari del mese                  Effort: medium
Riferimenti: `src/core/riepilogo.ts`, `src/ui/storico.ts`.
1. **Core** `src/core/riepilogo.ts`, `RiepilogoMese`: `effettivi: number; straordinari: number;`. Nel ciclo:
   `effettivi += risultato.effettivi`; `straordinari` con la stessa regola del saldo (la giornata di oggi entra solo
   se `CHIUSA`).
2. **UI** `src/ui/storico.ts`, scheda "Riepilogo del mese": dopo `Ore lavorate` aggiungere
   `stat('🐫 Ore effettive', formattaDurata(rm.effettivi))` e `stat('Straordinari', formattaDurata(rm.straordinari))`.
3. **Test** nuovo `tests/riepilogo.test.ts` (oggi `riepilogoMese` è usato solo indirettamente da `tests/csv.test.ts`),
   con `impostazioni()`: mese `2026-10`, giornate passate `2026-10-01` (Entrata 08:00, Uscita 17:00 → effettivi 540,
   straordinari 60) e `2026-10-02` (Entrata 08:30, Uscita 17:00 → 510, 30), oggi `2026-10-05` con Entrata 08:00,
   Inizio pausa 12:00, adesso 12:30 (effettivi 240, giornata non chiusa) → `effettivi` 1290, `straordinari` 90.
**Verifica**: `npm test` · `npm run build` · nel browser: Storico del mese mostra "Ore effettive" e "Straordinari".
**Fuori scope**: CSV.

## T2.14 — CSV: configurazione, effettivi, straordinari                Effort: medium
Riferimenti: `src/core/csv.ts`.
1. **Core** `src/core/csv.ts`: in fondo a `INTESTAZIONE` aggiungere `'Configurazione'`, `'Ore effettive'`,
   `'Straordinari'`; nelle righe `ETICHETTE_CONFIGURAZIONE[r.configurazione]`, `oreDecimali(r.effettivi)`,
   `oreDecimali(r.straordinari)`.
2. `importaCsv`: `const iConf = intest.indexOf('configurazione')`; valore (trim, minuscolo) `'smart working'` →
   `smart: true, film: false`; `'presenza film'` → `film: true`; ogni altro valore, o colonna assente → `film: false`.
   Le colonne "Ore effettive" e "Straordinari" si ignorano in importazione.
3. **Test** `tests/csv.test.ts`: export di una giornata `smart: true` → la riga contiene `Smart working`; import di
   quel CSV → `smart: true`; giornata `film: true` → riga con `Presenza FILM` → reimportata `film: true`; import di un
   CSV della 1.5.0 (intestazione senza le colonne nuove, già presente nei test) → nessun errore, nessun `smart`,
   `film: false`.
**Verifica**: `npm test` · `npm run typecheck`.
**Fuori scope**: backup JSON (già completo tramite lo store).

## T2.15 — Aiuto: testi della gestione oraria                          Effort: medium
Riferimenti: `src/ui/aiutoTesti.ts`, `tests/aiuto.test.ts`.
1. **UI** `src/ui/aiutoTesti.ts`, `vociAiuto`: `const cfg = imp.configurazioni[imp.film ? 'film' : 'presenza'];`
   e le variabili `pranzo`, `scalare`, `minimo`, `pausaMin` leggono `cfg.fasciaPranzo`, `cfg.pausaDaScalare`,
   `cfg.ingressoMinimo`, `cfg.pausaMinima` invece dei campi vecchi.
2. Testi da cambiare (sostituzione esatta):
   - voce `pausa`: la riga dell'esempio resta; `"inclusa pausa pranzo"` invariato.
   - voce `uscita-prevista`: `domanda` → `'Come viene calcolata l\'ora di levarsi?'`; `testo` →
     `'Ora di levarsi = adesso + (ore dovute − ore coperte).'`, la riga della pausa invariata, poi
     `` `Non è mai prima dell'uscita minima della configurazione (${cfg.uscitaMinima > 0 ? formattaOra(cfg.uscitaMinima) : 'nessuna'}), salvo nei giorni liberi.` ``,
     poi `'Quando l\'orario supera l\'ora di levarsi compare "Ore completate alle…": da lì in poi è straordinario.'`.
   - voce `orario-minimo`: `'L\'orario si cambia in Impostazioni → Conteggio.'` → `'L\'orario si cambia in Impostazioni → Orari.'`.
   - voce `pausa-minima`: `'Esempio: pausa 12:30–12:45 (15 min) → conta 30 min, quindi 15 min in meno di lavoro.'` →
     `` `Esempio: pausa di 15 min → conta ${pausaMin}, quindi ${formattaDurata(Math.max(0, cfg.pausaMinima - 15))} in meno di lavoro.` ``;
     `'Il valore si cambia in Impostazioni → Pausa pranzo.'` → `'Il valore si cambia in Impostazioni → Orari.'`.
   - nuova voce dopo `uscita-prevista`: `id: 'configurazioni'`, `sezione: 'Come si calcola'`,
     `domanda: 'Presenza, FILM e smart working: cosa cambia?'`, `testo`: una riga per configurazione
     `` `${ETICHETTE_CONFIGURAZIONE[id]}: ingresso dalle ${formattaOra(c.ingressoMinimo)}, pausa minima ${formattaDurata(c.pausaMinima)}${c.pausaMinimaSoloInFascia ? ` tra ${formattaOra(c.fasciaPranzo.inizio)} e ${formattaOra(c.fasciaPranzo.fine)}` : ''}, uscita minima ${c.uscitaMinima > 0 ? formattaOra(c.uscitaMinima) : 'nessuna'}.` ``,
     poi `'FILM si attiva in Impostazioni → Orari e vale da oggi in poi: ogni giornata ricorda se era FILM, e si può cambiare con il pulsante FILM nella giornata. Lo smart working si sceglie giorno per giorno con il pulsante 🏠.'`,
     poi `'Se una fascia obbligatoria resta scoperta, la giornata lo segnala: il calcolo non cambia.'`.
3. **Test** `tests/aiuto.test.ts`: la chiamata con `pranzo`/`pausaDaScalare` diventa
   `impostazioni({}, { fasciaPranzo: { inizio: 750, fine: 840 }, pausaDaScalare: 45 })` (asserzioni invariate);
   nuovo test: `vociAiuto(impostazioniOutatime())` → voce `configurazioni` contiene `'17:00'` e `'Presenza FILM'`.
**Verifica**: `npm test` · `npm run typecheck`.
**Fuori scope**: README.

## T2.16 — Pulizia dei campi vecchi delle impostazioni                 Effort: medium
Riferimenti: D21.
1. **Core** `src/core/tipi.ts`: togliere da `Impostazioni` e `IMPOSTAZIONI_PREDEFINITE` i campi `pranzo`,
   `pausaDaScalare`, `orarioMinimoConteggio`, `pausaMinima`.
2. **Storage** `src/storage/migrazioni.ts`: `clonaImpostazioni` e `normalizzaImpostazioni` senza quei campi.
3. **Test** `tests/migrazioni.test.ts`: il test "scarta valori non validi" non controlla più `pausaDaScalare`,
   `pranzo`, `pausaMinima` di primo livello (togliere quelle tre asserzioni, tenere quella sulle giornate).
4. Controllo: `grep -rn "\.pranzo\b\|pausaDaScalare\|orarioMinimoConteggio\|imp\.pausaMinima\|impostazioni\.pausaMinima" src tests`
   trova solo usi dentro `configurazioni`/`ConfigurazioneOraria`/`CONFIGURAZIONE_LEGACY`; ogni altro risultato è da
   correggere nello stesso task.
**Verifica**: `npm test` · `npm run typecheck` · `npm run build`.
**Fuori scope**: nuove funzioni.

## T2.17 — Pubblicazione su gcampa e versione 2.0.0                    Effort: medium
Riferimenti: D17.
1. `README.md`: ogni `https://ricky79.github.io/krumiro2.0/` → `https://gcampa.github.io/krumiro2.0/`; tabella
   "Regole di calcolo": le righe "Uscita prevista", "Timbrature prima delle 08:30", "Pausa più breve di 30 min"
   diventano: `| Configurazioni | Presenza, Presenza FILM (interruttore in Impostazioni → Orari, salvato su ogni giornata), Smart working (per giornata), con i valori di outatime |`,
   `| Ora di levarsi | adesso + (dovute − coperte); se la pausa non è fatta si aggiunge la pausa prevista; mai prima dell'uscita minima (Presenza 17:30, FILM 17:00, Smart working 17:30), salvo nei giorni liberi |`,
   `| Ingresso minimo | le timbrature precedenti contano da 08:30 (Smart working 07:00) |`,
   `| Pausa minima | Presenza 60 min; FILM 30 min contati tra 13:00 e 15:00; Smart working 30 min |`,
   `| Fasce obbligatorie | avviso se restano scoperte (predefinite 10:00–12:30 e 15:00–17:30, FILM fino alle 17:00) |`;
   sezione "Come si usa" → "Impostazioni": `ore dovute, orari delle tre configurazioni, FILM, fasce obbligatorie, tolleranza della pausa sigaretta, export e import dei dati`.
   Aggiungere sotto "Attenzione ai dati": `Chi usava l'app su ricky79.github.io: esporta il backup JSON da lì e importalo qui (Impostazioni → Importa CSV o backup JSON…).`
2. `vite.config.ts`: commento → `// GitHub Pages pubblica il sito su https://gcampa.github.io/krumiro2.0/`.
3. `package.json`: `"version": "2.0.0"`; `package-lock.json` aggiornato con `npm install --package-lock-only`.
**Verifica**: `npm test` · `npm run build` · `grep -rn ricky79 README.md vite.config.ts src` vuoto.
**Fuori scope**: impostazione di GitHub Pages (manuale, utente: Settings → Pages → Source: GitHub Actions).
