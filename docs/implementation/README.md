# Piano di implementazione — istruzioni per l'esecutore

Destinatario: **Claude Sonnet 5, effort medium** (D24: tutto il progetto è `solo medium`), una sessione per
prompt. Il piano applica le decisioni di [decisions.md](../architecture/decisions.md) e non ne introduce: ogni
scelta non scritta è un Dubbio per la plenaria. Metodo: [gestione-fasi.md](gestione-fasi.md).

## Come lavorare
0. Controlla la riga `Modello: … · effort: …` in testa al prompt: se il modello in uso è diverso, fermati e dillo.
1. Leggi questo README, [progress.md](progress.md), il file di fase e **solo** le sezioni citate dal task. Non
   esplorare oltre.
2. Prendi il **primo task non spuntato**. Esegui i passi in ordine. Non anticipare, non aggiungere.
3. Sei su un branch `feature/f<n>-<nome>`; se sei su `main`, fermati.
4. Esegui la Verifica e riporta l'**output reale**. Verifica nell'interfaccia = browser reale (claude-in-chrome);
   build o chiamate HTTP non valgono. Browser non disponibile → "verifica UI da fare a mano" in progress.md, non
   dichiararla eseguita.
5. Ogni bug corretto riceve un test che lo riproduce.
6. Spunta in progress.md: data, nota di una riga (conteggi test), riga `Applied lessons: [<id>, …]` o
   `Applied lessons: none (rubadab non disponibile)` finché gli hook non sono attivi (D25).
7. Un commit per task: `F<n>/T<n>.<xx>: <descrizione breve>`, con le righe di attribuzione richieste dall'ambiente.
8. Blocco esterno (rete, pacchetto, SDK) → sezione **Blocchi** di progress.md con la casella `- [ ]` e la fase o il
   task come secondo campo, fermati.
9. Contraddizione tra piano, documenti e codice, o qualunque scelta non scritta → sezione **Dubbi per la
   plenaria** di progress.md, fermati. Non scegliere tu.
10. Non cancellare né sovrascrivere dati locali (localStorage del browser di prova, backup); non inserire
    password; non committare i file locali elencati sotto.

## Ambiente
| | |
|---|---|
| OS / shell | Linux o macOS, bash |
| Runtime | Node.js 22 (verificato 22.22.0); npm 10+ |
| Repository | `gcampa/krumiro2.0` (PWA); `gcampa/outatime` solo dalle fasi che lo citano |
| Strumenti assenti | nessun database; i dati sono nel `localStorage` del browser (chiave `timbrature`) |
| Browser | Chrome + claude-in-chrome per le verifiche UI, su `http://localhost:5173/krumiro2.0/` (`npm run dev`) |
| File locali da non committare | `node_modules/`, `dist/`, `*.local`, `.mcp.json` |
| File scritti dagli strumenti | `npm run build` scrive `dist/` (ignorato da git) |

## Flusso git
| Momento | Azione |
|---|---|
| Pianificazione P | `git switch -c feature/f<n>-<nome>` da `main` aggiornato, commit `docs: piano F<n> …` |
| Apertura (S1) | sul branch già creato: baseline, push dell'utente, PR in bozza |
| Task | `F<n>/T<n>.<xx>: …` |
| Correzione fuori task | `F<n>/fix: …` |
| Revisione | `F<n>/revisione: …` |
| Chiusura | `F<n>/chiusura: …` |
| Merge | solo l'utente, "Create a merge commit", dopo R-finale |

Nessuno lavora su `main`.

## Fasi
| File | Contenuto |
|---|---|
| [F2-gestione-oraria.md](F2-gestione-oraria.md) | gestione oraria di outatime in krumiro2.0 (17 task) |
| `F3-inserimento-portale.md` | da scrivere nel P di F3 |
| `F4-outatime-qr.md`, `F5-leggi-qr.md`, `F6-consolidamento.md` | da scrivere nei rispettivi P |

## Documenti di riferimento
| Documento | Per cosa |
|---|---|
| [regole-outatime.md](../architecture/regole-outatime.md) | configurazioni, formula, i 17 casi di riferimento |
| [decisions.md](../architecture/decisions.md) | D21 (configurazioni), D23 (dettagli di calcolo), D24 (effort) |
| [integrazione-outatime.md](../architecture/integrazione-outatime.md) | contratto dati e QR (F3–F5) |
| [sicurezza.md](../architecture/sicurezza.md) | controlli S1–S17 (F4–F6) |

## Versioni
| Pacchetto | Versione installata | Progetto |
|---|---|---|
| typescript | 5.9.3 | krumiro2.0 |
| vite | 8.3.2 | krumiro2.0 |
| vite-plugin-pwa | 1.3.0 | krumiro2.0 |
| vitest | 5.0.3 | krumiro2.0 |
| @types/node | 22.20.4 | krumiro2.0 |

Nessuna dipendenza nuova in F2 (B6). `npm ci` usa `package-lock.json`: non aggiornare pacchetti nei task.

## Regole del codice (B)
- **B1 — Lingua**: testi dell'interfaccia, nomi, commenti in italiano (D3).
- **B2 — Logica pura in `src/core/`**: niente DOM, niente `store`, niente `Date` per i calcoli (minuti dalla
  mezzanotte, interi); l'interfaccia chiama `src/core/`.
- **B3 — Minuti interi**: ogni orario è `number` di minuti 0–1439 (1440 solo come fine fascia); formattazione con
  `formattaOra` / `formattaDurata` di `src/core/tempo.ts`.
- **B4 — Schema dei dati**: ogni cambio di forma passa da `MIGRAZIONI` e `normalizza*` in
  `src/storage/migrazioni.ts`; mai leggere dati salvati senza normalizzarli.
- **B5 — Test storici**: i test esistenti non cambiano i valori attesi; se un task li rompe, è un Dubbio (salvo le
  modifiche di chiamata scritte nel task).
- **B6 — Nessuna dipendenza nuova** senza decisione in decisions.md.
- **B7 — Test per ogni regola nuova** in `tests/*.test.ts` (Vitest), con i dati del task.
- **B8 — Log**: niente `console.log` di dati dell'utente.

## Regole dell'interfaccia (W)
- **W1 — Helper `el()`** di `src/ui/dom.ts`; niente `innerHTML` con dati.
- **W2 — Controlli esistenti**: orari con `selettoreOra`/`inputHHMM`, minuti con `inputMinuti`, righe con `riga()`
  in `src/ui/impostazioni.ts`; toast con `toast()` e conferme con `conferma()` di `src/ui/dialoghi.ts`.
- **W3 — Stile**: solo variabili CSS già definite in `:root` (tema chiaro e scuro); classi nuove in coda a
  `src/style.css`.
- **W4 — Salvataggio**: ogni modifica delle impostazioni con `store.modificaImpostazioni(...)` seguita da
  `salvato()`; delle giornate con `store.modificaGiornata(...)`.
- **W5 — Verifica UI nel browser reale**: azioni con clic veri; con dati che dipendono dal giorno, usare un giorno
  feriale o impostare le ore dovute del giorno come scritto nella Verifica.
- **W6 — E2E di fase dal frontend** su dati puliti (localStorage vuoto, preparato dall'utente con un backup prima).

## Comandi
| Scopo | Comando (dalla radice) |
|---|---|
| Dipendenze | `npm ci` |
| Test | `npm test` |
| Un file di test | `npx vitest run tests/<file>.test.ts` |
| Tipi | `npm run typecheck` |
| Build | `npm run build` |
| App in sviluppo | `npm run dev` → `http://localhost:5173/krumiro2.0/` |
| Pacchetti vulnerabili | `npm audit --omit=dev` |

## Configurazione locale
Nessun `.env`: l'app non ha segreti né porte configurabili (Vite usa 5173; se occupata, Vite sceglie la
successiva e lo scrive a terminale: usare quella). I dati di prova stanno nel localStorage del browser: prima di
una E2E l'utente esporta il backup JSON e svuota i dati del sito; dopo, reimporta il backup.

## Definition of Done di ogni task
Passi eseguiti nei percorsi indicati · `npm run typecheck` e `npm run build` senza errori · test nuovi scritti e
tutti verdi · Verifica eseguita (UI nel browser) · nessun dato reale nel codice · progress.md aggiornato · commit ·
`git status --short` vuoto dopo il commit, oppure i file rimasti elencati nella nota del task con il motivo.

## Definition of Done di una fase
Tutti i task spuntati, ciascuno con il suo Effort, nessuna verifica UI aperta, nessun Dubbio aperto · suite verdi
senza nuovi warning rispetto alla baseline · E2E dal frontend su dati puliti verde · revisione del diff (Opus) ·
"Uscita da F<n>: raggiunta" · roadmap aggiornata · PR con test a checkbox tutti spuntati dall'utente · merge in
`main` fatto dall'utente.
