# F3 — Pausa caffè: cronometro sigaretta o birra

Obiettivo: la pausa breve (quella che spetta ogni 2 ore di lavoro) è **solo un cronometro** del tempo d'aria al
caffè: la fai partire con un pulsante, vedi una sigaretta che si consuma o un boccale che si svuota nella durata
scelta, la chiudi con "Fine pausa" e vedi quanto è durata. **Non registra timbrature, non crea permessi, non cambia
ore né saldo** (D31). Sigaretta o birra è una scelta del profilo; la durata è configurabile (sigaretta 11 min, birra
15 min, D29, D31).

Uscita (dall'interfaccia, `npm run dev`, giorno feriale, giornata con Entrata registrata):
1. Impostazioni → Profilo → Pausa caffè: **Birra**. Oggi mostra il bottone **"🍺 Pausa birra"**.
2. Tocco "🍺 Pausa birra" → schermata scura con il boccale pieno, timer che parte da 15:00, nota "Fino alle HH:MM"
   (HH:MM = ora di partenza + 15 min). La timeline della giornata **non** ha timbrature nuove.
3. Tocco "Fine pausa" dopo 2 min → toast "Pausa birra: 2 min"; timbrature, ore coperte, saldo e ora di levarsi
   identici a prima.
4. Con "Durata della birra" 1 min e 2 min di attesa → boccale vuoto con un velo di schiuma, timer "+01:00" in rosso;
   "Fine pausa" → toast "Pausa birra: 2 min".
5. Profilo → **Sigaretta** → "🚬 Pausa sigaretta" con la sigaretta che si consuma in 11 min, stesso comportamento.
6. Una giornata salvata con la 1.5.0 che contiene una pausa sigaretta (uscita e rientro in permesso) mostra un
   normale permesso, senza arrotondamento a blocchi da 30 min.

Riferimenti: D29, D31; `src/core/sigaretta.ts`, `src/ui/sigaretta.ts`, `src/core/calcolo.ts`, `src/core/tipi.ts`,
`src/core/csv.ts`, `src/storage/migrazioni.ts`, `src/ui/impostazioni.ts`, `src/ui/giorno.ts`, `src/ui/editor.ts`,
`src/main.ts`, `src/ui/aiutoTesti.ts`, `src/style.css`. Regole B1–B9, W1–W6 in [README.md](README.md).
Effort: solo medium (D24).

**Allineamento al codice (pianificazione del 2026-10-03, prima di F2).** Il P di F3, dopo la chiusura di F2,
riscrive questa sezione sul codice di allora. Punti già noti:
- Nella 1.5.0 la pausa sigaretta registra un'`USCITA_PERMESSO` con `sigaretta: true`, la annulla entro la tolleranza
  e oltre la conta a blocchi da 30 min (`permessoSigaretta`, `RisultatoGiornata.sigarette`, `anteprimaSigaretta`).
  **Questo comportamento si toglie** (D31): resta solo la schermata del cronometro, che non scrive nulla nelle
  giornate.
- Le pause sigaretta già salvate restano come normali uscite/rientri in permesso: il flag `sigaretta` sparisce dai
  dati alla normalizzazione, senza cambiare `VERSIONE_CORRENTE` (si toglie un campo facoltativo).
- Il campo `tolleranzaSigaretta` resta con questo nome nei dati (evita una migrazione): da F3 significa "durata
  della sigaretta" ed è etichettato così nell'interfaccia. Lo stesso vale per `tolleranzaBirra`.
- La chiave locale `timbrature-sigaretta` (istante di partenza, stato del dispositivo) si riusa per il cronometro.
- Ordine dei task: prima il cronometro senza timbrature (T3.03), poi la rimozione del permesso dal calcolo (T3.05) e
  dai dati (T3.06), così ogni task compila.

---

## T3.01 — Profilo: tipo di pausa caffè e durate                        Effort: medium
Riferimenti: D29, D31; `src/core/tipi.ts`, `src/core/sigaretta.ts`, `src/storage/migrazioni.ts`.
1. **Core** `src/core/tipi.ts`: `export type TipoPausaBreve = 'sigaretta' | 'birra';`. In `Impostazioni`:
   `/** Profilo: aspetto della pausa caffè. */ pausaBreve: TipoPausaBreve;` e
   `/** Durata del cronometro della pausa birra, in minuti. */ tolleranzaBirra: number;`; il commento di
   `tolleranzaSigaretta` diventa `/** Durata del cronometro della pausa sigaretta, in minuti. */`.
   In `IMPOSTAZIONI_PREDEFINITE`: `pausaBreve: 'sigaretta'`, `tolleranzaBirra: 15` (`tolleranzaSigaretta` resta 11).
2. **Core** `src/core/sigaretta.ts`, in coda:
   ```ts
   export const PAUSE_BREVI: Record<TipoPausaBreve, { nome: string; emoji: string }> = {
     sigaretta: { nome: 'Pausa sigaretta', emoji: '🚬' },
     birra: { nome: 'Pausa birra', emoji: '🍺' },
   };
   /** Durata del cronometro della pausa scelta nel profilo, in minuti. */
   export function durataPausaBreve(imp: Impostazioni): number {
     return imp.pausaBreve === 'birra' ? imp.tolleranzaBirra : imp.tolleranzaSigaretta;
   }
   ```
3. **Storage** `src/storage/migrazioni.ts`, `normalizzaImpostazioni`:
   `imp.pausaBreve = v.pausaBreve === 'birra' ? 'birra' : 'sigaretta';`
   `imp.tolleranzaBirra = intIn(v.tolleranzaBirra, 0, 60) ?? p.tolleranzaBirra;`.
4. **Test** `tests/sigaretta.test.ts`, nuovo `describe('pausa del profilo')`: `durataPausaBreve` con predefiniti → 11;
   con `pausaBreve: 'birra'` → 15; con `pausaBreve: 'birra', tolleranzaBirra: 20` → 20.
   `tests/migrazioni.test.ts`: dati senza i campi → `'sigaretta'` e 15; `pausaBreve: 'vino'` → `'sigaretta'`;
   `tolleranzaBirra: 61` → 15; `tolleranzaBirra: 0` → 0.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: interfaccia, calcolo.

## T3.02 — Impostazioni: scelta della pausa e durate                    Effort: medium
Riferimenti: D29, D31; `src/ui/impostazioni.ts`. Regole W1–W4.
1. **UI** `src/ui/impostazioni.ts`, scheda "Profilo" (T2.09), dopo la riga "Abilita FILM": riga `'Pausa caffè'` con
   due pulsanti `chip` nello stile di `selettoreTema` (`div.preset`, `role="group"`, `aria-label` "Pausa caffè"):
   `🚬 Sigaretta` e `🍺 Birra`, `aria-pressed` sul valore corrente; al tocco
   `store.modificaImpostazioni((i) => void (i.pausaBreve = valore)); salvato();`.
2. Scheda "Pausa sigaretta": titolo → `Pausa caffè`; la riga diventa `Durata della sigaretta (min)` (stesso
   controllo, `aria-label` "Durata della pausa sigaretta in minuti"), nota `durata del cronometro`; nuova riga
   `Durata della birra (min)` con `inputMinuti(imp.tolleranzaBirra, …, 'Durata della pausa birra in minuti', 60, 1)`,
   nota `durata del cronometro`. Il link d'aiuto resta.
**Verifica**: `npm run build` · `npm test` · nel browser: Profilo → "🍺 Birra" resta premuto dopo il ricaricamento;
"Durata della birra (min)" mostra 15; scrivo 20 → dopo il ricaricamento 20; scrivo 61 → torna al valore precedente.
**Fuori scope**: giornata e schermata.

## T3.03 — Cronometro senza timbrature                                  Effort: medium
Riferimenti: D31; `src/ui/sigaretta.ts`, `src/ui/giorno.ts`, `src/main.ts`.
1. **UI** `src/ui/sigaretta.ts`, riscrivere avvio e chiusura (il disegno della sigaretta resta), con
   `const p = PAUSE_BREVI[store.impostazioni.pausaBreve];`:
   - stato salvato nella chiave `timbrature-sigaretta`: `{ data: string; inizio: number }` (niente `eventoId`).
   - `export function avviaPausaBreve(data: string): void` — salva `{ data, inizio: Date.now() }` e apre la schermata;
     **non** chiama `store.modificaGiornata`.
   - `export function riprendiPausaBreve(data: string): void` — se la schermata non è aperta e la chiave contiene la
     stessa `data`, riapre la schermata con quell'`inizio`; se la chiave ha un'altra data, la cancella senza avvisi.
   - schermata: `h2` = `p.nome`, `aria-label` = `p.nome`, classe `` `sigaretta tema-${store.impostazioni.pausaBreve}` ``,
     sotto il titolo `` `partita alle ${formattaOra(adessoRoma(new Date(inizio)).minuti)}` ``; timer con
     `countdown(Date.now() - inizio, durata)` e `testoTimer` esistenti, `durata = durataPausaBreve(store.impostazioni)`;
     nota: prima della fine `` `Fino alle ${fine}` `` (`fine` = ora di partenza + durata, formato `HH:MM`), dopo
     `` `Durata finita alle ${fine}` ``.
   - un solo pulsante `btn btn-primario` **`Fine pausa`**: cancella la chiave, chiude e
     `` toast(`${p.nome}: ${formattaDurata(Math.max(1, Math.round((Date.now() - inizio) / 60_000)))}`) ``.
     Il pulsante "Annulla pausa" e la funzione `rientra` si tolgono.
   - `cancel` (Esc, Indietro) resta bloccato come oggi; il cambio di giorno a schermata aperta chiude e cancella la
     chiave senza avvisi (non c'è nulla da correggere).
2. **UI** `src/ui/giorno.ts`: `case 'PAUSA_SIGARETTA': avviaPausaBreve(data); return;`; il testo del bottone è
   `` `${p.emoji} ${p.nome}` `` al posto di `` `🚬 ${ETICHETTE_AZIONE[a]}` ``. `src/main.ts`:
   `riprendiPausaBreve(adesso.data)` al posto di `riprendiPausaSigaretta(adesso.data)`.
3. `anteprimaSigaretta`, `esitoRientroSigaretta`, `sigarettaDaRiprendere`, `istanteDaMinuti` non sono più usati da
   `src/ui/sigaretta.ts`: si tolgono in T3.05.
**Verifica**: `npm run build` · `npm test` · nel browser: "🚬 Pausa sigaretta" → schermata con timer 11:00; la
timeline non ha timbrature nuove; ricarico la pagina → la schermata ricompare con il tempo trascorso; "Fine pausa" →
toast "Pausa sigaretta: N min"; ore coperte e saldo uguali a prima.
**Fuori scope**: boccale (T3.04), calcolo e dati (T3.05, T3.06).

## T3.04 — Schermata: il boccale che si svuota                          Effort: medium
Riferimenti: D29; `src/ui/sigaretta.ts`, `src/style.css`.
1. **UI** `src/ui/sigaretta.ts`: costanti e disegno (markup statico, nessun dato dell'utente):
   ```ts
   /** Livello della birra nel disegno (unità SVG): dal fondo (y 210) fino a y 40. */
   const FONDO_BIRRA = 210;
   const ALTEZZA_BIRRA = 170;
   const DISEGNO_BIRRA = `
   <svg class="birra-disegno" viewBox="0 0 200 240" aria-hidden="true">
     <defs>
       <clipPath id="birra-interno"><rect x="40" y="30" width="100" height="180" rx="8"/></clipPath>
       <linearGradient id="birra-colore" x1="0" x2="0" y1="0" y2="1">
         <stop offset="0" stop-color="#f6c341"/><stop offset="1" stop-color="#d98b0b"/>
       </linearGradient>
     </defs>
     <g clip-path="url(#birra-interno)">
       <rect class="birra-liquido" x="40" y="40" width="100" height="${ALTEZZA_BIRRA}" fill="url(#birra-colore)"/>
       <g class="birra-bollicine" fill="#fff3c4">
         <circle cx="60" cy="200" r="2.5"/><circle cx="85" cy="190" r="2"/>
         <circle cx="105" cy="205" r="3"/><circle cx="125" cy="195" r="2"/>
       </g>
       <g class="birra-schiuma" fill="#fff8e7">
         <rect x="40" y="26" width="100" height="16"/>
         <circle cx="52" cy="28" r="10"/><circle cx="72" cy="24" r="12"/><circle cx="95" cy="26" r="11"/>
         <circle cx="118" cy="24" r="12"/><circle cx="134" cy="28" r="9"/>
       </g>
     </g>
     <rect x="40" y="30" width="100" height="180" rx="8" fill="none" stroke="#e8eef2" stroke-width="5" opacity="0.8"/>
     <path d="M140 70 h22 a18 18 0 0 1 18 18 v54 a18 18 0 0 1 -18 18 h-22" fill="none" stroke="#e8eef2" stroke-width="10" opacity="0.8"/>
   </svg>`;
   ```
   In apertura: `scena.innerHTML = store.impostazioni.pausaBreve === 'birra' ? DISEGNO_BIRRA : DISEGNO;`.
   In `aggiorna`, se birra:
   ```ts
   const livello = ALTEZZA_BIRRA * (1 - c.consumata);
   liquido.setAttribute('y', String(FONDO_BIRRA - livello));
   liquido.setAttribute('height', String(livello));
   schiuma.setAttribute('transform', `translate(0 ${Math.min(ALTEZZA_BIRRA - 4, ALTEZZA_BIRRA * c.consumata)})`);
   ```
   (`liquido` = `.birra-liquido`, `schiuma` = `.birra-schiuma`); se sigaretta, il codice di oggi invariato.
   A boccale vuoto (`c.consumata >= 1`) la schiuma resta sul fondo: è il "velo di schiuma".
2. **Stile** `src/style.css`, in coda:
   ```css
   /* Pausa birra: boccale che si svuota */
   .birra-disegno { width: min(60vw, 220px); height: auto; }
   .birra-bollicine circle { animation: birra-sale 2.4s ease-in infinite; }
   .birra-bollicine circle:nth-child(2) { animation-delay: 0.6s; }
   .birra-bollicine circle:nth-child(3) { animation-delay: 1.2s; }
   .birra-bollicine circle:nth-child(4) { animation-delay: 1.8s; }
   .sigaretta.consumata .birra-bollicine { display: none; }
   @keyframes birra-sale {
     from { transform: translateY(0); opacity: 0.9; }
     to { transform: translateY(-150px); opacity: 0; }
   }
   ```
   Con `prefers-reduced-motion` le bollicine sono ferme: la regola globale di `src/style.css`
   (`@media (prefers-reduced-motion: reduce) { * { animation: none !important; … } }`) vale anche per queste.
**Verifica**: `npm run build` · `npm test` · nel browser con Birra e "Durata della birra" 2 min: il boccale parte
pieno, dopo 1 min è a metà, dopo 2 min è vuoto con la schiuma sul fondo e senza bollicine; con Sigaretta il disegno è
la sigaretta di sempre.
**Fuori scope**: suoni, vibrazione, altri disegni.

## T3.05 — Calcolo: la sigaretta non è più un permesso a blocchi        Effort: medium
Riferimenti: D31; `src/core/calcolo.ts`, `src/core/tipi.ts`, `src/core/sigaretta.ts`, `src/ui/giorno.ts`.
1. **Core** `src/core/calcolo.ts`: togliere il ramo `if (i.sigaretta) { … continue; }` del passo 3, le variabili
   `sigarette` ed `eccedenzaSigarette` e il loro uso (`eccedenzaApplicata` tolta, `lavorati = lavoroNetto`, la riga
   `permessoIntermedio -= …` tolta), il campo `sigaretta` di `Intervallo` e di `aperto`, la funzione
   `anteprimaSigaretta` e l'import di `permessoSigaretta`. Un permesso aperto da un'uscita con `sigaretta: true`
   diventa un permesso normale (con la conversione in pausa se copre la fascia pranzo, come gli altri).
2. **Core** `src/core/tipi.ts`: togliere `PermessoSigaretta` e `RisultatoGiornata.sigarette`.
3. **Core** `src/core/sigaretta.ts`: togliere `BLOCCO_PERMESSO_SIGARETTA`, `permessoSigaretta`,
   `EsitoRientroSigaretta`, `esitoRientroSigaretta`, `istanteDaMinuti`, `sigarettaInCorso`, `sigarettaDaRiprendere`.
   `countdown`: `scaduta: t > totale` al posto della chiamata a `esitoRientroSigaretta`.
4. **UI** `src/ui/giorno.ts`, `timeline`: togliere `sig` e i suoi due rami di `dettaglio`
   (`… di permesso (pausa sigaretta di …)` e `'🚬 pausa sigaretta'`).
5. **Test**: in `tests/sigaretta.test.ts` togliere i `describe` "permesso a blocchi", "esito del rientro",
   "istante di inizio ricavato dalla timbratura", "pausa sigaretta in corso", "schermata da riaprire da sola";
   "countdown" resta. In `tests/calcolo.test.ts` il `describe('pausa sigaretta')` si sostituisce con un solo test:
   Entrata 08:30, Uscita in permesso 10:05 con `sigaretta: true`, Rientro da permesso 10:20, adesso 12:00 →
   `permesso` 15 (non 30) e `lavorati` 195. In `tests/csv.test.ts` il test "pausa sigaretta: suffisso nel CSV,
   permesso a blocchi e ritorno" perde le asserzioni sul permesso a blocchi (resta quella sul suffisso, che cambia in
   T3.06).
**Verifica**: `npm test` tutti verdi · `npm run typecheck` ·
`grep -rn "permessoSigaretta\|sigarette\|anteprimaSigaretta" src tests` vuoto.
**Fuori scope**: campo `sigaretta` nei dati (T3.06).

## T3.06 — Dati: via il flag sigaretta dalle timbrature                 Effort: medium
Riferimenti: D31; `src/core/tipi.ts`, `src/storage/migrazioni.ts`, `src/core/csv.ts`, `src/ui/editor.ts`,
`src/ui/giorno.ts`.
1. **Core** `src/core/tipi.ts`: togliere `Evento.sigaretta`.
2. **Storage** `src/storage/migrazioni.ts`, `normalizzaGiornata`: togliere la riga che conserva `sigaretta` (una
   vecchia pausa sigaretta resta un'uscita in permesso normale).
3. **Core** `src/core/csv.ts`: `eventiInTesto` non scrive più `(sigaretta)`; `importaCsv` accetta ancora il suffisso
   `(sigaretta)` (CSV della 1.5.0) e lo ignora: la regex resta, la riga
   `if (m[4] !== undefined && tipo === 'USCITA_PERMESSO') ev.sigaretta = true;` si toglie.
4. **UI** `src/ui/editor.ts`: togliere `if (tipo !== 'USCITA_PERMESSO') delete e.sigaretta;`. `src/ui/giorno.ts`, caso
   `NON_RIENTRO`: togliere `delete ultima.sigaretta;`.
5. **Test** `tests/migrazioni.test.ts`: "conserva la pausa sigaretta solo sulle uscite in permesso" diventa
   "toglie il vecchio flag sigaretta": i tre eventi risultano senza `sigaretta`. `tests/csv.test.ts`: export di
   un'uscita in permesso → `10:05 Uscita in permesso` senza suffisso; import di
   `08:30 Entrata (sigaretta), 10:05 Uscita in permesso (sigaretta)` → due eventi senza `sigaretta`, nessun errore.
**Verifica**: `npm test` · `npm run typecheck` · `grep -rn "\.sigaretta" src tests` vuoto.
**Fuori scope**: testi dell'aiuto.

## T3.07 — Aiuto e README                                               Effort: medium
Riferimenti: D31; `src/ui/aiutoTesti.ts`, `tests/aiuto.test.ts`, `README.md`.
1. **UI** `src/ui/aiutoTesti.ts`: `const pb = PAUSE_BREVI[imp.pausaBreve];` e la variabile `tolleranza` diventa
   `formattaDurata(durataPausaBreve(imp))`. La voce `pausa-sigaretta` (`id` e `azione` invariati) ha
   `domanda: pb.nome` e `testo`:
   - `` `È un cronometro per la pausa caffè che spetta ogni 2 ore di lavoro: lo fai partire con il pulsante e ${imp.pausaBreve === 'birra' ? 'il boccale si svuota' : 'la sigaretta si consuma'} in ${tolleranza}.` ``
   - `'Non registra timbrature e non cambia ore, permessi o saldo. Con "Fine pausa" vedi quanto è durata.'`
   - `'La durata si cambia in Impostazioni → Pausa caffè; in Impostazioni → Profilo scegli sigaretta o birra.'`
2. **Test** `tests/aiuto.test.ts`: il test con `tolleranzaSigaretta: 7` resta (contiene `'7 min'`); nuovo: con
   `impostazioni({ pausaBreve: 'birra' })` la voce contiene `'15 min'`, `'Pausa birra'` e `'Non registra timbrature'`.
3. `README.md`: in "Come si usa" il punto "Pausa sigaretta" diventa
   `- **Pausa caffè**: un cronometro (🚬 sigaretta o 🍺 birra, scelta in *Impostazioni → Profilo*) per la pausa che spetta ogni 2 ore di lavoro; durata configurabile (11 e 15 min). Non registra timbrature e non cambia le ore.`;
   nella tabella "Regole di calcolo" la riga "Pausa sigaretta" si toglie.
**Verifica**: `npm test` · `npm run typecheck` · `npm run build`.
**Fuori scope**: versione del pacchetto (la decide il P di F3).
