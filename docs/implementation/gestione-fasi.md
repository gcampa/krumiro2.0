# Gestione delle fasi — krumiro2.0 + integrazione outatime

Metodo adottato il 2026-10-03 (skill `metodo-fasi`). Questo file prevale sui modelli generici della skill; ogni
modifica è un cambio di processo deciso in plenaria e registrato in [progress.md](progress.md).

Il lavoro attraversa due repository: `gcampa/krumiro2.0` (questa documentazione, PWA) e
`gcampa/outatime` (estensione). Documentazione, roadmap e progress sono **unici, qui** (D16).

## Ruoli e modelli
| Ruolo | Modello · effort | Sessioni | Non fa mai |
|---|---|---|---|
| Plenaria (utente + Claude) | Opus 5.5 · high o superiore | F0/adozione, pianificazione di fase, dubbi, checkpoint | implementare task |
| Esecutore | Sonnet 5 · **solo medium** (D24) | apertura, task, continuazione | decidere, anticipare, ampliare |
| Revisore | Opus 5.5 · high o superiore + utente | checkpoint 🛑, chiusura di fase | aggiungere funzioni |

## Fasi del progetto (ordine approvato il 2026-10-03, D20)
| Fase | Obiettivo | Criterio di uscita (dall'interfaccia) | File | Checkpoint 🛑 |
|---|---|---|---|---|
| — | Funzioni esistenti fino a 1.5.0 | chiusa prima dell'adozione (D5) | `docs/superpowers/` | — |
| F0 | Pianificazione | documenti approvati, domande di F2 chiuse | — | R-F0 |
| F2 | Gestione oraria di outatime (Presenza, FILM, Smart working) | i 17 casi di outatime v0.2.3 danno dal browser la stessa "Ora di levarsi"; app su `gcampa.github.io/krumiro2.0` | [F2-gestione-oraria.md](F2-gestione-oraria.md) | R1 dopo T2.12 · chiusura |
| F3 | Pausa caffè (cronometro sigaretta o birra) | Profilo → Birra: "🍺 Pausa birra" apre il boccale con timer 15:00; "Fine pausa" mostra la durata, ore e saldo invariati | [F3-pausa-caffe.md](F3-pausa-caffe.md) | da fissare nel P · chiusura |
| F4 | Inserimento manuale dal portale | timbrature del cartellino scritte a mano → giornata aggiornata, annotazioni manuali conservate, Annulla | `F4-inserimento-portale.md` | da fissare nel P · chiusura |
| F5 | outatime con QR (da v0.2.3) | cartellino aperto → QR visibile; nessuna richiesta di rete esterna | `F5-outatime-qr.md` | da fissare nel P · chiusura |
| F6 | krumiro2.0 legge il QR | QR inquadrato → giornate aggiornate; QR estraneo rifiutato | `F6-leggi-qr.md` | da fissare nel P · chiusura |
| F7 | Consolidamento | revisione di sicurezza S1–S17 superata, Aiuto e README aggiornati, E2E di F2–F6 | `F7-consolidamento.md` | chiusura |

F1 (design) non è prevista (D26).

Stato corrente: vedi [roadmap.md](roadmap.md) e [progress.md](progress.md).

## Ciclo di una fase
1. **P — pianificazione** (plenaria): "Allineamento al codice" nel file di fase, task riscritti senza scelte aperte,
   `f<n>-sessioni.md`, roadmap.
2. **S1 — apertura** (esecutore, medium): prompt S1 di `f<n>-sessioni.md`; branch (creato in S1 se il P è stato
   fatto fuori da `main`, come per F2), baseline, incoerenze, PR in bozza **in ogni repository toccato dalla fase**.
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
- rubadab: hook dal modello [rubadab-settings.example.json](rubadab-settings.example.json) in `.claude/settings.json` sulla macchina dove gira il servizio (D25);
  `Applied lessons:` a ogni task.
- Dati locali e credenziali: localStorage del browser di prova e chiavi del QR li prepara e gestisce l'utente.

## Git
| Momento | Azione |
|---|---|
| Pianificazione P | `git switch -c feature/f<n>-<nome>` da `main` aggiornato (in entrambi i repository se la fase tocca outatime), commit `docs: piano F<n> …` |
| Task · fix · revisione · chiusura | `F<n>/T<n>.<xx>: …` · `F<n>/fix: …` · `F<n>/revisione: …` · `F<n>/chiusura: …` |
| Documenti fuori fase | branch `docs/<yyyyMMdd>-<argomento>`, commit `docs: …`, PR |
| Merge | solo l'utente, `--no-ff`, dopo R-finale |

Nessuno scrive su `main`, plenaria compresa. Eccezione registrata: F0 e il piano di F2 del 2026-10-03 sono sul
branch di sessione `claude/blissful-knuth-dlbnlw` imposto dall'ambiente cloud, invece di
`docs/20261003-pianificazione`; per questo `feature/f2-gestione-oraria` si crea in S1 da `main` dopo il merge di F0.

## PR di fase
Bozza in S1 (una per repository toccato), aggiornata a ogni checkpoint, pronta in Sc. Sezioni: Obiettivo · Stato ·
Correzioni dalle revisioni · Verifiche automatiche · **Test da eseguire** (checkbox) · Rischi e punti aperti.

## Mappa dei file
| File | Scopo |
|---|---|
| [README.md](README.md) | istruzioni per l'esecutore, regole B/W, comandi, DoD |
| [prompts.md](prompts.md) | prompt del progetto |
| [rubadab-settings.example.json](rubadab-settings.example.json) | modello degli hook rubadab (D25) |
| [roadmap.md](roadmap.md) | fasi e stato |
| [progress.md](progress.md) | avanzamento, Dubbi, Blocchi |
| `F<n>-<nome>.md` | task per fase |
| `f<n>-sessioni.md` | sessioni della fase in corso (temporaneo) |
| [decisions.md](../architecture/decisions.md) | registro decisioni |
| [integrazione-outatime.md](../architecture/integrazione-outatime.md) | architettura e contratto dati |
| [sicurezza.md](../architecture/sicurezza.md) | controlli S1–S17 |
| [outatime-unione-main.md](outatime-unione-main.md) | unione dei rami di outatime in `main` (fuori fase, D22) |
| [regole-outatime.md](../architecture/regole-outatime.md) | gestione oraria di outatime, formula unica, confronto |
