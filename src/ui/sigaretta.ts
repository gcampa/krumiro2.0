import { anteprimaSigaretta } from '../core/calcolo';
import { nuovoId } from '../core/id';
import {
  BLOCCO_PERMESSO_SIGARETTA,
  countdown,
  esitoRientroSigaretta,
  istanteDaMinuti,
  sigarettaDaRiprendere,
  testoTimer,
} from '../core/sigaretta';
import { adessoRoma, formattaDataLunga, formattaDurata, formattaOra } from '../core/tempo';
import type { Evento } from '../core/tipi';
import { store } from '../storage/store';
import { avviso, conferma, toast } from './dialoghi';
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
  const uscita: Evento = { id: nuovoId(), tipo: 'USCITA_PERMESSO', minuti, sigaretta: true };
  salvaInizio({ data, eventoId: uscita.id, inizio: Date.now() });
  store.modificaGiornata(data, (g) => void g.eventi.push({ ...uscita }));
  if (!aperta) apriSchermata(data, uscita);
}

/** Riapre la schermata se nella giornata c'è una pausa sigaretta in corso (e non è già aperta). */
export function riprendiPausaSigaretta(data: string): void {
  if (aperta) return;
  const uscita = sigarettaDaRiprendere(store.giornata(data));
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
  /** Il giorno è cambiato a pausa aperta: non si scrive nulla, la giornata va corretta dallo Storico. */
  const giornoCambiato = (): boolean => {
    if (chiusaDaNoi) return true;
    if (adessoRoma().data === data) return false;
    termina();
    cancellaInizio();
    void avviso(
      'Pausa sigaretta non chiusa',
      `Il rientro di ${formattaDataLunga(data)} non è stato registrato: correggi la giornata dallo Storico.`,
    );
    return true;
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
            if (giornoCambiato()) return;
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
            if (giornoCambiato()) return;
            const ok = await conferma(
              'Annullare la pausa?',
              'L\'uscita per la pausa sigaretta verrà eliminata, come se non l\'avessi registrata.',
              'Annulla pausa',
              true,
            );
            if (!ok || giornoCambiato()) return;
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
    if (giornoCambiato()) return;
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
