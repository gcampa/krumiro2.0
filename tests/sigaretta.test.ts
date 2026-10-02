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
