# F3 — Pausa birra

Obiettivo: la pausa breve diventa una scelta del profilo, "Sigaretta" oppure "Birra". Con "Birra" il bottone, i
testi e la schermata mostrano un boccale che si svuota, con la sua tolleranza (15 min, modificabile); le regole di
permesso restano quelle della pausa sigaretta (blocchi da 30 min).

Uscita (dall'interfaccia, `npm run dev`, giorno feriale, giornata con Entrata registrata):
1. Impostazioni → Profilo → Pausa breve: **Birra**. Oggi mostra il bottone **"🍺 Pausa birra"**.
2. Tocco "🍺 Pausa birra" → schermata scura con il boccale pieno, titolo "Pausa birra", timer che parte da 15:00 e
   nota "Rientra entro le HH:MM per non segnare nulla" (HH:MM = uscita + 15 min).
3. Rientro entro 15 min → toast "Pausa birra di N min: non conteggiata" e nessuna timbratura in più.
4. Una pausa birra oltre i 15 min (Impostazioni → Tolleranza birra 1 min, attesa di 2 min) → boccale vuoto con un velo
   di schiuma, timer "+…", al rientro "30 min di permesso".
5. Impostazioni → Profilo → Pausa breve: **Sigaretta** → tutto torna come in 1.5.0 (🚬, 11 min).

Riferimenti: D29; `src/core/sigaretta.ts`, `src/ui/sigaretta.ts`, `src/ui/impostazioni.ts`, `src/ui/giorno.ts`,
`src/ui/aiutoTesti.ts`, `src/style.css`. Regole B1–B9, W1–W6 in [README.md](README.md). Effort: solo medium (D24).

**Allineamento al codice (pianificazione del 2026-10-03, prima di F2).** Il P di F3, dopo la chiusura di F2,
riscrive questa sezione sul codice di allora. Punti già noti:
- La pausa sigaretta esiste (versione 1.5.0): evento `USCITA_PERMESSO` con `sigaretta: true`, regole pure in
  `src/core/sigaretta.ts`, schermata `<dialog class="sigaretta">` in `src/ui/sigaretta.ts`, chiave locale
  `timbrature-sigaretta`. **Si riusa tutto**: la birra non è un nuovo tipo di evento, è il nome della pausa breve
  scelto nel profilo (D29). Il flag sui dati resta `sigaretta: true` e nel CSV il suffisso resta `(sigaretta)`.
- Il calcolo (`calcolaGiornata`, `permessoSigaretta`) non usa la tolleranza: la tolleranza decide solo al rientro
  (`esitoRientroSigaretta`) e nella schermata. Il calcolo non cambia.
- Dopo F2 le impostazioni sono allo schema v2 con la scheda "Profilo" (T2.09): i campi nuovi di F3 sono facoltativi
  con valore predefinito, senza cambiare `VERSIONE_CORRENTE` (D2).

---

## T3.01 — Profilo: tipo di pausa breve e tolleranza birra             Effort: medium
Riferimenti: D29; `src/core/tipi.ts`, `src/core/sigaretta.ts`, `src/storage/migrazioni.ts`.
1. **Core** `src/core/tipi.ts`: `export type TipoPausaBreve = 'sigaretta' | 'birra';`. In `Impostazioni`:
   `/** Profilo: aspetto e tolleranza della pausa breve. */ pausaBreve: TipoPausaBreve;` e
   `/** Una pausa birra che non supera questi minuti viene cancellata al rientro. */ tolleranzaBirra: number;`.
   In `IMPOSTAZIONI_PREDEFINITE`: `pausaBreve: 'sigaretta'`, `tolleranzaBirra: 15`.
2. **Core** `src/core/sigaretta.ts`, in coda:
   ```ts
   export const PAUSE_BREVI: Record<TipoPausaBreve, { nome: string; emoji: string }> = {
     sigaretta: { nome: 'Pausa sigaretta', emoji: '🚬' },
     birra: { nome: 'Pausa birra', emoji: '🍺' },
   };
   /** Tolleranza della pausa breve scelta nel profilo. */
   export function tolleranzaPausaBreve(imp: Impostazioni): number {
     return imp.pausaBreve === 'birra' ? imp.tolleranzaBirra : imp.tolleranzaSigaretta;
   }
   ```
3. **Storage** `src/storage/migrazioni.ts`, `normalizzaImpostazioni`:
   `imp.pausaBreve = v.pausaBreve === 'birra' ? 'birra' : 'sigaretta';`
   `imp.tolleranzaBirra = intIn(v.tolleranzaBirra, 0, 60) ?? p.tolleranzaBirra;`. `clonaImpostazioni` li copia
   (sono valori semplici: lo spread esistente basta, verificarlo).
4. **Test** `tests/sigaretta.test.ts`: `tolleranzaPausaBreve` con predefiniti → 11; con `pausaBreve: 'birra'` → 15;
   con `pausaBreve: 'birra', tolleranzaBirra: 20` → 20. `tests/migrazioni.test.ts`: dati senza i campi →
   `'sigaretta'` e 15; `pausaBreve: 'vino'` → `'sigaretta'`; `tolleranzaBirra: 61` → 15; `tolleranzaBirra: 0` → 0.
**Verifica**: `npm test` tutti verdi · `npm run typecheck`.
**Fuori scope**: interfaccia.

## T3.02 — Impostazioni: scelta della pausa breve e tolleranze          Effort: medium
Riferimenti: D29; `src/ui/impostazioni.ts`. Regole W1–W4.
1. **UI** `src/ui/impostazioni.ts`, scheda "Profilo" (creata in T2.09), dopo la riga "Abilita FILM": riga
   `'Pausa breve'` con due pulsanti `chip` nello stile di `selettoreTema` (`div.preset`, `role="group"`,
   `aria-label` "Pausa breve"): `🚬 Sigaretta` e `🍺 Birra`, `aria-pressed` sul valore corrente; al tocco
   `store.modificaImpostazioni((i) => void (i.pausaBreve = valore)); salvato();`.
2. Scheda "Pausa sigaretta": titolo → `Pausa breve`; la riga esistente diventa `Tolleranza sigaretta (min)` (stesso
   controllo); nuova riga `Tolleranza birra (min)` con `inputMinuti(imp.tolleranzaBirra, …, 'Tolleranza della pausa birra in minuti', 60, 1)`,
   nota `entro questo tempo la pausa non viene conteggiata`; il link d'aiuto resta.
**Verifica**: `npm run build` · `npm test` · nel browser: Impostazioni → Profilo → tocco "🍺 Birra" → resta premuto
dopo il ricaricamento; "Tolleranza birra (min)" mostra 15; scrivo 61 → torna al valore precedente.
**Fuori scope**: giornata e schermata.

## T3.03 — Giornata: bottone e timeline con la pausa del profilo        Effort: medium
Riferimenti: D29; `src/ui/giorno.ts`.
1. **UI** `src/ui/giorno.ts`, `pulsantiAzione`: per l'azione `PAUSA_SIGARETTA` il testo è
   `` `${PAUSE_BREVI[store.impostazioni.pausaBreve].emoji} ${PAUSE_BREVI[store.impostazioni.pausaBreve].nome}` ``
   (al posto di `` `🚬 ${ETICHETTE_AZIONE[a]}` ``). `ETICHETTE_AZIONE` in `src/core/statoGiornata.ts` non cambia.
2. `timeline`: il dettaglio `'🚬 pausa sigaretta'` diventa
   `` `${p.emoji} ${p.nome.toLowerCase()}` `` e `(pausa sigaretta di ${…})` diventa
   `` `(${p.nome.toLowerCase()} di ${…})` ``, con `const p = PAUSE_BREVI[store.impostazioni.pausaBreve];`.
**Verifica**: `npm run build` · `npm test` · nel browser con Birra nel profilo: Oggi mostra "🍺 Pausa birra"; una
pausa conclusa oltre la tolleranza in timeline dice "30 min di permesso (pausa birra di N min)".
**Fuori scope**: la schermata a tutto schermo (T3.04, T3.05).

## T3.04 — Schermata: tolleranza e testi della pausa del profilo        Effort: medium
Riferimenti: D29; `src/ui/sigaretta.ts`.
1. **UI** `src/ui/sigaretta.ts`: `const p = PAUSE_BREVI[store.impostazioni.pausaBreve];` e
   `const tolleranza = tolleranzaPausaBreve(store.impostazioni);` in `apriSchermata`; in `rientra` la tolleranza è
   `tolleranzaPausaBreve(store.impostazioni)` al posto di `store.impostazioni.tolleranzaSigaretta`.
2. Testi (sostituzioni esatte, `nome` = `p.nome`, `minuscolo` = `p.nome.toLowerCase()`):
   - `h2` `'Pausa sigaretta'` → `nome`; `aria-label` del dialog → `nome`; classe del dialog in più:
     `` `sigaretta tema-${store.impostazioni.pausaBreve}` ``;
   - avviso `'Pausa sigaretta non chiusa'` → `` `${nome} non chiusa` ``;
   - conferma: `'L\'uscita per la pausa sigaretta verrà eliminata, come se non l\'avessi registrata.'` →
     `` `L'uscita per la ${minuscolo} verrà eliminata, come se non l'avessi registrata.` ``;
   - toast `'Pausa sigaretta annullata'` → `` `${nome} annullata` ``;
   - toast `` `Pausa sigaretta di ${…}: non conteggiata` `` → `` `${nome} di ${…}: non conteggiata` ``.
3. Il disegno resta la sigaretta in questo task (il boccale è T3.05).
**Verifica**: `npm run build` · `npm test` · nel browser con Birra: la schermata si intitola "Pausa birra", il timer
parte da 15:00, la nota dice "Rientra entro le HH:MM" con HH:MM = uscita + 15 min; Annulla pausa → toast
"Pausa birra annullata".
**Fuori scope**: disegno.

## T3.05 — Schermata: il boccale che si svuota                          Effort: medium
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
   In `apriSchermata`: `scena.innerHTML = store.impostazioni.pausaBreve === 'birra' ? DISEGNO_BIRRA : DISEGNO;`.
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
**Verifica**: `npm run build` · `npm test` · nel browser con Birra e Tolleranza birra 2 min: il boccale parte pieno,
dopo 1 min è a metà, dopo 2 min è vuoto con la schiuma sul fondo e senza bollicine; con Sigaretta il disegno è la
sigaretta di sempre.
**Fuori scope**: suoni, vibrazione, altri disegni.

## T3.06 — Aiuto e README                                               Effort: medium
Riferimenti: D29; `src/ui/aiutoTesti.ts`, `tests/aiuto.test.ts`, `README.md`.
1. **UI** `src/ui/aiutoTesti.ts`: `const tolleranza = formattaDurata(tolleranzaPausaBreve(imp));` (al posto di
   `formattaDurata(imp.tolleranzaSigaretta)`) e `const pb = PAUSE_BREVI[imp.pausaBreve];`. Voce `pausa-sigaretta`
   (`id` e `azione` invariati), sostituzioni esatte:
   - `domanda: 'Pausa sigaretta'` → `domanda: pb.nome`;
   - nella prima riga `la sigaretta si consuma mentre il tempo passa` →
     `` ${imp.pausaBreve === 'birra' ? 'il boccale si svuota' : 'la sigaretta si consuma'} mentre il tempo passa ``;
   - `'La tolleranza si cambia in Impostazioni → Pausa sigaretta.'` →
     `'La tolleranza si cambia in Impostazioni → Pausa breve; in Impostazioni → Profilo scegli se la pausa breve è una sigaretta o una birra (cambiano disegno e tolleranza, le regole sono le stesse).'`.
2. **Test** `tests/aiuto.test.ts`: con `impostazioni({ pausaBreve: 'birra' })` la voce `pausa-sigaretta` contiene
   `'15 min'` e `'Pausa birra'`; il test esistente con `tolleranzaSigaretta: 7` resta verde.
3. `README.md`, sezione "Come si usa": dopo il punto "Pausa sigaretta" aggiungere
   `- **Pausa birra**: in *Impostazioni → Profilo* puoi scegliere la birra al posto della sigaretta: un boccale che si svuota, tolleranza 15 min (configurabile), stesse regole di permesso.`
   e nella tabella "Regole di calcolo", riga "Pausa sigaretta", aggiungere in fondo
   `; la pausa birra ha tolleranza 15 min`.
**Verifica**: `npm test` · `npm run typecheck` · `npm run build`.
**Fuori scope**: versione del pacchetto (la decide il P di F3).
