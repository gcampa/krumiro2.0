import { describe, expect, it } from 'vitest';
import { IMPOSTAZIONI_PREDEFINITE } from '../src/core/tipi';
import { ErroreMigrazione, migra, VERSIONE_CORRENTE } from '../src/storage/migrazioni';

describe('migrazioni', () => {
  it('dati senza version (v0) vengono portati alla versione corrente', () => {
    const d = migra({
      giornate: { '2026-10-01': { permessoInizioMinuti: 60, eventi: [{ tipo: 'ENTRATA', minuti: 600 }] } },
    });
    expect(d.version).toBe(VERSIONE_CORRENTE);
    expect(d.impostazioni).toEqual(IMPOSTAZIONI_PREDEFINITE);
    expect(d.giornate['2026-10-01']!.data).toBe('2026-10-01');
    expect(d.giornate['2026-10-01']!.eventi[0]!.id).toBeTruthy();
  });

  it('scarta valori non validi senza perdere il resto', () => {
    const d = migra({
      version: 1,
      impostazioni: { pausaDaScalare: -5, pranzo: { inizio: 800, fine: 700 }, pausaMinima: 20 },
      giornate: {
        '2026-10-01': { data: '2026-10-01', permessoInizioMinuti: 0, eventi: [{ id: 'a', tipo: 'BOH', minuti: 1 }, { id: 'b', tipo: 'USCITA', minuti: 1050 }] },
        'non-una-data': { eventi: [] },
      },
    });
    expect(d.impostazioni.pausaDaScalare).toBe(60);
    expect(d.impostazioni.pranzo).toEqual({ inizio: 720, fine: 870 });
    expect(d.impostazioni.pausaMinima).toBe(20);
    expect(d.giornate['2026-10-01']!.eventi).toEqual([{ id: 'b', tipo: 'USCITA', minuti: 1050 }]);
    expect(Object.keys(d.giornate)).toEqual(['2026-10-01']);
  });

  it('rifiuta dati di una versione futura o non oggetti', () => {
    expect(() => migra({ version: 99 })).toThrow(ErroreMigrazione);
    expect(() => migra('ciao')).toThrow(ErroreMigrazione);
  });

  it('le impostazioni predefinite non vengono mutate', () => {
    const d = migra({});
    d.impostazioni.minutiDovuti.perGiorno[1] = 100;
    expect(IMPOSTAZIONI_PREDEFINITE.minutiDovuti.perGiorno[1]).toBeNull();
  });
});
