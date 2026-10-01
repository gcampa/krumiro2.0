import { store } from '../storage/store';
import { filtraAiuto, SEZIONI_AIUTO, vociAiuto, type VoceAiuto } from './aiutoTesti';
import { el } from './dom';

export const EVENTO_APRI_AIUTO = 'apri-aiuto';

/** Apre la scheda Aiuto, eventualmente su una voce precisa (id) o una sezione. */
export function apriAiuto(destinazione?: string): void {
  window.dispatchEvent(new CustomEvent(EVENTO_APRI_AIUTO, { detail: destinazione }));
}

/** Link "?" contestuale da affiancare a un elemento dell'interfaccia. */
export function linkAiuto(testo: string, destinazione: string): HTMLElement {
  return el('button', { type: 'button', class: 'link-aiuto', onclick: () => apriAiuto(destinazione) }, el('span', { class: 'icona-aiuto', 'aria-hidden': 'true' }, '?'), testo);
}

let ricerca = '';

export function vistaAiuto(destinazione: string | null): HTMLElement {
  const voci = vociAiuto(store.impostazioni);
  const elenco = el('div', { class: 'elenco-aiuto' });

  const disegna = () => {
    const trovate = filtraAiuto(voci, ricerca);
    if (ricerca.trim()) {
      elenco.replaceChildren(
        trovate.length === 0
          ? el('p', { class: 'vuoto' }, 'Nessun risultato. Prova con altre parole, per esempio "permesso" o "pausa".')
          : el('div', { class: 'scheda' }, trovate.map((v) => voce(v, true))),
      );
      return;
    }
    elenco.replaceChildren(
      ...SEZIONI_AIUTO.map((s) =>
        el(
          'div',
          { class: 'scheda', id: `aiuto-sezione-${slug(s)}` },
          el('h2', { class: 'titolo-sezione' }, s),
          voci.filter((v) => v.sezione === s).map((v) => voce(v, v.id === destinazione)),
        ),
      ),
    );
  };

  const campo = el('input', {
    type: 'search',
    class: 'ricerca-aiuto',
    placeholder: 'Cerca: permesso, pausa, backup…',
    'aria-label': 'Cerca nell\'aiuto',
    value: ricerca,
    enterkeyhint: 'search',
  });
  campo.addEventListener('input', () => {
    ricerca = campo.value;
    disegna();
  });

  if (destinazione) ricerca = '';
  campo.value = ricerca;
  disegna();

  if (destinazione) {
    // Dopo il montaggio: porta in vista la voce (o la sezione) richiesta.
    requestAnimationFrame(() => {
      const bersaglio = document.getElementById(`aiuto-${destinazione}`) ?? document.getElementById(`aiuto-sezione-${slug(destinazione)}`);
      bersaglio?.scrollIntoView({ block: 'start' });
    });
  }

  return el(
    'section',
    { class: 'vista' },
    el('header', { class: 'intestazione' }, el('h1', {}, 'Aiuto'), el('p', { class: 'sottotitolo' }, 'Risposte ai dubbi più comuni')),
    campo,
    elenco,
  );
}

function voce(v: VoceAiuto, aperta: boolean): HTMLElement {
  const corpo: HTMLElement[] = [];
  let lista: HTMLUListElement | null = null;
  for (const riga of v.testo) {
    if (riga.startsWith('• ')) {
      if (!lista) {
        lista = el('ul', {});
        corpo.push(lista);
      }
      lista.append(el('li', {}, riga.slice(2)));
    } else {
      lista = null;
      corpo.push(el('p', {}, riga));
    }
  }
  return el(
    'details',
    { class: 'voce-aiuto', id: `aiuto-${v.id}`, open: aperta },
    el('summary', {}, v.domanda),
    el('div', { class: 'risposta' }, corpo),
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}
