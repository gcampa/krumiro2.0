# Gestione delle fasi — krumiro2.0 + integrazione outatime

Metodo adottato il 2026-10-03 (skill `metodo-fasi`). Questo file prevale sui modelli generici della skill; ogni
modifica è un cambio di processo deciso in plenaria e registrato in [progress.md](progress.md).

Il lavoro attraversa due repository: `gcampa/krumiro2.0` (questa documentazione, PWA) e
`gcampa/outatime` (estensione). Documentazione, roadmap e progress sono **unici, qui** (D16, da confermare: Q2).

## Ruoli e modelli
| Ruolo | Modello · effort | Sessioni | Non fa mai |
|---|---|---|---|
| Plenaria (utente + Claude) | Opus 5.5 · high o superiore | F0/adozione, pianificazione di fase, dubbi, checkpoint | implementare task |
| Esecutore | Sonnet 5 · medium/high (proposta, Q14); Haiku 4.5 solo per task `meccanico` | apertura, task, continuazione | decidere, anticipare, ampliare |
| Revisore | Opus 5.5 · high o superiore + utente | checkpoint 🛑, chiusura di fase | aggiungere funzioni |

## Fasi del progetto (ordine approvato il 2026-10-03, D20)
| Fase | Obiettivo | Criterio di uscita (dall'interfaccia) | File | Checkpoint 🛑 |
|---|---|---|---|---|
| — | Funzioni esistenti fino a 1.5.0 | chiusa prima dell'adozione (D5) | `docs/superpowers/` | — |
| F0 | Pianificazione | documenti approvati, domande di F2 chiuse | — | R-F0 |
| F2 | Timbratura manuale con le regole di outatime | Entrata 08:45, pausa 13:00–13:40 → "Ora di levarsi" 17:45; app su `gcampa.github.io/krumiro2.0` | `F2-regole-outatime.md` | da fissare nel P · chiusura |
| F3 | Inserimento manuale dal portale | timbrature del cartellino scritte a mano → giornata aggiornata, annotazioni manuali conservate, Annulla | `F3-inserimento-portale.md` | da fissare nel P · chiusura |
| F4 | outatime 1.0 con QR | cartellino aperto → QR visibile; nessuna richiesta di rete esterna | `F4-outatime-qr.md` | da fissare nel P · chiusura |
| F5 | krumiro2.0 legge il QR | QR inquadrato → giornate aggiornate; QR estraneo rifiutato | `F5-leggi-qr.md` | da fissare nel P · chiusura |
| F6 | Consolidamento | revisione di sicurezza S1–S17 superata, Aiuto e README aggiornati, E2E di F2–F5 | `F6-consolidamento.md` | chiusura |

F1 (design) non è prevista: deroga proposta in Q11.

Stato corrente: vedi [roadmap.md](roadmap.md) e [progress.md](progress.md).

## Ciclo di una fase
1. **P — pianificazione** (plenaria): "Allineamento al codice" nel file di fase, task riscritti senza scelte aperte,
   `f<n>-sessioni.md`, roadmap.
2. **S1 — apertura** (esecutore, medium): prompt 1 di `prompts.md` (da scrivere a fine F0); branch, baseline,
   incoerenze, PR in bozza **in ogni repository toccato dalla fase**.
3. **Task** (esecutore): prompt 2, 3 o 5; un commit per task; progress.md a ogni task.
4. **🛑 Checkpoint R<k>**: l'agente si ferma, elenca la checklist, aspetta "R<k> superata". Fix con test
   (`F<n>/fix`), esito in progress, PR e roadmap.
5. **Sc — chiusura** (revisore, Opus): prompt 4; suite senza nuovi warning, revisione del diff e fix, E2E dal
   frontend su dati puliti sul codice finale, "Uscita da F<n>: raggiunta", PR pronte con "Test da eseguire".
6. **🛑 R-finale** (utente): esegue i test a checkbox delle PR, poi merge in `main` di ogni repository. Solo dopo si
   apre F<n+1>.

## Regole di processo
- Checkpoint solo su gruppi provabili dall'interfaccia (PWA nel browser, pagina del cartellino con outatime);
  massimo 4 task per sessione; sessione nuova per ogni prompt.
- Dubbi: l'esecutore li scrive in progress.md → "Dubbi per la plenaria" e si ferma; la plenaria li risolve e
  registra l'esito (decisions.md, file di fase o README).
- **Sicurezza**: ogni task che tocca cifratura, QR, permessi dell'estensione o dati importati cita i controlli S<n> di
  [sicurezza.md](../architecture/sicurezza.md) che implementa; la chiusura di fase verifica quei controlli.
- **Dati reali**: mai nel repository; l'HTML del portale si usa solo in forma sintetica (S15).
- rubadab: hook in `.claude/settings.json` (progetto `krumiro2.0`) da aggiungere dove il servizio gira (Q13);
  `Applied lessons:` a ogni task.
- Dati locali e credenziali: localStorage del browser di prova e chiavi del QR li prepara e gestisce l'utente.

## Git
| Momento | Azione |
|---|---|
| Pianificazione P | `git switch -c feature/f<n>-<nome>` da `main` aggiornato (in entrambi i repository se la fase tocca outatime), commit `docs: piano F<n> …` |
| Task · fix · revisione · chiusura | `F<n>/T<n>.<xx>: …` · `F<n>/fix: …` · `F<n>/revisione: …` · `F<n>/chiusura: …` |
| Documenti fuori fase | branch `docs/<yyyyMMdd>-<argomento>`, commit `docs: …`, PR |
| Merge | solo l'utente, `--no-ff`, dopo R-finale |

Nessuno scrive su `main`, plenaria compresa. Eccezione registrata: la bozza F0 del 2026-10-03 è sul branch di
sessione `claude/blissful-knuth-dlbnlw` imposto dall'ambiente cloud, invece di `docs/20261003-pianificazione`.

## PR di fase
Bozza in S1 (una per repository toccato), aggiornata a ogni checkpoint, pronta in Sc. Sezioni: Obiettivo · Stato ·
Correzioni dalle revisioni · Verifiche automatiche · **Test da eseguire** (checkbox) · Rischi e punti aperti.

## Mappa dei file
| File | Scopo |
|---|---|
| `README.md` (da scrivere a fine F0) | istruzioni per l'esecutore, regole B/W/S, comandi, DoD |
| `prompts.md` (da scrivere a fine F0) | prompt delle sessioni |
| [roadmap.md](roadmap.md) | fasi e stato |
| [progress.md](progress.md) | avanzamento, Dubbi, Blocchi |
| `F<n>-<nome>.md` | task per fase |
| `f<n>-sessioni.md` | sessioni della fase in corso (temporaneo) |
| [decisions.md](../architecture/decisions.md) | registro decisioni |
| [integrazione-outatime.md](../architecture/integrazione-outatime.md) | architettura e contratto dati |
| [sicurezza.md](../architecture/sicurezza.md) | controlli S1–S17 |
| [regole-outatime.md](../architecture/regole-outatime.md) | regole di calcolo di outatime e confronto |
