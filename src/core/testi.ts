import { ETICHETTE_STATO } from './statoGiornata';
import type { RisultatoGiornata } from './tipi';

export function statoLeggibile(r: RisultatoGiornata): string {
  return r.daCorreggere ? 'Da correggere' : ETICHETTE_STATO[r.stato];
}
