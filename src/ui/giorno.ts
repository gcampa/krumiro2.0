import { calcolaGiornata, propostaRientro } from '../core/calcolo';
import { nuovoId } from '../core/id';
import { analizzaGiornata, azioniDisponibili, ETICHETTE_AZIONE, type Azione } from '../core/statoGiornata';
import { formattaDataLunga, formattaDurata, formattaOra, formattaSaldo } from '../core/tempo';
import { ETICHETTE_EVENTO, type Evento, type RisultatoGiornata } from '../core/tipi';
import { store } from '../storage/store';
import { conferma, toast } from './dialoghi';
import { el } from './dom';
import { linkAiuto } from './aiuto';
import { confermaRipartizione, editorEvento, editorPermessoInizio } from './editor';

export interface Adesso {
  data: string;
  minuti: number;
}

/** Vista di una giornata: oggi con i pulsanti di timbratura, i giorni passati solo in modifica. */
export function vistaGiorno(data: string, adesso: Adesso, onIndietro: (() => void) | null): HTMLElement {
  const oggi = data === adesso.data;
  const giornata = store.giornata(data);
  const r = calcolaGiornata(giornata, store.impostazioni, oggi ? adesso.minuti : null);
  const analisi = analizzaGiornata(giornata);

  return el(
    'section',
    { class: 'vista vista-giorno' },
    el(
      'header',
      { class: 'intestazione' },
      onIndietro ? el('button', { type: 'button', class: 'link-indietro', onclick: onIndietro }, '‹ Storico') : null,
      el('h1', {}, oggi ? 'Oggi' : 'Giornata'),
      el('p', { class: 'sottotitolo' }, formattaDataLunga(data)),
    ),
    schedaRiepilogo(r, giornata.eventi, oggi, adesso.minuti),
    r.daCorreggere ? boxProblemi(r.problemi) : null,
    oggi ? pulsantiAzione(data, r, adesso.minuti) : null,
    timeline(data, giornata.eventi, giornata.permessoInizioMinuti, analisi.idScartati, r, oggi ? adesso.minuti : 9 * 60),
  );
}

function schedaRiepilogo(r: RisultatoGiornata, eventi: Evento[], oggi: boolean, adesso: number): HTMLElement {
  let etichetta: string;
  let valore: string;
  let nota: string | null = null;

  const ultimo = [...eventi].sort((a, b) => b.minuti - a.minuti)[0];
  if (r.uscitaPrevista !== null) {
    const passata = r.uscitaPrevista <= adesso;
    etichetta = passata ? 'Ore completate alle' : 'Uscita prevista';
    valore = formattaOra(r.uscitaPrevista);
    if (r.stato === 'IN_PAUSA') nota = 'se rientri ora (pausa minima inclusa)';
    else if (r.uscitaPrevistaConPausa) nota = `inclusa pausa pranzo di ${formattaDurata(store.impostazioni.pausaDaScalare)}`;
    else if (passata) nota = 'stai facendo straordinario';
  } else if (r.stato === 'CHIUSA') {
    etichetta = 'Saldo della giornata';
    valore = formattaSaldo(r.saldo);
    if (ultimo) nota = `uscita alle ${formattaOra(ultimo.minuti)}`;
  } else if (r.stato === 'IN_PERMESSO') {
    etichetta = 'In permesso dalle';
    valore = ultimo ? formattaOra(ultimo.minuti) : '—';
  } else if (r.stato === 'NON_INIZIATA') {
    etichetta = oggi ? 'Ore dovute oggi' : 'Ore dovute';
    valore = formattaDurata(r.dovuti);
  } else {
    etichetta = 'Giornata non chiusa';
    valore = '—';
  }

  const percentuale = r.dovuti > 0 ? Math.min(100, Math.round((r.coperti / r.dovuti) * 100)) : 100;
  return el(
    'div',
    { class: 'scheda scheda-principale' },
    el('p', { class: 'etichetta' }, etichetta),
    el('p', { class: `grande ${r.stato === 'CHIUSA' ? (r.saldo >= 0 ? 'positivo' : 'negativo') : ''}` }, valore),
    nota ? el('p', { class: 'nota' }, nota) : null,
    el('div', { class: 'barra', role: 'progressbar', 'aria-valuenow': percentuale, 'aria-valuemin': 0, 'aria-valuemax': 100 }, el('div', { class: 'barra-riempimento', style: `width:${percentuale}%` })),
    el(
      'dl',
      { class: 'statistiche' },
      stat('Coperte', `${formattaDurata(r.coperti)} / ${formattaDurata(r.dovuti)}`),
      statSaldo(r),
      stat('Lavorate', formattaDurata(r.lavorati)),
      stat('Permesso', formattaDurata(r.permesso)),
    ),
  );
}

/** Saldo a fine giornata; mentre è in corso mostra quanto manca. */
export function statSaldo(r: RisultatoGiornata): HTMLElement {
  if (r.stato !== 'CHIUSA' && !r.daCorreggere && r.saldo < 0) return stat('Mancano', formattaDurata(-r.saldo));
  return stat('Saldo', formattaSaldo(r.saldo), r.saldo > 0 ? 'positivo' : r.saldo < 0 ? 'negativo' : '');
}

function stat(nome: string, valore: string, classe = ''): HTMLElement {
  return el('div', { class: 'stat' }, el('dt', {}, nome), el('dd', { class: classe }, valore));
}

function boxProblemi(problemi: string[]): HTMLElement {
  return el(
    'div',
    { class: 'scheda avviso-problemi', role: 'alert' },
    el('p', { class: 'etichetta' }, '⚠︎ Giornata da correggere'),
    el('ul', {}, problemi.map((p) => el('li', {}, p))),
    el('p', { class: 'nota' }, 'Tocca una timbratura per modificarla o eliminarla.'),
    linkAiuto('Cosa significa?', 'da-correggere'),
  );
}

function pulsantiAzione(data: string, r: RisultatoGiornata, adesso: number): HTMLElement {
  const { primaria, secondarie } = azioniDisponibili(r.stato, r.pausaFatta);
  return el(
    'div',
    { class: 'azioni' },
    primaria
      ? el(
          'button',
          { type: 'button', class: `btn-principale azione-${primaria.toLowerCase()}`, onclick: () => void eseguiAzione(primaria, data) },
          el('span', { class: 'btn-principale-testo' }, ETICHETTE_AZIONE[primaria]),
          el('span', { class: 'btn-principale-ora' }, formattaOra(adesso)),
        )
      : null,
    secondarie.length > 0
      ? el(
          'div',
          { class: 'azioni-secondarie' },
          secondarie.map((a) =>
            el('button', { type: 'button', class: 'btn btn-secondario', onclick: () => void eseguiAzione(a, data) }, ETICHETTE_AZIONE[a]),
          ),
        )
      : null,
    primaria || secondarie.length > 0
      ? secondarie.includes('USCITA_PERMESSO') && secondarie.includes('USCITA_ANTICIPATA')
        ? linkAiuto('Esco in permesso o uscita anticipata?', 'permesso-vs-anticipata')
        : linkAiuto('Quale bottone uso?', 'i-bottoni')
      : null,
  );
}

/** Orario corrente letto al momento del tocco (non quello del rendering). */
let leggiAdesso: () => Adesso = () => ({ data: '', minuti: 0 });
export function impostaOrologio(f: () => Adesso): void {
  leggiAdesso = f;
}

async function eseguiAzione(azione: Azione, data: string): Promise<void> {
  const { minuti } = leggiAdesso();
  const aggiungi = (tipo: Evento['tipo'], pausaConfermata?: number) =>
    store.modificaGiornata(data, (g) => {
      const e: Evento = { id: nuovoId(), tipo, minuti };
      if (pausaConfermata !== undefined) e.pausaConfermata = pausaConfermata;
      g.eventi.push(e);
    });

  switch (azione) {
    case 'PERMESSO_INIZIO_GIORNATA':
      await editorPermessoInizio(data, store.giornata(data).eventi.length === 0 ? minuti : null);
      return;
    case 'RIENTRO_PERMESSO': {
      const proposta = propostaRientro(store.giornata(data), store.impostazioni, minuti);
      if (proposta && proposta.proposta > 0) {
        const pausa = await confermaRipartizione(proposta);
        if (pausa === null) return;
        aggiungi('RIENTRO_PERMESSO', pausa);
      } else aggiungi('RIENTRO_PERMESSO');
      break;
    }
    case 'USCITA_ANTICIPATA': {
      const g = store.giornata(data);
      const prova = calcolaGiornata(
        { ...g, eventi: [...g.eventi, { id: 'prova', tipo: 'USCITA_ANTICIPATA', minuti }] },
        store.impostazioni,
        minuti,
      );
      const ok = await conferma(
        'Uscita anticipata',
        `Esci alle ${formattaOra(minuti)}: ${formattaDurata(prova.permessoUscita)} di permesso per completare la giornata.`,
        'Conferma uscita',
      );
      if (!ok) return;
      aggiungi('USCITA_ANTICIPATA');
      break;
    }
    case 'NON_RIENTRO': {
      const ok = await conferma(
        'Non rientri?',
        'L\'uscita in permesso diventa un\'uscita anticipata: le ore mancanti saranno conteggiate come permesso.',
        'Chiudi la giornata',
      );
      if (!ok) return;
      store.modificaGiornata(data, (g) => {
        const ultima = [...g.eventi].sort((a, b) => b.minuti - a.minuti).find((e) => e.tipo === 'USCITA_PERMESSO');
        if (ultima) ultima.tipo = 'USCITA_ANTICIPATA';
      });
      break;
    }
    case 'RIAPRI': {
      const ok = await conferma('Riaprire la giornata?', 'L\'ultima uscita verrà eliminata.', 'Riapri', true);
      if (!ok) return;
      store.modificaGiornata(data, (g) => {
        const ultima = [...g.eventi]
          .sort((a, b) => b.minuti - a.minuti)
          .find((e) => e.tipo === 'USCITA' || e.tipo === 'USCITA_ANTICIPATA');
        if (ultima) g.eventi = g.eventi.filter((e) => e !== ultima);
      });
      return;
    }
    default:
      aggiungi(azione);
  }
  toast(`${ETICHETTE_AZIONE[azione]} alle ${formattaOra(minuti)}`);
}

function timeline(
  data: string,
  eventi: Evento[],
  permessoInizio: number,
  scartati: Set<string>,
  r: RisultatoGiornata,
  minutiProposti: number,
): HTMLElement {
  const ordinati = [...eventi].sort((a, b) => a.minuti - b.minuti);
  const voci: HTMLElement[] = [];
  if (permessoInizio > 0) {
    voci.push(
      el(
        'li',
        {},
        el(
          'button',
          { type: 'button', class: 'voce voce-permesso', onclick: () => void editorPermessoInizio(data, null) },
          el('span', { class: 'voce-ora' }, '—'),
          el('span', { class: 'voce-testo' }, 'Permesso a inizio giornata', el('small', {}, formattaDurata(permessoInizio))),
          el('span', { class: 'voce-freccia', 'aria-hidden': 'true' }, '›'),
        ),
      ),
    );
  }
  for (const e of ordinati) {
    const rip = r.ripartizioni.find((x) => x.eventoRientroId === e.id);
    const dettaglio = rip
      ? `${formattaDurata(rip.pausa)} pausa + ${formattaDurata(rip.permesso)} permesso${rip.confermata ? '' : ' (proposta)'}`
      : scartati.has(e.id)
        ? 'non coerente: da correggere'
        : null;
    voci.push(
      el(
        'li',
        {},
        el(
          'button',
          {
            type: 'button',
            class: `voce voce-${e.tipo.toLowerCase()} ${scartati.has(e.id) ? 'voce-errata' : ''}`,
            onclick: () => void editorEvento(data, e, e.minuti),
          },
          el('span', { class: 'voce-ora' }, formattaOra(e.minuti)),
          el('span', { class: 'voce-testo' }, ETICHETTE_EVENTO[e.tipo], dettaglio ? el('small', {}, dettaglio) : null),
          el('span', { class: 'voce-freccia', 'aria-hidden': 'true' }, '›'),
        ),
      ),
    );
  }
  return el(
    'div',
    { class: 'scheda' },
    el('h2', { class: 'titolo-sezione' }, 'Timbrature'),
    voci.length > 0 ? el('ol', { class: 'timeline' }, voci) : el('p', { class: 'vuoto' }, 'Nessuna timbratura.'),
    el(
      'div',
      { class: 'riga-pulsanti' },
      el('button', { type: 'button', class: 'btn btn-secondario', onclick: () => void editorEvento(data, null, minutiProposti) }, '+ Aggiungi timbratura'),
      permessoInizio === 0
        ? el('button', { type: 'button', class: 'btn btn-secondario', onclick: () => void editorPermessoInizio(data, null) }, '+ Permesso inizio giornata')
        : null,
    ),
  );
}
