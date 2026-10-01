import { describe, expect, it } from 'vitest';
import { calcolaGiornata, propostaRientro } from '../src/core/calcolo';
import { formattaOra } from '../src/core/tempo';
import { giornata, h, impostazioni, SABATO } from './helpers';

const imp = impostazioni();
const uscita = (r: { uscitaPrevista: number | null }) =>
  r.uscitaPrevista === null ? null : formattaOra(r.uscitaPrevista);

describe('test obbligatori (8h dovute, pausa da scalare 60 min)', () => {
  it('1. normale: entrata 08:30, pausa 12:30–13:30 → uscita 17:30', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
    ]);
    for (const adesso of ['13:30', '14:00', '16:45']) {
      expect(uscita(calcolaGiornata(g, imp, h(adesso)))).toBe('17:30');
    }
  });

  it('2. ingresso posticipato: permesso 2h, entrata 10:30, pausa 12:30–13:30 → uscita 17:30', () => {
    const g = giornata(
      [
        ['ENTRATA', '10:30'],
        ['INIZIO_PAUSA', '12:30'],
        ['FINE_PAUSA', '13:30'],
      ],
      { permessoInizio: 120 },
    );
    const r = calcolaGiornata(g, imp, h('14:00'));
    expect(uscita(r)).toBe('17:30');
    expect(r.permessoInizio).toBe(120);
  });

  it('3. uscita anticipata 15:30 → lavorate 6h, permesso 2h, saldo 0', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
      ['USCITA_ANTICIPATA', '15:30'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.stato).toBe('CHIUSA');
    expect(r.daCorreggere).toBe(false);
    expect(r.lavorati).toBe(360);
    expect(r.permesso).toBe(120);
    expect(r.permessoUscita).toBe(120);
    expect(r.saldo).toBe(0);
  });

  it('4. permesso a metà mattina 10:00–11:00 → uscita 17:30', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '10:00'],
      ['RIENTRO_PERMESSO', '11:00'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
    ]);
    const r = calcolaGiornata(g, imp, h('14:00'));
    expect(uscita(r)).toBe('17:30');
    expect(r.permessoIntermedio).toBe(60);
    expect(r.ripartizioni).toEqual([]);
  });

  it('5. permesso 12:00–14:30 senza pausa → 1h pausa + 1h30 permesso, uscita 17:30', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '14:30'],
    ]);
    const r = calcolaGiornata(g, imp, h('15:00'));
    expect(r.ripartizioni).toHaveLength(1);
    expect(r.ripartizioni[0]).toMatchObject({ proposta: 60, pausa: 60, permesso: 90, confermata: false });
    expect(r.permessoIntermedio).toBe(90);
    expect(r.pausaFatta).toBe(true);
    expect(uscita(r)).toBe('17:30');
  });

  it('6. straordinario: entrata 08:00 (conta 08:30), pausa 12:00–13:00, uscita 18:00 → saldo +30 min', () => {
    const g = giornata([
      ['ENTRATA', '08:00'],
      ['INIZIO_PAUSA', '12:00'],
      ['FINE_PAUSA', '13:00'],
      ['USCITA', '18:00'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.lavorati).toBe(510);
    expect(r.saldo).toBe(30);
  });

  it('6b. straordinario: entrata 08:30, pausa 12:00–13:00, uscita 18:30 → saldo +1h', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:00'],
      ['FINE_PAUSA', '13:00'],
      ['USCITA', '18:30'],
    ]);
    expect(calcolaGiornata(g, imp, null).saldo).toBe(60);
  });
});

describe('orario minimo 08:30', () => {
  it('entrata 07:45 conta come 08:30 anche per l\'uscita prevista', () => {
    const g = giornata([
      ['ENTRATA', '07:45'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
    ]);
    expect(uscita(calcolaGiornata(g, imp, h('14:00')))).toBe('17:30');
  });

  it('prima delle 08:30 il lavoro in corso vale 0', () => {
    const g = giornata([['ENTRATA', '08:00']]);
    const r = calcolaGiornata(g, imp, h('08:15'));
    expect(r.lavorati).toBe(0);
    expect(uscita(r)).toBe('17:30'); // 08:30 + 8h + 1h di pausa prevista
  });

  it('l\'orario minimo è configurabile', () => {
    const g = giornata([
      ['ENTRATA', '08:00'],
      ['INIZIO_PAUSA', '12:00'],
      ['FINE_PAUSA', '13:00'],
      ['USCITA', '17:00'],
    ]);
    expect(calcolaGiornata(g, impostazioni({ orarioMinimoConteggio: h('07:30') }), null).saldo).toBe(0);
  });
});

describe('pausa minima 30 min', () => {
  it('una pausa di 15 minuti conta come 30', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '12:45'],
    ]);
    const r = calcolaGiornata(g, imp, h('13:00'));
    expect(r.lavorati).toBe(240 + 15 - 15); // 4h + 15 min dopo la pausa − 15 min di penalità
    expect(r.pausa).toBe(30);
    expect(uscita(r)).toBe('17:00');
  });

  it('pausa di 15 minuti con uscita: il saldo tiene conto del minimo', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '12:45'],
      ['USCITA', '17:00'],
    ]);
    expect(calcolaGiornata(g, imp, null).saldo).toBe(0);
  });

  it('durante la pausa l\'uscita prevista considera il rientro dopo almeno 30 min', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
    ]);
    const r = calcolaGiornata(g, imp, h('12:40'));
    expect(r.stato).toBe('IN_PAUSA');
    expect(uscita(r)).toBe('17:00');
    expect(uscita(calcolaGiornata(g, imp, h('13:30')))).toBe('17:30');
  });
});

describe('uscita prevista prima della pausa', () => {
  it('include la pausa da scalare se l\'uscita cade dopo la fascia pranzo', () => {
    const g = giornata([['ENTRATA', '08:30']]);
    const r = calcolaGiornata(g, imp, h('10:00'));
    expect(uscita(r)).toBe('17:30');
    expect(r.uscitaPrevistaConPausa).toBe(true);
  });

  it('test 2 prima della pausa: 10:30 con 2h di permesso → 17:30', () => {
    const g = giornata([['ENTRATA', '10:30']], { permessoInizio: 120 });
    expect(uscita(calcolaGiornata(g, imp, h('10:30')))).toBe('17:30');
  });

  it('non aggiunge la pausa se si esce prima della fascia pranzo', () => {
    const g = giornata([['ENTRATA', '08:30']], { permessoInizio: 240 });
    const r = calcolaGiornata(g, imp, h('09:00'));
    expect(uscita(r)).toBe('12:30');
    expect(r.uscitaPrevistaConPausa).toBe(false);
  });

  it('non aggiunge la pausa se la fascia pranzo è già passata', () => {
    const g = giornata([['ENTRATA', '10:00']]);
    const r = calcolaGiornata(g, imp, h('15:00'));
    expect(uscita(r)).toBe('18:00');
    expect(r.uscitaPrevistaConPausa).toBe(false);
  });

  it('ore già completate: uscita prevista nel passato, saldo positivo', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
    ]);
    const r = calcolaGiornata(g, imp, h('18:00'));
    expect(uscita(r)).toBe('17:30');
    expect(r.saldo).toBe(30);
  });
});

describe('permesso a ridosso del pranzo', () => {
  it('sovrapposizione parziale minore della pausa da scalare', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '11:00'],
      ['RIENTRO_PERMESSO', '12:30'],
    ]);
    const r = calcolaGiornata(g, imp, h('13:00'));
    expect(r.ripartizioni[0]).toMatchObject({ proposta: 30, pausa: 30, permesso: 60 });
  });

  it('nessuna ripartizione se la pausa è registrata', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '13:00'],
      ['INIZIO_PAUSA', '13:00'],
      ['FINE_PAUSA', '14:00'],
    ]);
    const r = calcolaGiornata(g, imp, h('14:30'));
    expect(r.ripartizioni).toEqual([]);
    expect(r.permessoIntermedio).toBe(60);
  });

  it('ripartizione modificata dall\'utente', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '14:30', 30],
    ]);
    const r = calcolaGiornata(g, imp, h('15:00'));
    expect(r.ripartizioni[0]).toMatchObject({ proposta: 60, pausa: 30, permesso: 120, confermata: true });
    expect(uscita(r)).toBe('17:00');
  });

  it('ripartizione confermata a 0: tutto permesso', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '14:30', 0],
    ]);
    const r = calcolaGiornata(g, imp, h('15:00'));
    expect(r.permessoIntermedio).toBe(150);
    expect(r.pausaFatta).toBe(false);
  });

  it('la pausa scalata non supera il totale configurato su più permessi', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '12:45'],
      ['USCITA_PERMESSO', '13:00'],
      ['RIENTRO_PERMESSO', '14:00'],
    ]);
    const r = calcolaGiornata(g, imp, h('15:00'));
    expect(r.ripartizioni.map((x) => x.pausa)).toEqual([45, 15]);
    expect(r.permessoIntermedio).toBe(0 + 45);
  });

  it('propostaRientro simula il rientro prima di registrarlo', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
    ]);
    expect(propostaRientro(g, imp, h('14:30'))).toMatchObject({ pausa: 60, permesso: 90 });
    const mattina = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '10:00'],
    ]);
    expect(propostaRientro(mattina, imp, h('11:00'))).toBeNull();
  });

  it('fascia pranzo e pausa da scalare configurabili', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '14:30'],
    ]);
    const r = calcolaGiornata(g, impostazioni({ pranzo: { inizio: h('13:00'), fine: h('14:00') }, pausaDaScalare: 45 }), h('15:00'));
    expect(r.ripartizioni[0]).toMatchObject({ pausa: 45, permesso: 105 });
  });
});

describe('uscita anticipata', () => {
  it('prima della pausa: tutte le ore mancanti sono permesso', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA_ANTICIPATA', '11:30'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.lavorati).toBe(180);
    expect(r.permesso).toBe(300);
    expect(r.saldo).toBe(0);
  });

  it('con permesso a inizio giornata', () => {
    const g = giornata(
      [
        ['ENTRATA', '10:30'],
        ['USCITA_ANTICIPATA', '12:30'],
      ],
      { permessoInizio: 120 },
    );
    const r = calcolaGiornata(g, imp, null);
    expect(r.permesso).toBe(360);
    expect(r.saldo).toBe(0);
  });

  it('se le ore sono già coperte non genera permesso', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
      ['USCITA_ANTICIPATA', '18:00'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.permessoUscita).toBe(0);
    expect(r.saldo).toBe(30);
  });
});

describe('ore dovute per giorno della settimana', () => {
  it('sabato con 0 ore dovute: tutto straordinario', () => {
    const g = giornata(
      [
        ['ENTRATA', '09:00'],
        ['USCITA', '12:00'],
      ],
      { data: SABATO },
    );
    const r = calcolaGiornata(g, imp, null);
    expect(r.dovuti).toBe(0);
    expect(r.saldo).toBe(180);
  });

  it('venerdì corto (6h)', () => {
    const imp6 = impostazioni({ minutiDovuti: { predefinito: 480, perGiorno: [0, null, null, null, null, 360, 0] } });
    const g = giornata(
      [
        ['ENTRATA', '08:30'],
        ['INIZIO_PAUSA', '12:30'],
        ['FINE_PAUSA', '13:00'],
      ],
      { data: '2026-10-02' },
    );
    expect(uscita(calcolaGiornata(g, imp6, h('13:00')))).toBe('15:00');
  });
});

describe('eventi incoerenti', () => {
  it('fine pausa senza inizio pausa: da correggere, nessun crash', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['FINE_PAUSA', '13:30'],
      ['USCITA', '17:30'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.daCorreggere).toBe(true);
    expect(r.problemi[0]).toMatch(/Fine pausa alle 13:30 senza inizio pausa/);
    expect(r.lavorati).toBe(540); // calcolo comunque "migliore possibile"
  });

  it('doppia entrata', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['ENTRATA', '09:00'],
    ]);
    const r = calcolaGiornata(g, imp, h('10:00'));
    expect(r.daCorreggere).toBe(true);
    expect(r.problemi[0]).toMatch(/Entrata doppia/);
  });

  it('eventi dopo l\'uscita', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['USCITA', '17:30'],
      ['INIZIO_PAUSA', '18:00'],
    ]);
    expect(calcolaGiornata(g, imp, null).problemi[0]).toMatch(/dopo la fine della giornata/);
  });

  it('uscita durante la pausa (fine pausa dimenticata)', () => {
    const g = giornata([
      ['ENTRATA', '08:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['USCITA', '17:30'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.daCorreggere).toBe(true);
    expect(r.problemi.join(' ')).toMatch(/durante la pausa/);
  });

  it('giornata passata senza uscita', () => {
    const g = giornata([['ENTRATA', '08:30']]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.daCorreggere).toBe(true);
    expect(r.problemi).toContain('Manca la timbratura di uscita.');
  });

  it('dati corrotti (orari fuori scala, eventi nulli) non lanciano eccezioni', () => {
    const g = giornata([['ENTRATA', '08:30']]);
    g.eventi.push({ id: 'x', tipo: 'USCITA', minuti: 5000 });
    (g.eventi as unknown[]).push(null);
    g.permessoInizioMinuti = Number.NaN;
    expect(() => calcolaGiornata(g, imp, h('10:00'))).not.toThrow();
    expect(calcolaGiornata(g, imp, h('10:00')).daCorreggere).toBe(true);
  });

  it('eventi inseriti fuori ordine vengono ordinati per orario', () => {
    const g = giornata([
      ['FINE_PAUSA', '13:30'],
      ['ENTRATA', '08:30'],
      ['USCITA', '17:30'],
      ['INIZIO_PAUSA', '12:30'],
    ]);
    const r = calcolaGiornata(g, imp, null);
    expect(r.daCorreggere).toBe(false);
    expect(r.saldo).toBe(0);
  });
});

describe('giornata vuota', () => {
  it('nessun evento', () => {
    const r = calcolaGiornata(giornata([]), imp, h('09:00'));
    expect(r.stato).toBe('NON_INIZIATA');
    expect(r.coperti).toBe(0);
    expect(r.uscitaPrevista).toBeNull();
    expect(r.daCorreggere).toBe(false);
  });
});
