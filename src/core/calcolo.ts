import { analizzaGiornata } from './statoGiornata';
import { giornoSettimana } from './tempo';
import type { Giornata, Impostazioni, Ripartizione, RisultatoGiornata } from './tipi';

type TipoIntervallo = 'lavoro' | 'pausa' | 'permesso';

interface Intervallo {
  tipo: TipoIntervallo;
  da: number;
  a: number;
  aperto: boolean;
  /** Per i permessi chiusi: evento di rientro. */
  rientroId?: string;
  pausaConfermata?: number;
}

/** Minuti dovuti per la data indicata secondo le impostazioni. */
export function minutiDovuti(data: string, imp: Impostazioni): number {
  const v = imp.minutiDovuti.perGiorno[giornoSettimana(data)];
  return v ?? imp.minutiDovuti.predefinito;
}

function sovrapposizione(da: number, a: number, inizio: number, fine: number): number {
  return Math.max(0, Math.min(a, fine) - Math.max(da, inizio));
}

/**
 * Calcola i totali di una giornata. Funzione pura.
 *
 * @param adesso minuti correnti (Europe/Rome) se la giornata è oggi; null per
 *   giornate passate, nel qual caso un intervallo rimasto aperto non viene
 *   conteggiato e la giornata è segnalata da correggere.
 */
export function calcolaGiornata(
  giornata: Giornata,
  imp: Impostazioni,
  adesso: number | null,
): RisultatoGiornata {
  const analisi = analizzaGiornata(giornata);
  const problemi = [...analisi.problemi];
  const minimo = imp.orarioMinimoConteggio;
  const conta = (t: number) => Math.max(t, minimo);

  // 1. Intervalli dagli eventi validi, con orari "contati" (mai prima delle 08:30).
  const intervalli: Intervallo[] = [];
  let aperto: { tipo: TipoIntervallo; da: number } | null = null;
  let anticipata = false;
  let pausaRegistrata = false;

  const chiudi = (a: number, extra: Partial<Intervallo> = {}) => {
    if (aperto) intervalli.push({ tipo: aperto.tipo, da: aperto.da, a: Math.max(a, aperto.da), aperto: false, ...extra });
    aperto = null;
  };

  for (const e of analisi.eventiValidi) {
    const t = conta(e.minuti);
    switch (e.tipo) {
      case 'ENTRATA':
        aperto = { tipo: 'lavoro', da: t };
        break;
      case 'INIZIO_PAUSA':
        pausaRegistrata = true;
        chiudi(t);
        aperto = { tipo: 'pausa', da: t };
        break;
      case 'FINE_PAUSA':
        chiudi(t);
        aperto = { tipo: 'lavoro', da: t };
        break;
      case 'USCITA_PERMESSO':
        chiudi(t);
        aperto = { tipo: 'permesso', da: t };
        break;
      case 'RIENTRO_PERMESSO':
        chiudi(t, { rientroId: e.id, pausaConfermata: e.pausaConfermata });
        aperto = { tipo: 'lavoro', da: t };
        break;
      case 'USCITA':
        chiudi(t);
        break;
      case 'USCITA_ANTICIPATA':
        chiudi(t);
        anticipata = true;
        break;
    }
  }

  const apertoFinale = aperto as { tipo: TipoIntervallo; da: number } | null;
  if (apertoFinale) {
    if (adesso !== null) {
      intervalli.push({ tipo: apertoFinale.tipo, da: apertoFinale.da, a: Math.max(conta(adesso), apertoFinale.da), aperto: true });
    } else {
      problemi.push('Manca la timbratura di uscita.');
    }
  }

  // 2. Lavoro e pause (pausa minima applicata solo alle pause concluse).
  let lavoroLordo = 0;
  let pausaRegistrataMin = 0;
  let penalitaPausa = 0;
  for (const i of intervalli) {
    const d = i.a - i.da;
    if (i.tipo === 'lavoro') lavoroLordo += d;
    if (i.tipo === 'pausa') {
      if (!i.aperto && d < imp.pausaMinima) {
        penalitaPausa += imp.pausaMinima - d;
        pausaRegistrataMin += imp.pausaMinima;
      } else {
        pausaRegistrataMin += d;
      }
    }
  }
  const lavorati = Math.max(0, lavoroLordo - penalitaPausa);

  // 3. Permessi intermedi, con eventuale quota di pausa se coprono il pranzo.
  const ripartizioni: Ripartizione[] = [];
  let permessoIntermedio = 0;
  let pausaScalata = 0;
  let residuoDaScalare = imp.pausaDaScalare;
  for (const i of intervalli) {
    if (i.tipo !== 'permesso') continue;
    const d = i.a - i.da;
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

  // 4. Totali.
  const dovuti = minutiDovuti(giornata.data, imp);
  const permessoInizio =
    Number.isFinite(giornata.permessoInizioMinuti) && giornata.permessoInizioMinuti > 0
      ? giornata.permessoInizioMinuti
      : 0;
  const copertiPrimaUscita = lavorati + permessoInizio + permessoIntermedio;
  const permessoUscita = anticipata ? Math.max(0, dovuti - copertiPrimaUscita) : 0;
  const coperti = copertiPrimaUscita + permessoUscita;
  const pausaFatta = pausaRegistrata || pausaScalata > 0;

  // 5. Uscita prevista.
  let uscitaPrevista: number | null = null;
  let uscitaPrevistaConPausa = false;
  if (adesso !== null && analisi.stato === 'AL_LAVORO') {
    const ora = conta(adesso);
    uscitaPrevista = ora + (dovuti - coperti);
    if (!pausaFatta && ora < imp.pranzo.fine && uscitaPrevista > imp.pranzo.fine) {
      uscitaPrevista += imp.pausaDaScalare;
      uscitaPrevistaConPausa = true;
    }
  } else if (adesso !== null && analisi.stato === 'IN_PAUSA') {
    const pausaInCorso = intervalli.find((i) => i.tipo === 'pausa' && i.aperto);
    const ora = conta(adesso);
    const rientro = pausaInCorso ? Math.max(ora, pausaInCorso.da + imp.pausaMinima) : ora;
    uscitaPrevista = rientro + (dovuti - coperti);
  }

  return {
    stato: analisi.stato,
    daCorreggere: problemi.length > 0,
    problemi,
    dovuti,
    lavorati,
    pausa: pausaRegistrataMin + pausaScalata,
    permessoInizio,
    permessoIntermedio,
    permessoUscita,
    permesso: permessoInizio + permessoIntermedio + permessoUscita,
    coperti,
    saldo: coperti - dovuti,
    uscitaPrevista,
    uscitaPrevistaConPausa,
    pausaFatta,
    ripartizioni,
  };
}

/**
 * Proposta di ripartizione per un rientro da permesso alle `minuti` indicati,
 * prima di registrarlo. Null se il permesso non tocca la fascia pranzo.
 */
export function propostaRientro(
  giornata: Giornata,
  imp: Impostazioni,
  minuti: number,
): Ripartizione | null {
  const simulata: Giornata = {
    ...giornata,
    eventi: [...giornata.eventi, { id: '__simulato__', tipo: 'RIENTRO_PERMESSO', minuti }],
  };
  const r = calcolaGiornata(simulata, imp, minuti);
  return r.ripartizioni.find((x) => x.eventoRientroId === '__simulato__') ?? null;
}
