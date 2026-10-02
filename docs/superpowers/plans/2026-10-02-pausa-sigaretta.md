# Pausa sigaretta — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bottone *Pausa sigaretta* che registra un'uscita in permesso, apre una schermata con countdown e sigaretta che si consuma, e al rientro cancella la pausa entro la tolleranza (11 min, configurabile) o la conta come permesso a blocchi da 30 min.

**Architecture:** Logica pura in `src/core/sigaretta.ts` (blocchi, esito del rientro, countdown, pausa in corso). `calcolaGiornata` riconosce i permessi aperti da un'uscita con `sigaretta: true`, li arrotonda a blocchi e sposta l'eccedenza dalle lavorate al permesso (ore coperte invariate). La schermata è un `<dialog>` a tutto schermo in `src/ui/sigaretta.ts`, riaperta da `main.ts` a ogni render se la pausa è in corso.

**Tech Stack:** TypeScript 5.9 senza framework (helper `el()` in `src/ui/dom.ts`), Vite 8 + vite-plugin-pwa, Vitest 5, localStorage.

**Spec:** `docs/superpowers/specs/2026-10-02-pausa-sigaretta-design.md`

## Global Constraints

- Testi dell'interfaccia, nomi di funzioni/variabili e commenti in **italiano**, come il resto del codice.
- Nessuna nuova dipendenza npm.
- Nessun cambio di `VERSIONE_CORRENTE` (`src/storage/migrazioni.ts`): i campi nuovi sono opzionali o hanno un default.
- Tolleranza predefinita **11** minuti, intervallo **0–60**; blocco di permesso **30** minuti (costante, non configurabile).
- Esito al rientro: `trascorsiMs ≤ tolleranza × 60 000` → pausa cancellata; altrimenti permesso `max(1, ceil(durata / 30)) × 30`.
- La pausa sigaretta non viene mai convertita in pausa pranzo.
- Ore coperte, saldo e uscita prevista non cambiano per effetto dei blocchi.
- La schermata è sempre scura, indipendente dal tema; con `prefers-reduced-motion` niente fumo né pulsazione (già garantito dalla regola globale in `src/style.css`).
- Chiave locale per l'istante preciso: `timbrature-sigaretta` (fuori dai dati e dal backup).
- Il branch `feature/banner-installa` (non ancora mergiato) modifica `src/main.ts` vicino agli import di `./ui/aiuto`/`./ui/tema` e in fondo al file, e `src/style.css` alle righe ~85, ~661 e in coda: inserire il nuovo codice nei punti indicati nei task per evitare conflitti.
- Comandi: `npm test` (Vitest), `npx tsc --noEmit` (typecheck), `npm run build`, `npm run dev` (app su `http://localhost:5173/krumiro2.0/`).
- Ogni commit termina con la riga `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **App chiusa, ricaricata o in background durante la pausa** → alla riapertura la schermata ricompare con il tempo trascorso corretto (Task 4, verifica manuale passo "ricarica").
2. **Esc o tasto Indietro di Android sulla schermata** → la schermata non sparisce lasciando la giornata "In permesso" senza modo di rientrare dalla schermata: si riapre subito (Task 4, verifica manuale passo "Esc").
3. **Sigaretta nei primi minuti della giornata** (lavoro accumulato minore dell'eccedenza) → le ore coperte non superano mai il tempo realmente trascorso (Task 2, test "sigaretta a inizio giornata").
4. **Istante preciso mancante** (backup ripristinato, altro dispositivo, chiave cancellata) → il countdown riparte dall'orario della timbratura, non da zero né da un valore assurdo (Task 1, test `istanteDaMinuti`; Task 4 usa il fallback).
5. **Tocco per errore** → *Annulla pausa* riporta la giornata esattamente com'era (nessun evento in più o in meno) (Task 4, verifica manuale passo "Annulla pausa").

---

## File Structure

| File | Ruolo |
|---|---|
| `src/core/tipi.ts` (modifica) | `Evento.sigaretta`, `Impostazioni.tolleranzaSigaretta` (default 11), tipo `PermessoSigaretta`, `RisultatoGiornata.sigarette` |
| `src/core/sigaretta.ts` (nuovo) | Regole pure: blocchi di permesso, esito del rientro, countdown e testo del timer, istante di fallback, pausa in corso |
| `src/core/calcolo.ts` (modifica) | Blocchi e spostamento eccedenza nel calcolo; `anteprimaSigaretta` |
| `src/storage/migrazioni.ts` (modifica) | Conserva/valida `sigaretta` e `tolleranzaSigaretta` |
| `src/core/csv.ts` (modifica) | Suffisso `(sigaretta)` in export/import |
| `src/core/statoGiornata.ts` (modifica) | Azione `PAUSA_SIGARETTA` |
| `src/ui/aiutoTesti.ts` (modifica) | Voce d'aiuto `pausa-sigaretta` |
| `src/ui/sigaretta.ts` (nuovo) | Schermata a tutto schermo, avvio, ripresa, rientro, annullamento, chiave locale |
| `src/ui/giorno.ts` (modifica) | Bottone, avvio, dettagli in timeline |
| `src/ui/editor.ts` (modifica) | Rimuove il flag se il tipo cambia |
| `src/main.ts` (modifica) | Ripresa della schermata a ogni render |
| `src/style.css` (modifica) | Stili della schermata e della sigaretta |
| `src/ui/impostazioni.ts` (modifica) | Campo *Tolleranza (min)* |
| `README.md` (modifica) | Uso e regola di calcolo |
| `tests/sigaretta.test.ts` (nuovo), `tests/calcolo.test.ts`, `tests/migrazioni.test.ts`, `tests/csv.test.ts`, `tests/statoGiornata.test.ts`, `tests/aiuto.test.ts` | Test |

---

### Task 1: Regole pure della pausa sigaretta

**Files:**
- Modify: `src/core/tipi.ts` (interfacce `Evento`, `Impostazioni`, costante `IMPOSTAZIONI_PREDEFINITE`)
- Create: `src/core/sigaretta.ts`
- Test: `tests/sigaretta.test.ts`

**Interfaces:**
- Consumes: `analizzaGiornata(giornata): AnalisiGiornata` da `src/core/statoGiornata.ts`; `adessoRoma(istante?: Date): { data: string; minuti: number }` da `src/core/tempo.ts`.
- Produces:
  - `Evento.sigaretta?: true`
  - `Impostazioni.tolleranzaSigaretta: number` (default `11`)
  - `BLOCCO_PERMESSO_SIGARETTA = 30`
  - `permessoSigaretta(durata: number): number`
  - `type EsitoRientroSigaretta = 'annulla' | 'permesso'`
  - `esitoRientroSigaretta(trascorsiMs: number, tolleranzaMinuti: number): EsitoRientroSigaretta`
  - `interface Countdown { residuoMs: number; oltreMs: number; consumata: number; scaduta: boolean }`
  - `countdown(trascorsiMs: number, tolleranzaMinuti: number): Countdown`
  - `testoTimer(c: Countdown): string`
  - `istanteDaMinuti(minutiEvento: number, ora: Date): number`
  - `sigarettaInCorso(giornata: Giornata): Evento | null`

- [ ] **Step 1: Aggiungere i campi in `src/core/tipi.ts`**

In `interface Evento`, dopo `pausaConfermata?: number;`:

```ts
  /** Solo su USCITA_PERMESSO: il permesso che apre è una pausa sigaretta. */
  sigaretta?: true;
```

In `interface Impostazioni`, dopo `pausaMinima: number;`:

```ts
  /** Una pausa sigaretta che non supera questi minuti viene cancellata al rientro. */
  tolleranzaSigaretta: number;
```

In `IMPOSTAZIONI_PREDEFINITE`, dopo `pausaMinima: 30,`:

```ts
  tolleranzaSigaretta: 11,
```

- [ ] **Step 2: Scrivere il test che fallisce** — creare `tests/sigaretta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  countdown,
  esitoRientroSigaretta,
  istanteDaMinuti,
  permessoSigaretta,
  sigarettaInCorso,
  testoTimer,
} from '../src/core/sigaretta';
import { giornata, h } from './helpers';

describe('permesso a blocchi', () => {
  it('arrotonda alla mezz\'ora successiva, almeno un blocco', () => {
    expect(permessoSigaretta(0)).toBe(30);
    expect(permessoSigaretta(1)).toBe(30);
    expect(permessoSigaretta(12)).toBe(30);
    expect(permessoSigaretta(30)).toBe(30);
    expect(permessoSigaretta(31)).toBe(60);
    expect(permessoSigaretta(60)).toBe(60);
    expect(permessoSigaretta(61)).toBe(90);
  });
});

describe('esito del rientro', () => {
  it('entro la tolleranza (al secondo) si annulla, oltre è permesso', () => {
    expect(esitoRientroSigaretta(0, 11)).toBe('annulla');
    expect(esitoRientroSigaretta(11 * 60_000, 11)).toBe('annulla');
    expect(esitoRientroSigaretta(11 * 60_000 + 1000, 11)).toBe('permesso');
  });

  it('con tolleranza 0 ogni pausa è permesso', () => {
    expect(esitoRientroSigaretta(1000, 0)).toBe('permesso');
  });
});

describe('countdown', () => {
  it('parte da 11:00 e scende arrotondando per eccesso', () => {
    expect(testoTimer(countdown(0, 11))).toBe('11:00');
    expect(testoTimer(countdown(18_000, 11))).toBe('10:42');
    expect(testoTimer(countdown(18_500, 11))).toBe('10:42');
    expect(testoTimer(countdown(11 * 60_000, 11))).toBe('00:00');
  });

  it('oltre la tolleranza conta in avanti con il +', () => {
    const c = countdown(11 * 60_000 + 150_000, 11);
    expect(c.scaduta).toBe(true);
    expect(c.consumata).toBe(1);
    expect(testoTimer(c)).toBe('+02:30');
  });

  it('la sigaretta si consuma in proporzione al tempo', () => {
    expect(countdown(0, 11).consumata).toBe(0);
    expect(countdown(330_000, 11).consumata).toBeCloseTo(0.5);
    expect(countdown(-5000, 11).consumata).toBe(0);
  });

  it('con tolleranza 0 la sigaretta parte già consumata', () => {
    const c = countdown(0, 0);
    expect(c.consumata).toBe(1);
    expect(testoTimer(countdown(2000, 0))).toBe('+00:02');
  });
});

describe('istante di inizio ricavato dalla timbratura', () => {
  it('usa il minuto della timbratura a secondi zero (ora di Roma)', () => {
    // 08:20:35.500 UTC = 10:20:35.500 a Roma (ora legale); uscita alle 10:05.
    const ora = new Date('2026-10-02T08:20:35.500Z');
    expect(istanteDaMinuti(h('10:05'), ora)).toBe(Date.parse('2026-10-02T08:05:00.000Z'));
  });
});

describe('pausa sigaretta in corso', () => {
  it('trova l\'uscita sigaretta che ha aperto il permesso', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '10:05'],
    ]);
    expect(sigarettaInCorso(g)).toBeNull();
    g.eventi[1]!.sigaretta = true;
    expect(sigarettaInCorso(g)?.id).toBe(g.eventi[1]!.id);
  });

  it('nessuna pausa in corso dopo il rientro', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '10:05'],
      ['RIENTRO_PERMESSO', '10:20'],
    ]);
    g.eventi[1]!.sigaretta = true;
    expect(sigarettaInCorso(g)).toBeNull();
  });
});
```

- [ ] **Step 3: Verificare che fallisca**

Run: `npx vitest run tests/sigaretta.test.ts`
Expected: FAIL — `Failed to resolve import "../src/core/sigaretta"`.

- [ ] **Step 4: Implementare** — creare `src/core/sigaretta.ts`:

```ts
import { analizzaGiornata } from './statoGiornata';
import { adessoRoma } from './tempo';
import type { Evento, Giornata } from './tipi';

/** Oltre la tolleranza la pausa sigaretta diventa permesso a blocchi di questa durata (minuti). */
export const BLOCCO_PERMESSO_SIGARETTA = 30;

/** Permesso conteggiato per una pausa sigaretta di `durata` minuti: blocchi da 30, almeno uno. */
export function permessoSigaretta(durata: number): number {
  return Math.max(1, Math.ceil(durata / BLOCCO_PERMESSO_SIGARETTA)) * BLOCCO_PERMESSO_SIGARETTA;
}

export type EsitoRientroSigaretta = 'annulla' | 'permesso';

/** Entro la tolleranza (confronto al secondo) la pausa si cancella, oltre diventa permesso. */
export function esitoRientroSigaretta(trascorsiMs: number, tolleranzaMinuti: number): EsitoRientroSigaretta {
  return trascorsiMs <= tolleranzaMinuti * 60_000 ? 'annulla' : 'permesso';
}

export interface Countdown {
  /** Millisecondi alla fine della tolleranza (0 se scaduta). */
  residuoMs: number;
  /** Millisecondi oltre la tolleranza (0 se non scaduta). */
  oltreMs: number;
  /** Quanta sigaretta è consumata, da 0 a 1. */
  consumata: number;
  /** True se rientrando adesso la pausa diventerebbe permesso. */
  scaduta: boolean;
}

export function countdown(trascorsiMs: number, tolleranzaMinuti: number): Countdown {
  const totale = tolleranzaMinuti * 60_000;
  const t = Math.max(0, trascorsiMs);
  return {
    residuoMs: Math.max(0, totale - t),
    oltreMs: Math.max(0, t - totale),
    consumata: totale > 0 ? Math.min(1, t / totale) : 1,
    scaduta: esitoRientroSigaretta(t, tolleranzaMinuti) === 'permesso',
  };
}

const dueCifre = (n: number) => String(n).padStart(2, '0');
const mmss = (secondi: number) => `${dueCifre(Math.floor(secondi / 60))}:${dueCifre(secondi % 60)}`;

/** "10:42" mentre scorre (per eccesso: parte da 11:00), "+02:30" oltre la tolleranza. */
export function testoTimer(c: Countdown): string {
  return c.scaduta ? `+${mmss(Math.floor(c.oltreMs / 1000))}` : mmss(Math.ceil(c.residuoMs / 1000));
}

/**
 * Istante (epoch ms) della timbratura delle `minutiEvento` di oggi, ricavato dall'ora attuale:
 * serve quando manca l'istante preciso salvato all'avvio della pausa.
 */
export function istanteDaMinuti(minutiEvento: number, ora: Date): number {
  const { minuti } = adessoRoma(ora);
  return ora.getTime() - ((minuti - minutiEvento) * 60 + ora.getSeconds()) * 1000 - ora.getMilliseconds();
}

/** L'uscita della pausa sigaretta in corso (giornata in permesso aperto da una sigaretta), o null. */
export function sigarettaInCorso(giornata: Giornata): Evento | null {
  const a = analizzaGiornata(giornata);
  if (a.stato !== 'IN_PERMESSO') return null;
  const uscita = a.eventiValidi[a.eventiValidi.length - 1];
  return uscita?.tipo === 'USCITA_PERMESSO' && uscita.sigaretta === true ? uscita : null;
}
```

- [ ] **Step 5: Verificare che passi**

Run: `npx vitest run tests/sigaretta.test.ts`
Expected: PASS (10 test).

Run: `npm test && npx tsc --noEmit`
Expected: tutti i test passano, typecheck senza errori.

- [ ] **Step 6: Commit**

```bash
git add src/core/tipi.ts src/core/sigaretta.ts tests/sigaretta.test.ts
git commit -m "Pausa sigaretta: regole pure (blocchi, esito, countdown)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Calcolo dei permessi sigaretta

**Files:**
- Modify: `src/core/tipi.ts` (nuovo tipo `PermessoSigaretta`, campo `RisultatoGiornata.sigarette`)
- Modify: `src/core/calcolo.ts` (funzione `calcolaGiornata`, nuova `anteprimaSigaretta`)
- Test: `tests/calcolo.test.ts` (nuovo `describe` in fondo)

**Interfaces:**
- Consumes: `permessoSigaretta(durata: number): number` (Task 1); `Evento.sigaretta` (Task 1).
- Produces:
  - `interface PermessoSigaretta { eventoRientroId?: string; da: number; a: number; durata: number; permesso: number }`
  - `RisultatoGiornata.sigarette: PermessoSigaretta[]` (solo pause sigaretta concluse; `permesso` = blocco intero)
  - `anteprimaSigaretta(giornata: Giornata, imp: Impostazioni, minuti: number): PermessoSigaretta | null`

- [ ] **Step 1: Scrivere i test che falliscono** — in `tests/calcolo.test.ts`:

Cambiare la prima riga di import di calcolo in:

```ts
import { anteprimaSigaretta, calcolaGiornata, propostaRientro } from '../src/core/calcolo';
```

e aggiungere dopo gli import:

```ts
import type { Giornata } from '../src/core/tipi';
```

Aggiungere in fondo al file:

```ts
describe('pausa sigaretta', () => {
  /** Marca come sigaretta tutte le uscite in permesso. */
  const conSigaretta = (g: Giornata): Giornata => {
    for (const e of g.eventi) if (e.tipo === 'USCITA_PERMESSO') e.sigaretta = true;
    return g;
  };
  const conPausa = (altri: Parameters<typeof giornata>[0]) =>
    giornata([['ENTRATA', '08:30'], ['INIZIO_PAUSA', '12:30'], ['FINE_PAUSA', '13:30'], ...altri]);

  it('15 min → 30 min di permesso, lavorate −15, coperte invariate', () => {
    const eventi: Parameters<typeof giornata>[0] = [['USCITA_PERMESSO', '15:00'], ['RIENTRO_PERMESSO', '15:15'], ['USCITA', '17:30']];
    const normale = calcolaGiornata(conPausa(eventi), imp, null);
    const r = calcolaGiornata(conSigaretta(conPausa(eventi)), imp, null);
    expect(normale.permesso).toBe(15);
    expect(r.permesso).toBe(30);
    expect(r.lavorati).toBe(normale.lavorati - 15);
    expect(r.coperti).toBe(normale.coperti);
    expect(r.saldo).toBe(0);
    expect(r.sigarette).toEqual([
      { eventoRientroId: r.sigarette[0]!.eventoRientroId, da: h('15:00'), a: h('15:15'), durata: 15, permesso: 30 },
    ]);
    expect(r.sigarette[0]!.eventoRientroId).toBeTruthy();
  });

  it('42 min → 1h di permesso', () => {
    const r = calcolaGiornata(
      conSigaretta(conPausa([['USCITA_PERMESSO', '15:00'], ['RIENTRO_PERMESSO', '15:42'], ['USCITA', '17:30']])),
      imp,
      null,
    );
    expect(r.permesso).toBe(60);
    expect(r.lavorati).toBe(420);
    expect(r.coperti).toBe(480);
  });

  it('l\'uscita prevista non cambia', () => {
    const r = calcolaGiornata(conSigaretta(conPausa([['USCITA_PERMESSO', '15:00'], ['RIENTRO_PERMESSO', '15:15']])), imp, h('16:00'));
    expect(uscita(r)).toBe('17:30');
  });

  it('in fascia pranzo senza pausa registrata non diventa pausa pranzo', () => {
    const r = calcolaGiornata(
      conSigaretta(giornata([['ENTRATA', '08:30'], ['USCITA_PERMESSO', '12:30'], ['RIENTRO_PERMESSO', '12:45']])),
      imp,
      h('13:00'),
    );
    expect(r.ripartizioni).toEqual([]);
    expect(r.permesso).toBe(30);
    expect(r.pausaFatta).toBe(false);
    expect(r.uscitaPrevistaConPausa).toBe(true);
  });

  it('in corso conta la durata reale', () => {
    const r = calcolaGiornata(conSigaretta(giornata([['ENTRATA', '08:30'], ['USCITA_PERMESSO', '10:00']])), imp, h('10:08'));
    expect(r.stato).toBe('IN_PERMESSO');
    expect(r.permesso).toBe(8);
    expect(r.sigarette).toEqual([]);
  });

  it('sigaretta a inizio giornata: le coperte non superano il tempo trascorso', () => {
    const g = conSigaretta(giornata([['ENTRATA', '08:30'], ['USCITA_PERMESSO', '08:35'], ['RIENTRO_PERMESSO', '08:40']]));
    const presto = calcolaGiornata(g, imp, h('08:41'));
    expect(presto.coperti).toBe(11);
    expect(presto.lavorati).toBe(0);
    expect(presto.permesso).toBe(11);
    const dopo = calcolaGiornata(g, imp, h('09:30'));
    expect(dopo.coperti).toBe(60);
    expect(dopo.lavorati).toBe(30);
    expect(dopo.permesso).toBe(30);
  });

  it('anteprima del permesso rientrando adesso', () => {
    const g = conSigaretta(giornata([['ENTRATA', '08:30'], ['USCITA_PERMESSO', '10:00']]));
    expect(anteprimaSigaretta(g, imp, h('10:20'))).toMatchObject({ durata: 20, permesso: 30 });
    expect(anteprimaSigaretta(g, imp, h('10:31'))).toMatchObject({ durata: 31, permesso: 60 });
    expect(anteprimaSigaretta(giornata([['ENTRATA', '08:30'], ['USCITA_PERMESSO', '10:00']]), imp, h('10:20'))).toBeNull();
  });
});
```

- [ ] **Step 2: Verificare che falliscano**

Run: `npx vitest run tests/calcolo.test.ts`
Expected: FAIL — `anteprimaSigaretta is not a function` e asserzioni sul permesso (15 invece di 30).

- [ ] **Step 3: Aggiungere il tipo in `src/core/tipi.ts`**

Dopo `interface Ripartizione { … }`:

```ts
/** Pausa sigaretta conclusa: permesso conteggiato a blocchi. */
export interface PermessoSigaretta {
  /** Id dell'evento RIENTRO_PERMESSO che l'ha chiusa. */
  eventoRientroId?: string;
  da: number;
  a: number;
  /** Durata reale in minuti. */
  durata: number;
  /** Permesso conteggiato (blocchi da 30 min). */
  permesso: number;
}
```

In `interface RisultatoGiornata`, dopo `ripartizioni: Ripartizione[];`:

```ts
  sigarette: PermessoSigaretta[];
```

- [ ] **Step 4: Implementare in `src/core/calcolo.ts`**

Import (sostituire le prime tre righe):

```ts
import { permessoSigaretta } from './sigaretta';
import { analizzaGiornata } from './statoGiornata';
import { giornoSettimana } from './tempo';
import type { Giornata, Impostazioni, PermessoSigaretta, Ripartizione, RisultatoGiornata } from './tipi';
```

In `interface Intervallo`, dopo `pausaConfermata?: number;`:

```ts
  /** Per i permessi: aperto da una pausa sigaretta. */
  sigaretta?: boolean;
```

Sostituire la dichiarazione di `aperto` e la funzione `chiudi`:

```ts
  let aperto: { tipo: TipoIntervallo; da: number; sigaretta?: boolean } | null = null;
  let anticipata = false;
  let pausaRegistrata = false;

  const chiudi = (a: number, extra: Partial<Intervallo> = {}) => {
    if (aperto) {
      intervalli.push({ tipo: aperto.tipo, da: aperto.da, a: Math.max(a, aperto.da), aperto: false, sigaretta: aperto.sigaretta, ...extra });
    }
    aperto = null;
  };
```

Nel `switch`, il caso `USCITA_PERMESSO` diventa:

```ts
      case 'USCITA_PERMESSO':
        chiudi(t);
        aperto = { tipo: 'permesso', da: t, sigaretta: e.sigaretta === true };
        break;
```

Il blocco dell'intervallo rimasto aperto diventa:

```ts
  const apertoFinale = aperto as { tipo: TipoIntervallo; da: number; sigaretta?: boolean } | null;
  if (apertoFinale) {
    if (adesso !== null) {
      intervalli.push({
        tipo: apertoFinale.tipo,
        da: apertoFinale.da,
        a: Math.max(conta(adesso), apertoFinale.da),
        aperto: true,
        sigaretta: apertoFinale.sigaretta,
      });
    } else {
      problemi.push('Manca la timbratura di uscita.');
    }
  }
```

Nel passo 2 **eliminare** la riga:

```ts
  const lavorati = Math.max(0, lavoroLordo - penalitaPausa);
```

Il passo 3 diventa (il ramo non sigaretta resta identico a prima):

```ts
  // 3. Permessi intermedi, con eventuale quota di pausa se coprono il pranzo.
  const ripartizioni: Ripartizione[] = [];
  const sigarette: PermessoSigaretta[] = [];
  let permessoIntermedio = 0;
  let pausaScalata = 0;
  let residuoDaScalare = imp.pausaDaScalare;
  let eccedenzaSigarette = 0;
  for (const i of intervalli) {
    if (i.tipo !== 'permesso') continue;
    const d = i.a - i.da;
    if (i.sigaretta) {
      // Mai pausa pranzo. Conclusa vale blocchi da 30 min: l'eccedenza sul tempo
      // reale passa dalle lavorate al permesso (ore coperte invariate).
      if (i.aperto) {
        permessoIntermedio += d;
      } else {
        const permesso = permessoSigaretta(d);
        permessoIntermedio += permesso;
        eccedenzaSigarette += permesso - d;
        sigarette.push({ eventoRientroId: i.rientroId, da: i.da, a: i.a, durata: d, permesso });
      }
      continue;
    }
    const overlap = pausaRegistrata ? 0 : sovrapposizione(i.da, i.a, imp.pranzo.inizio, imp.pranzo.fine);
    if (overlap > 0) {
      const proposta = Math.min(residuoDaScalare, overlap);
      const confermata = i.pausaConfermata !== undefined;
      const pausa = Math.min(d, Math.max(0, confermata ? i.pausaConfermata! : proposta));
      residuoDaScalare = Math.max(0, residuoDaScalare - pausa);
      pausaScalata += pausa;
      permessoIntermedio += d - pausa;
      ripartizioni.push({
        eventoRientroId: i.rientroId,
        da: i.da,
        a: i.a,
        proposta,
        pausa,
        permesso: d - pausa,
        confermata,
      });
    } else {
      permessoIntermedio += d;
    }
  }

  // L'eccedenza si toglie solo dal lavoro che c'è: le coperte non superano mai il tempo trascorso.
  const lavoroNetto = Math.max(0, lavoroLordo - penalitaPausa);
  const eccedenzaApplicata = Math.min(eccedenzaSigarette, lavoroNetto);
  permessoIntermedio -= eccedenzaSigarette - eccedenzaApplicata;
  const lavorati = lavoroNetto - eccedenzaApplicata;
```

Nell'oggetto restituito, dopo `ripartizioni,`:

```ts
    sigarette,
```

In fondo al file, dopo `propostaRientro`:

```ts
/**
 * Permesso che verrebbe conteggiato rientrando alle `minuti` dalla pausa sigaretta
 * in corso. Null se la giornata non è in una pausa sigaretta.
 */
export function anteprimaSigaretta(
  giornata: Giornata,
  imp: Impostazioni,
  minuti: number,
): PermessoSigaretta | null {
  const simulata: Giornata = {
    ...giornata,
    eventi: [...giornata.eventi, { id: '__simulato__', tipo: 'RIENTRO_PERMESSO', minuti }],
  };
  const r = calcolaGiornata(simulata, imp, minuti);
  return r.sigarette.find((x) => x.eventoRientroId === '__simulato__') ?? null;
}
```

- [ ] **Step 5: Verificare che passino**

Run: `npx vitest run tests/calcolo.test.ts`
Expected: PASS (inclusi tutti i test preesistenti).

Run: `npm test && npx tsc --noEmit`
Expected: tutto verde.

- [ ] **Step 6: Commit**

```bash
git add src/core/tipi.ts src/core/calcolo.ts tests/calcolo.test.ts
git commit -m "Pausa sigaretta: permesso a blocchi da 30 min nel calcolo" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Salvataggio, backup e CSV

**Files:**
- Modify: `src/storage/migrazioni.ts` (`normalizzaImpostazioni`, `normalizzaGiornata`)
- Modify: `src/core/csv.ts` (`eventiInTesto`, `importaCsv`)
- Test: `tests/migrazioni.test.ts`, `tests/csv.test.ts`

**Interfaces:**
- Consumes: `Evento.sigaretta`, `Impostazioni.tolleranzaSigaretta` (Task 1); `calcolaGiornata` con i blocchi (Task 2, per la colonna "Ore permesso").
- Produces: dati e CSV che conservano `sigaretta: true` (solo su `USCITA_PERMESSO`) e `tolleranzaSigaretta` (0–60, default 11).

- [ ] **Step 1: Scrivere i test che falliscono**

In `tests/migrazioni.test.ts`, dentro `describe('migrazioni', …)` dopo l'ultimo `it`:

```ts
  it('conserva la pausa sigaretta solo sulle uscite in permesso', () => {
    const d = migra({
      version: 1,
      giornate: {
        '2026-10-01': {
          data: '2026-10-01',
          permessoInizioMinuti: 0,
          eventi: [
            { id: 'a', tipo: 'ENTRATA', minuti: 510, sigaretta: true },
            { id: 'b', tipo: 'USCITA_PERMESSO', minuti: 600, sigaretta: true },
            { id: 'c', tipo: 'RIENTRO_PERMESSO', minuti: 620, sigaretta: 'si' },
          ],
        },
      },
    });
    expect(d.giornate['2026-10-01']!.eventi).toEqual([
      { id: 'a', tipo: 'ENTRATA', minuti: 510 },
      { id: 'b', tipo: 'USCITA_PERMESSO', minuti: 600, sigaretta: true },
      { id: 'c', tipo: 'RIENTRO_PERMESSO', minuti: 620 },
    ]);
  });

  it('tolleranza della pausa sigaretta: predefinita 11, valori non validi scartati', () => {
    const tolleranza = (v: unknown) => migra({ version: 1, impostazioni: { tolleranzaSigaretta: v } }).impostazioni.tolleranzaSigaretta;
    expect(migra({}).impostazioni.tolleranzaSigaretta).toBe(11);
    expect(tolleranza(5)).toBe(5);
    expect(tolleranza(0)).toBe(0);
    expect(tolleranza(60)).toBe(60);
    expect(tolleranza(61)).toBe(11);
    expect(tolleranza(7.5)).toBe(11);
    expect(tolleranza('11')).toBe(11);
  });
```

In `tests/csv.test.ts`, dentro `describe('CSV', …)` dopo il test `'round trip esporta → importa'`:

```ts
  it('pausa sigaretta: suffisso nel CSV, permesso a blocchi e ritorno', () => {
    const g = giornata(
      [
        ['ENTRATA', '08:30'],
        ['USCITA_PERMESSO', '10:05'],
        ['RIENTRO_PERMESSO', '10:20'],
        ['USCITA', '17:30'],
      ],
      { data: '2026-10-02' },
    );
    g.eventi[1]!.sigaretta = true;
    const csv = esportaCsv({ [g.data]: g }, imp, oggi);
    expect(csv).toContain('10:05 Uscita in permesso (sigaretta)');
    // dovute 8h, lavorate 8h30, permesso 30 min (blocco), saldo +1h
    expect(csv).toContain('2026-10-02;Venerdì;8,00;8,50;0,50;1,00;');
    const i = importaCsv(csv)[g.data]!;
    expect(i.eventi.map((e) => e.sigaretta)).toEqual([undefined, true, undefined, undefined]);
  });

  it('il suffisso (sigaretta) vale solo sulle uscite in permesso', () => {
    const csv = 'Data;Eventi\r\n2026-10-02;08:30 Entrata (sigaretta), 10:05 Uscita in permesso (sigaretta)\r\n';
    const i = importaCsv(csv)['2026-10-02']!;
    expect(i.eventi.map((e) => e.sigaretta)).toEqual([undefined, true]);
  });
```

- [ ] **Step 2: Verificare che falliscano**

Run: `npx vitest run tests/migrazioni.test.ts tests/csv.test.ts`
Expected: FAIL — `sigaretta` scartato in `migra`, `tolleranza(5)` restituisce 11, il CSV non contiene `(sigaretta)`, l'import di `08:30 Entrata (sigaretta)` lancia `ErroreImportazione`.

- [ ] **Step 3: Implementare in `src/storage/migrazioni.ts`**

In `normalizzaImpostazioni`, dopo la riga di `imp.pausaMinima`:

```ts
  imp.tolleranzaSigaretta = intIn(v.tolleranzaSigaretta, 0, 60) ?? p.tolleranzaSigaretta;
```

In `normalizzaGiornata`, dopo la riga `if (tipo === 'RIENTRO_PERMESSO' && pc !== undefined) ev.pausaConfermata = pc;`:

```ts
      if (tipo === 'USCITA_PERMESSO' && e.sigaretta === true) ev.sigaretta = true;
```

- [ ] **Step 4: Implementare in `src/core/csv.ts`**

Sostituire `eventiInTesto` (commento incluso):

```ts
/** "08:30 Entrata, 10:05 Uscita in permesso (sigaretta), 14:30 Rientro da permesso (pausa 60)" */
export function eventiInTesto(eventi: readonly Evento[]): string {
  return [...eventi]
    .sort((a, b) => a.minuti - b.minuti)
    .map((e) => {
      const base = `${formattaOra(e.minuti)} ${ETICHETTE_EVENTO[e.tipo]}`;
      if (e.pausaConfermata !== undefined) return `${base} (pausa ${e.pausaConfermata})`;
      return e.sigaretta ? `${base} (sigaretta)` : base;
    })
    .join(', ');
}
```

In `importaCsv`, sostituire la regex e la costruzione dell'evento:

```ts
      const m = /^(\d{1,2}[:.]\d{2})\s+(.+?)(?:\s*\((?:pausa\s+(\d+)|(sigaretta))\))?$/i.exec(p);
```

```ts
      const ev: Evento = { id: nuovoId(), tipo, minuti };
      if (m[3] !== undefined && tipo === 'RIENTRO_PERMESSO') ev.pausaConfermata = Number(m[3]);
      if (m[4] !== undefined && tipo === 'USCITA_PERMESSO') ev.sigaretta = true;
      eventi.push(ev);
```

- [ ] **Step 5: Verificare che passino**

Run: `npx vitest run tests/migrazioni.test.ts tests/csv.test.ts`
Expected: PASS.

Run: `npm test && npx tsc --noEmit`
Expected: tutto verde.

- [ ] **Step 6: Commit**

```bash
git add src/storage/migrazioni.ts src/core/csv.ts tests/migrazioni.test.ts tests/csv.test.ts
git commit -m "Pausa sigaretta: conservata in backup JSON e CSV, tolleranza nelle impostazioni" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Bottone e schermata della pausa sigaretta

**Files:**
- Modify: `src/core/statoGiornata.ts` (`Azione`, `ETICHETTE_AZIONE`, `azioniDisponibili`)
- Modify: `src/ui/aiutoTesti.ts` (nuova voce)
- Create: `src/ui/sigaretta.ts`
- Modify: `src/ui/giorno.ts` (`pulsantiAzione`, `eseguiAzione`, `timeline`)
- Modify: `src/ui/editor.ts` (`editorEvento`, salvataggio)
- Modify: `src/main.ts` (`render`)
- Modify: `src/style.css` (nuova sezione prima di `/* Selettore orario 24h */`)
- Test: `tests/statoGiornata.test.ts`, `tests/aiuto.test.ts`

**Interfaces:**
- Consumes: da Task 1 `BLOCCO_PERMESSO_SIGARETTA`, `countdown`, `esitoRientroSigaretta`, `istanteDaMinuti`, `sigarettaInCorso`, `testoTimer`; da Task 2 `anteprimaSigaretta`, `RisultatoGiornata.sigarette`; esistenti `store`, `conferma`, `toast`, `el`, `nuovoId`, `adessoRoma`, `formattaOra`, `formattaDurata`.
- Produces:
  - `Azione` include `'PAUSA_SIGARETTA'` (etichetta *Pausa sigaretta*)
  - `avviaPausaSigaretta(data: string, minuti: number): void`
  - `riprendiPausaSigaretta(data: string): void`
  - voce d'aiuto con id `'pausa-sigaretta'` (usata da Task 5)

- [ ] **Step 1: Scrivere i test che falliscono**

In `tests/statoGiornata.test.ts`, nel test `'azioni secondarie sensate'`, sostituire la prima riga e aggiungerne una:

```ts
    expect(azioniDisponibili('AL_LAVORO', true).secondarie).toEqual(['PAUSA_SIGARETTA', 'USCITA_PERMESSO', 'USCITA_ANTICIPATA']);
    expect(azioniDisponibili('AL_LAVORO', false).secondarie).toEqual(['PAUSA_SIGARETTA', 'USCITA_PERMESSO', 'USCITA_ANTICIPATA', 'USCITA']);
```

In `tests/aiuto.test.ts`, dopo il test `'i testi seguono le impostazioni correnti'`:

```ts
  it('la pausa sigaretta usa la tolleranza impostata', () => {
    const v = vociAiuto(impostazioni({ tolleranzaSigaretta: 7 }));
    const voce = v.find((x) => x.id === 'pausa-sigaretta')!;
    expect(voce.azione).toBe('PAUSA_SIGARETTA');
    expect(voce.testo.join(' ')).toContain('7 min');
  });
```

- [ ] **Step 2: Verificare che falliscano**

Run: `npx vitest run tests/statoGiornata.test.ts tests/aiuto.test.ts`
Expected: FAIL — secondarie senza `PAUSA_SIGARETTA`; voce `pausa-sigaretta` assente (`Cannot read properties of undefined`).

- [ ] **Step 3: Azione in `src/core/statoGiornata.ts`**

```ts
/** Azioni proponibili in UI. */
export type Azione =
  | TipoEvento
  | 'PAUSA_SIGARETTA'
  | 'PERMESSO_INIZIO_GIORNATA'
  | 'NON_RIENTRO'
  | 'RIAPRI';
```

In `ETICHETTE_AZIONE`, dopo `USCITA_ANTICIPATA: 'Uscita anticipata',`:

```ts
  PAUSA_SIGARETTA: 'Pausa sigaretta',
```

In `azioniDisponibili`, il caso `AL_LAVORO`:

```ts
    case 'AL_LAVORO':
      return pausaFatta
        ? { primaria: 'USCITA', secondarie: ['PAUSA_SIGARETTA', 'USCITA_PERMESSO', 'USCITA_ANTICIPATA'] }
        : { primaria: 'INIZIO_PAUSA', secondarie: ['PAUSA_SIGARETTA', 'USCITA_PERMESSO', 'USCITA_ANTICIPATA', 'USCITA'] };
```

- [ ] **Step 4: Voce d'aiuto in `src/ui/aiutoTesti.ts`**

In `vociAiuto`, dopo `const dovute = …;`:

```ts
  const tolleranza = formattaDurata(imp.tolleranzaSigaretta);
```

Nella sezione `// --- I bottoni`, dopo la voce `'non-rientro'`:

```ts
    {
      id: 'pausa-sigaretta',
      sezione: 'I bottoni',
      azione: 'PAUSA_SIGARETTA',
      domanda: 'Pausa sigaretta',
      testo: [
        `Registra un'uscita in permesso e apre una schermata con il conto alla rovescia di ${tolleranza}: la sigaretta si consuma mentre il tempo passa. Quando torni tocca "Rientro".`,
        `• Rientri entro ${tolleranza}: la pausa viene cancellata e non resta nessuna timbratura.`,
        '• Rientri dopo: la pausa diventa permesso a blocchi di 30 min (fino a 30 min → 30 min, fino a 1h → 1h, e così via).',
        'Le ore coperte e l\'uscita prevista non cambiano: il tempo del blocco oltre la pausa reale passa dalle ore lavorate al permesso.',
        'Esempio: pausa di 15 min → 30 min di permesso e 15 min in meno di lavorate; pausa di 42 min → 1h di permesso.',
        'Hai toccato il bottone per sbaglio? Usa "Annulla pausa" nella schermata. Se chiudi l\'app durante la pausa, alla riapertura il conto riprende da dove era.',
        'La tolleranza si cambia in Impostazioni → Pausa sigaretta.',
      ],
    },
```

- [ ] **Step 5: Verificare i test**

Run: `npx vitest run tests/statoGiornata.test.ts tests/aiuto.test.ts`
Expected: PASS. (Il typecheck fallisce finché `giorno.ts` non gestisce la nuova azione: si sistema negli step successivi.)

- [ ] **Step 6: Creare `src/ui/sigaretta.ts`**

```ts
import { anteprimaSigaretta } from '../core/calcolo';
import { nuovoId } from '../core/id';
import {
  BLOCCO_PERMESSO_SIGARETTA,
  countdown,
  esitoRientroSigaretta,
  istanteDaMinuti,
  sigarettaInCorso,
  testoTimer,
} from '../core/sigaretta';
import { adessoRoma, formattaDurata, formattaOra } from '../core/tempo';
import type { Evento } from '../core/tipi';
import { store } from '../storage/store';
import { conferma, toast } from './dialoghi';
import { el } from './dom';

/** Istante preciso di inizio: è uno stato del dispositivo, non dei dati (come tema e banner). */
const CHIAVE = 'timbrature-sigaretta';

interface InizioSalvato {
  data: string;
  eventoId: string;
  inizio: number;
}

function salvaInizio(v: InizioSalvato): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(v));
  } catch {
    /* si userà l'orario della timbratura */
  }
}

function leggiInizio(data: string, uscita: Evento): number {
  try {
    const v = JSON.parse(localStorage.getItem(CHIAVE) ?? 'null') as Partial<InizioSalvato> | null;
    if (v && v.data === data && v.eventoId === uscita.id && typeof v.inizio === 'number') return v.inizio;
  } catch {
    /* chiave illeggibile */
  }
  return istanteDaMinuti(uscita.minuti, new Date());
}

function cancellaInizio(): void {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    /* ignora */
  }
}

/** Lunghezza della cartina nel disegno (unità SVG): si accorcia fino a 0. */
const CARTINA = 200;

const DISEGNO = `
<svg class="sigaretta-disegno" viewBox="0 0 300 100" aria-hidden="true">
  <defs>
    <linearGradient id="sig-brace" x1="0" x2="1">
      <stop offset="0" stop-color="#ffd27a"/>
      <stop offset="0.5" stop-color="#ff5a1f"/>
      <stop offset="1" stop-color="#7a1600"/>
    </linearGradient>
    <filter id="sig-bagliore" x="-1" y="-1" width="3" height="3">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <rect x="10" y="60" width="60" height="16" rx="3" fill="#d9822b"/>
  <g fill="#b8641c">
    <circle cx="22" cy="65" r="1.4"/><circle cx="35" cy="71" r="1.2"/>
    <circle cx="48" cy="64" r="1.3"/><circle cx="60" cy="70" r="1.1"/>
  </g>
  <rect x="68" y="60" width="4" height="16" fill="#c9a227"/>
  <rect class="sigaretta-cartina" x="72" y="60" width="${CARTINA}" height="16" fill="#f4f1ea"/>
  <g class="sigaretta-punta">
    <ellipse class="sigaretta-bagliore" cx="272" cy="68" rx="9" ry="11" fill="#ff5a1f" filter="url(#sig-bagliore)"/>
    <rect x="268" y="60" width="6" height="16" rx="2" fill="url(#sig-brace)"/>
    <rect x="273" y="61" width="11" height="14" rx="5" fill="#8a8580"/>
    <g class="sigaretta-fumo" fill="none" stroke="#d8d4cf" stroke-width="3" stroke-linecap="round">
      <path d="M279 56 c-8 -8 8 -14 0 -22 c-7 -7 6 -12 0 -20"/>
      <path d="M279 56 c7 -9 -7 -15 1 -24 c6 -7 -5 -12 1 -18"/>
      <path d="M279 56 c-5 -7 9 -13 2 -21 c-6 -8 7 -12 0 -19"/>
    </g>
  </g>
</svg>`;

let aperta = false;

/** Registra l'uscita della pausa sigaretta e apre la schermata. */
export function avviaPausaSigaretta(data: string, minuti: number): void {
  const id = nuovoId();
  salvaInizio({ data, eventoId: id, inizio: Date.now() });
  store.modificaGiornata(data, (g) => void g.eventi.push({ id, tipo: 'USCITA_PERMESSO', minuti, sigaretta: true }));
  riprendiPausaSigaretta(data);
}

/** Apre la schermata se nella giornata c'è una pausa sigaretta in corso (e non è già aperta). */
export function riprendiPausaSigaretta(data: string): void {
  if (aperta) return;
  const uscita = sigarettaInCorso(store.giornata(data));
  if (uscita) apriSchermata(data, uscita);
}

function apriSchermata(data: string, uscita: Evento): void {
  aperta = true;
  const inizio = leggiInizio(data, uscita);
  const tolleranza = store.impostazioni.tolleranzaSigaretta;
  const entro = formattaOra(adessoRoma(new Date(inizio + tolleranza * 60_000)).minuti);

  const scena = el('div', { class: 'sigaretta-scena' });
  scena.innerHTML = DISEGNO; // markup statico, nessun dato dell'utente
  const cartina = scena.querySelector('.sigaretta-cartina')!;
  const punta = scena.querySelector('.sigaretta-punta')!;
  const timer = el('p', { class: 'sigaretta-timer', role: 'timer' });
  const nota = el('p', { class: 'sigaretta-nota' });

  let chiusaDaNoi = false;
  const termina = () => {
    chiusaDaNoi = true;
    dlg.close();
  };

  const dlg = el(
    'dialog',
    { class: 'sigaretta', 'aria-label': 'Pausa sigaretta' },
    el('header', {}, el('h2', {}, 'Pausa sigaretta'), el('p', { class: 'sigaretta-uscita' }, `uscita alle ${formattaOra(uscita.minuti)}`)),
    scena,
    timer,
    nota,
    el(
      'div',
      { class: 'sigaretta-azioni' },
      el(
        'button',
        {
          type: 'button',
          class: 'btn btn-primario',
          onclick: () => {
            termina();
            rientra(data, uscita, inizio);
          },
        },
        'Rientro',
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'sigaretta-annulla',
          onclick: async () => {
            const ok = await conferma(
              'Annullare la pausa?',
              'L\'uscita per la pausa sigaretta verrà eliminata, come se non l\'avessi registrata.',
              'Annulla pausa',
              true,
            );
            if (!ok) return;
            termina();
            cancellaInizio();
            store.modificaGiornata(data, (g) => void (g.eventi = g.eventi.filter((e) => e.id !== uscita.id)));
            toast('Pausa sigaretta annullata');
          },
        },
        'Annulla pausa',
      ),
    ),
  );

  const aggiorna = () => {
    const c = countdown(Date.now() - inizio, tolleranza);
    cartina.setAttribute('width', String(CARTINA * (1 - c.consumata)));
    punta.setAttribute('transform', `translate(${-CARTINA * c.consumata} 0)`);
    dlg.classList.toggle('consumata', c.consumata >= 1);
    dlg.classList.toggle('scaduta', c.scaduta);
    timer.textContent = testoTimer(c);
    if (c.scaduta) {
      const p = anteprimaSigaretta(store.giornata(data), store.impostazioni, adessoRoma().minuti);
      nota.textContent = `Al rientro: ${formattaDurata(p?.permesso ?? BLOCCO_PERMESSO_SIGARETTA)} di permesso`;
    } else {
      nota.textContent = `Rientra entro le ${entro} per non segnare nulla`;
    }
  };
  const intervallo = setInterval(aggiorna, 1000);

  // Si esce solo con Rientro o Annulla pausa.
  dlg.addEventListener('cancel', (ev) => ev.preventDefault());
  dlg.addEventListener('close', () => {
    clearInterval(intervallo);
    dlg.remove();
    aperta = false;
    // Chiusa dal sistema (Esc, tasto Indietro): la pausa è ancora in corso, si riapre.
    if (!chiusaDaNoi) riprendiPausaSigaretta(data);
  });
  document.body.append(dlg);
  dlg.showModal();
  aggiorna();
}

function rientra(data: string, uscita: Evento, inizio: number): void {
  const trascorsi = Date.now() - inizio;
  const { minuti } = adessoRoma();
  cancellaInizio();
  if (esitoRientroSigaretta(trascorsi, store.impostazioni.tolleranzaSigaretta) === 'annulla') {
    store.modificaGiornata(data, (g) => void (g.eventi = g.eventi.filter((e) => e.id !== uscita.id)));
    toast(`Pausa sigaretta di ${formattaDurata(Math.max(1, Math.round(trascorsi / 60_000)))}: non conteggiata`);
    return;
  }
  const permesso = anteprimaSigaretta(store.giornata(data), store.impostazioni, minuti)?.permesso ?? BLOCCO_PERMESSO_SIGARETTA;
  store.modificaGiornata(data, (g) => void g.eventi.push({ id: nuovoId(), tipo: 'RIENTRO_PERMESSO', minuti }));
  toast(`Rientro alle ${formattaOra(minuti)} · ${formattaDurata(permesso)} di permesso`);
}
```

- [ ] **Step 7: Collegare in `src/ui/giorno.ts`**

Import, dopo `import { confermaRipartizione, editorEvento, editorPermessoInizio } from './editor';`:

```ts
import { avviaPausaSigaretta } from './sigaretta';
```

In `pulsantiAzione`, il bottone secondario mostra l'icona per la sigaretta — sostituire il `map` delle secondarie:

```ts
          secondarie.map((a) =>
            el(
              'button',
              { type: 'button', class: 'btn btn-secondario', onclick: () => void eseguiAzione(a, data) },
              a === 'PAUSA_SIGARETTA' ? `🚬 ${ETICHETTE_AZIONE[a]}` : ETICHETTE_AZIONE[a],
            ),
          ),
```

In `eseguiAzione`, nello `switch` prima di `case 'PERMESSO_INIZIO_GIORNATA':`:

```ts
    case 'PAUSA_SIGARETTA':
      avviaPausaSigaretta(data, minuti);
      return;
```

In `timeline`, dentro il `for (const e of ordinati)`, sostituire le righe di `rip` e `dettaglio`:

```ts
    const rip = r.ripartizioni.find((x) => x.eventoRientroId === e.id);
    const sig = r.sigarette.find((x) => x.eventoRientroId === e.id);
    const dettaglio = rip
      ? `${formattaDurata(rip.pausa)} pausa + ${formattaDurata(rip.permesso)} permesso${rip.confermata ? '' : ' (proposta)'}`
      : sig
        ? `${formattaDurata(sig.permesso)} di permesso (pausa sigaretta di ${formattaDurata(sig.durata)})`
        : scartati.has(e.id)
          ? 'non coerente: da correggere'
          : e.tipo === 'USCITA_PERMESSO' && e.sigaretta
            ? '🚬 pausa sigaretta'
            : null;
```

- [ ] **Step 8: Editor in `src/ui/editor.ts`**

Nel salvataggio di un evento esistente, dopo `e.minuti = minuti;`:

```ts
          if (tipo !== 'USCITA_PERMESSO') delete e.sigaretta;
```

- [ ] **Step 9: Ripresa in `src/main.ts`**

Import, subito dopo `import { impostaOrologio, vistaGiorno, type Adesso } from './ui/giorno';` (non vicino agli import di `./ui/aiuto` e `./ui/tema`, che il branch del banner modifica):

```ts
import { riprendiPausaSigaretta } from './ui/sigaretta';
```

In `render`, subito dopo `window.scrollTo(0, scroll);` (prima di `monta(tabbar, …)`):

```ts
  // Pausa sigaretta in corso (app riaperta o tornata in primo piano): ripresenta la schermata.
  riprendiPausaSigaretta(adesso.data);
```

- [ ] **Step 10: Stili in `src/style.css`**

Inserire subito **prima** della riga `/* Selettore orario 24h */`:

```css
/* Pausa sigaretta: schermata a tutto schermo, sempre scura */
.sigaretta {
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: calc(var(--sicuro-alto) + 24px) calc(var(--sicuro-dx) + 16px) calc(var(--sicuro-basso) + 24px)
    calc(var(--sicuro-sx) + 16px);
  border: 0;
  background: radial-gradient(circle at 50% 40%, #2b2320, #0c0a09 70%);
  color: #f5f5f4;
  text-align: center;
}
.sigaretta[open] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.sigaretta::backdrop {
  background: #0c0a09;
}
.sigaretta h2 {
  margin: 0;
  font-size: 24px;
}
.sigaretta-uscita {
  margin: 4px 0 0;
  color: #a8a29e;
}
.sigaretta-scena {
  width: 100%;
  max-width: 420px;
}
.sigaretta-disegno {
  display: block;
  width: 100%;
  height: auto;
}
.sigaretta-timer {
  margin: 0;
  font-size: 64px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.sigaretta.scaduta .sigaretta-timer {
  color: #ff6b81;
}
.sigaretta-nota {
  margin: 0;
  min-height: 1.4em;
  color: #d6d3d1;
}
.sigaretta-azioni {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 420px;
  margin-top: 8px;
}
.sigaretta-azioni .btn-primario {
  min-height: 56px;
  font-size: 18px;
}
.sigaretta-annulla {
  padding: 8px;
  border: 0;
  background: none;
  color: #a8a29e;
  font-size: 15px;
  text-decoration: underline;
}
.sigaretta.consumata .sigaretta-punta {
  display: none;
}
.sigaretta-bagliore {
  animation: brace 1.6s ease-in-out infinite;
}
/* Senza animazione (riduci movimento) il fumo resta invisibile. */
.sigaretta-fumo path {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: fumo 3.6s ease-out infinite;
}
.sigaretta-fumo path:nth-child(2) {
  animation-delay: 1.2s;
}
.sigaretta-fumo path:nth-child(3) {
  animation-delay: 2.4s;
}
@keyframes brace {
  50% {
    opacity: 0.45;
  }
}
@keyframes fumo {
  0% {
    opacity: 0;
    transform: translateY(6px) scaleX(0.6);
  }
  25% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
    transform: translateY(-14px) scaleX(1.4);
  }
}

```

- [ ] **Step 11: Test automatici e typecheck**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: tutti i test passano, typecheck e build senza errori.

- [ ] **Step 12: Verifica manuale nel browser**

Run: `npm run dev` e aprire `http://localhost:5173/krumiro2.0/` con la finestra larga 375 px (DevTools, modalità dispositivo). Partire da una giornata vuota (DevTools → Application → Local Storage: rimuovere `timbrature` e `timbrature-sigaretta`).

1. Toccare *Entrata*. Tra le azioni secondarie il primo bottone è **🚬 Pausa sigaretta**.
2. Toccarlo: si apre la schermata scura con *uscita alle HH:MM*, la sigaretta con brace e fumo, il timer che parte da `11:00` e scende, la nota *Rientra entro le HH:MM per non segnare nulla*.
3. **Ricarica** (F5): la schermata ricompare da sola con il timer corretto (non riparte da 11:00).
4. **Esc**: la schermata ricompare subito; la giornata resta in pausa.
5. **Annulla pausa** → confermare: la schermata si chiude, toast *Pausa sigaretta annullata*, la timeline mostra solo l'entrata (come prima del tocco), il bottone grande è di nuovo *Inizio pausa*.
6. Avviare di nuovo la pausa e toccare **Rientro** entro qualche secondo: toast *Pausa sigaretta di 1 min: non conteggiata*, nessuna timbratura aggiunta.
7. Avviare di nuovo la pausa. In DevTools → Console eseguire
   `const k='timbrature-sigaretta', v=JSON.parse(localStorage.getItem(k)); v.inizio-=12*60000; localStorage.setItem(k, JSON.stringify(v)); location.reload();`
   Alla ricarica: sigaretta consumata (resta il filtro, niente fumo), timer rosso `+01:0x` che sale, nota *Al rientro: 30 min di permesso*.
8. Toccare **Rientro**: toast *Rientro alle HH:MM · 30 min di permesso*; in timeline l'uscita mostra *🚬 pausa sigaretta* e il rientro *30 min di permesso (pausa sigaretta di 0 min)*; la scheda in alto mostra *Permesso 30 min*.
9. Toccare l'uscita sigaretta nella timeline, cambiare solo l'orario e salvare: il dettaglio *🚬 pausa sigaretta* resta. Riaprirla, cambiare il tipo in *Uscita* e salvare: il dettaglio sparisce.
10. Ripetere i passi 2 e 7 con il tema **Chiaro** e **Scuro** (Impostazioni → Tema): la schermata è identica (sempre scura) e leggibile.
11. DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*: niente fumo né pulsazione, la sigaretta si accorcia comunque.

- [ ] **Step 13: Commit**

```bash
git add src/core/statoGiornata.ts src/ui/aiutoTesti.ts src/ui/sigaretta.ts src/ui/giorno.ts src/ui/editor.ts src/main.ts src/style.css tests/statoGiornata.test.ts tests/aiuto.test.ts
git commit -m "Bottone Pausa sigaretta con countdown e sigaretta che si consuma" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Tolleranza nelle Impostazioni e README

**Files:**
- Modify: `src/ui/impostazioni.ts` (`inputMinuti`, nuova scheda, testo del ripristino)
- Modify: `README.md` (sezioni *Come si usa* e *Regole di calcolo*)

**Interfaces:**
- Consumes: `Impostazioni.tolleranzaSigaretta` (Task 1, normalizzata in Task 3); voce d'aiuto `'pausa-sigaretta'` (Task 4); `linkAiuto(testo, destinazione)` esistente.
- Produces: campo *Tolleranza (min)* che salva in `store.impostazioni.tolleranzaSigaretta`.

- [ ] **Step 1: Parametro `step` in `inputMinuti`** — sostituire le prime due righe della funzione:

```ts
function inputMinuti(valore: number, onCambio: (v: number) => void, aria: string, max = 600, step = 5): HTMLInputElement {
  const i = el('input', { type: 'number', inputmode: 'numeric', min: 0, max, step, value: String(valore), 'aria-label': aria });
```

- [ ] **Step 2: Nuova scheda** — in `vistaImpostazioni`, subito dopo la chiusura della scheda *Pausa pranzo* (dopo la `riga('Pausa minima (min)', …)` e la sua `),`) e prima della scheda *Conteggio*:

```ts
    el(
      'div',
      { class: 'scheda' },
      el('h2', { class: 'titolo-sezione' }, 'Pausa sigaretta'),
      riga('Tolleranza (min)', inputMinuti(imp.tolleranzaSigaretta, (v) => {
        store.modificaImpostazioni((i) => void (i.tolleranzaSigaretta = v));
        salvato();
      }, 'Tolleranza della pausa sigaretta in minuti', 60, 1), 'entro questo tempo la pausa non viene conteggiata'),
      linkAiuto('Come funziona la pausa sigaretta?', 'pausa-sigaretta'),
    ),
```

- [ ] **Step 3: Testo del ripristino** — nel `conferma('Ripristinare le impostazioni?', …)` sostituire il messaggio con:

```ts
'Tornano i valori predefiniti (8h lun–ven, pranzo 12:00–14:30, 60 min da scalare, tolleranza sigaretta 11 min). Le timbrature non vengono toccate.'
```

- [ ] **Step 4: README** — in *Come si usa*, nel punto **Oggi**, sostituire le ultime tre righe (da `(Entrata → Inizio pausa…` a `…le ore coperte e il saldo.`) con:

```markdown
  (Entrata → Inizio pausa → Fine pausa → Uscita). Sotto trovi le azioni secondarie:
  *Pausa sigaretta*, *Esco in permesso*, *Rientro da permesso*, *Uscita anticipata*, *Entro dopo*
  (permesso a inizio giornata). In alto vedi l'**uscita prevista**, le ore coperte e il saldo.
- **Pausa sigaretta**: registra un'uscita e apre una schermata con il conto alla rovescia e una
  sigaretta che si consuma. Se rientri entro la tolleranza (11 min, configurabile) la pausa si
  cancella; altrimenti diventa permesso a blocchi di 30 min.
```

Nel punto **Impostazioni**, dopo `orario di inizio conteggio,` aggiungere `tolleranza della pausa sigaretta,`.

Nella tabella *Regole di calcolo*, dopo la riga *Permesso a metà giornata*:

```markdown
| Pausa sigaretta | entro la tolleranza (11 min) viene cancellata; oltre vale permesso a blocchi di 30 min (15 min → 30 min, 42 min → 1h), le ore coperte non cambiano e non diventa mai pausa pranzo |
```

- [ ] **Step 5: Verifica**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: tutto verde.

Manuale (`npm run dev`, 375 px):
1. Impostazioni → scheda **Pausa sigaretta** con *Tolleranza (min)* = 11 e il link d'aiuto, che apre la voce *Pausa sigaretta*.
2. Impostare **1** → toast *Impostazioni salvate*. Oggi → Entrata → Pausa sigaretta: il timer parte da `01:00`; dopo un minuto diventa rosso con *Al rientro: 30 min di permesso*.
3. Impostare **0**: la sigaretta parte già consumata e il timer è rosso dopo un secondo.
4. Inserire **61** o **-1**: il valore torna a quello precedente, nessun salvataggio.
5. *Ripristina valori predefiniti* → la tolleranza torna a 11.

- [ ] **Step 6: Commit**

```bash
git add src/ui/impostazioni.ts README.md
git commit -m "Impostazioni: tolleranza della pausa sigaretta; README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
