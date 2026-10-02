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

/**
 * Pausa sigaretta da ripresentare da sola (app riaperta, nuovo render): solo se la giornata
 * è coerente. Con timbrature incoerenti l'utente sta correggendo e la schermata non deve bloccarlo.
 */
export function sigarettaDaRiprendere(giornata: Giornata): Evento | null {
  return analizzaGiornata(giornata).idScartati.size === 0 ? sigarettaInCorso(giornata) : null;
}
