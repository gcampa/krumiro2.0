import { describe, expect, it } from 'vitest';
import { esportaCsv, importaCsv, parseCsv, ErroreImportazione } from '../src/core/csv';
import { riepilogoMese } from '../src/core/riepilogo';
import { giornata, h, impostazioni } from './helpers';

const imp = impostazioni();
const oggi = { data: '2026-10-05', minuti: h('10:00') };

function dati() {
  const a = giornata(
    [
      ['ENTRATA', '10:30'],
      ['INIZIO_PAUSA', '12:30'],
      ['FINE_PAUSA', '13:30'],
      ['USCITA', '17:45'],
    ],
    { permessoInizio: 120, data: '2026-10-01' },
  );
  const b = giornata(
    [
      ['ENTRATA', '08:30'],
      ['USCITA_PERMESSO', '12:00'],
      ['RIENTRO_PERMESSO', '14:30', 45],
      ['USCITA', '17:30'],
    ],
    { data: '2026-10-02' },
  );
  return { [a.data]: a, [b.data]: b };
}

describe('CSV', () => {
  it('esporta con separatore ; e decimali con virgola', () => {
    const csv = esportaCsv(dati(), imp, oggi);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const righe = csv.slice(1).trimEnd().split('\r\n');
    expect(righe[0]).toBe(
      'Data;Giorno;Ore dovute;Ore lavorate;Ore permesso;Saldo;Stato;Permesso inizio giornata (min);Eventi',
    );
    expect(righe[1]).toBe(
      '2026-10-01;Giovedì;8,00;6,25;2,00;0,25;Giornata chiusa;120;10:30 Entrata, 12:30 Inizio pausa, 13:30 Fine pausa, 17:45 Uscita',
    );
    expect(righe[2]).toContain('14:30 Rientro da permesso (pausa 45)');
  });

  it('round trip esporta → importa', () => {
    const originali = dati();
    const importati = importaCsv(esportaCsv(originali, imp, oggi));
    expect(Object.keys(importati).sort()).toEqual(Object.keys(originali).sort());
    for (const [data, g] of Object.entries(originali)) {
      const i = importati[data]!;
      expect(i.permessoInizioMinuti).toBe(g.permessoInizioMinuti);
      expect(i.eventi.map(({ tipo, minuti, pausaConfermata }) => ({ tipo, minuti, pausaConfermata }))).toEqual(
        g.eventi.map(({ tipo, minuti, pausaConfermata }) => ({ tipo, minuti, pausaConfermata })),
      );
    }
  });

  it('parser con campi tra virgolette', () => {
    expect(parseCsv('a;"b;c";"d ""e"""\r\n1;2;3\n')).toEqual([
      ['a', 'b;c', 'd "e"'],
      ['1', '2', '3'],
    ]);
  });

  it('errori di import chiari', () => {
    expect(() => importaCsv('foo;bar\n1;2')).toThrow(ErroreImportazione);
    expect(() => importaCsv('Data;Eventi\n2026-13-01;08:30 Entrata')).toThrow(/data/);
    expect(() => importaCsv('Data;Eventi\n2026-10-01;08:30 Ballo')).toThrow(/non riconosciuto/);
  });
});

describe('riepilogo mensile', () => {
  it('somma lavorate, permessi e saldo del mese', () => {
    const r = riepilogoMese(dati(), imp, '2026-10', oggi);
    expect(r.giorni.map((g) => g.data)).toEqual(['2026-10-02', '2026-10-01']);
    expect(r.permesso).toBe(120 + 105);
    expect(r.saldo).toBe(15 + 15);
    expect(r.giorniDaCorreggere).toBe(0);
  });

  it('la giornata in corso non entra nel saldo del mese', () => {
    const d = dati();
    d['2026-10-05'] = giornata([['ENTRATA', '08:30']], { data: '2026-10-05' });
    const r = riepilogoMese(d, imp, '2026-10', oggi);
    expect(r.saldo).toBe(30);
    expect(r.giorni).toHaveLength(3);
  });
});
