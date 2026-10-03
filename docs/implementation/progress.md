# Avanzamento

Spuntare `[x]` a fine task con data e nota breve: `- [x] T2.01 … — 2026-01-15, ok (…conteggi test…)`.
Sotto ogni task la riga `Applied lessons: [<id>, …]` oppure `Applied lessons: none`.

Cambio di processo — 2026-10-03: nuova F3 "Pausa birra" (D29); le fasi successive sono rinumerate F4–F7 (D30). Le
righe storiche qui sotto citano i numeri di allora (F3 inserimento … F6 consolidamento).

Cambio di processo — 2026-10-03: nessuna F1 (D26); effort degli esecutori solo medium (D24); prompt di S1 crea il
branch della fase perché il piano è fuori da `main` (gestione-fasi.md § Ciclo).

Cambio di processo — 2026-10-03: adozione del metodo a fasi (skill `metodo-fasi`) per l'integrazione outatime;
recepito in [gestione-fasi.md](gestione-fasi.md). Lavoro fino a 1.5.0 registrato come fase chiusa prima
dell'adozione (D5).

## Dubbi per la plenaria
<!-- - [ ] <data> · <F<n> | T<n>.<xx> | F<n> apertura> · <domanda> · opzioni: A) … B) … · file: … -->
Le domande di F0 sono in [../README.md § Domande aperte](../README.md#domande-aperte) (Q1–Q15).

## Blocchi
- [ ] 2026-10-03 · F0 · rubadab non disponibile nella sessione cloud (nessun tool `rubadab_*`, servizio
  `localhost:8899` assente) · serve: decisione Q13 e hook installati dove gira il servizio

## F0 — Pianificazione
**Inventario (2026-10-03)**: krumiro2.0 `main` @ `1440056`, versione 1.5.0, 8 file di test, 92/92 verdi, build ok,
precache 16 voci (98.96 KiB), Node 22.22.0. outatime @ `f655344`, versione 0.1, nessun test né build.
- [x] Inventario dei due repository — 2026-10-03
- [x] Bozza architettura, sicurezza, decisioni proposte, roadmap — 2026-10-03
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03: chiuse Q1, Q3, Q4, Q5, Q6, Q8 → D6, D15 approvate; D17, D18 nuove; D10 scartata;
  D8 sospesa; F5 tolta dalla roadmap
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (2): Q16 → opzione B, QR offline (D19), D8 scartata, D12–D13 decadute, Q9–Q10 decadute;
  ordine delle fasi F2 regole outatime → F3 inserimento manuale → F4 QR → F5 lettura → F6 (D20); confronto
  misurato delle regole in `regole-outatime.md`; architettura e sicurezza riscritte per il QR
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (3): l'utente chiede orari configurabili, configurazione FILM e la gestione oraria di
  outatime in krumiro2.0. Scoperto che la versione in uso di outatime è v0.2.3 (`firefox-support`), non `main` 0.1:
  `regole-outatime.md` rifatto; formula unica verificata sui 17 casi di test di outatime (krumiro2.0 oggi ne
  sbaglia 8); D21 proposta; D11 superata; Q18–Q22 superate da Q24–Q29
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (4): valutata l'unione di outatime in `main`: rami divergenti, 1 conflitto (`.gitignore`),
  v0.2.3 verificata su copia pulita (typecheck ok, 41/41 test, build ok, 0 vulnerabilità); opzione A raccomandata
  in `outatime-unione-main.md`, D22 proposta
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (5): Q29 sì → branch `chore/unione-main` su outatime (merge di `main` in `firefox-support`,
  `.gitignore` risolto, diff da v0.2.3 solo `.npmrc`, typecheck ok, 41/41 test, build ok) e PR in bozza
  gcampa/outatime#3; domande a scelta multipla: Q24–Q28, Q2, Q11, Q13, Q14 chiuse → D16, D21, D22 approvate,
  D23–D26 nuove
  Applied lessons: none (rubadab non disponibile)
- [x] Piano di F2 (`F2-gestione-oraria.md`, 17 task) con "Allineamento al codice", `f2-sessioni.md` (7 sessioni,
  R1 dopo T2.12), README per l'esecutore, `prompts.md`, modello hook rubadab — 2026-10-03
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (6): l'utente rifiuta due regole dedotte e fissa il principio "la tabella oraria di
  outatime è la fonte di verità" (D27): FILM salvato sul giorno, uscita minima sempre tranne nei giorni liberi,
  Effettivi solo da coppie complete; piano F2 aggiornato (T2.01, T2.02, T2.05, T2.06, T2.09, T2.11, T2.13–T2.15,
  T2.17, checklist R1), regola B9 per l'esecutore
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (7): FILM è una configurazione del profilo dell'utente (D28), non della giornata: ritirata
  la regola "FILM salvato sul giorno"; piano F2 (T2.01, T2.02, T2.09, T2.11, T2.14, T2.15, T2.17) e checklist R1
  aggiornati
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (8): tolto da T2.05 il caso "venerdì 6h", inventato dalla plenaria (outatime ha sempre
  8:00); D23 e regole-outatime § 4 chiariscono che le ore dovute per giorno sono un'impostazione esistente di
  krumiro2.0, non una regola di outatime
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (9): pausa birra pianificata come F3 (D29: scelta nel profilo, tolleranza 15 min, boccale);
  fasi rinumerate F4–F7 (D30); `F3-pausa-caffe.md` con 6 task
  Applied lessons: none (rubadab non disponibile)
- [x] Plenaria 2026-10-03 (10): la pausa sigaretta/birra è solo un cronometro della pausa caffè (D31): F3 riscritta
  (7 task, toglie il permesso a blocchi della 1.5.0); pausa pranzo massima con avviso (D32) aggiunta a F2
  Applied lessons: none (rubadab non disponibile)
- [ ] Merge di gcampa/outatime#3 (utente, "Create a merge commit") e pulizia dei rami (D22)
- [ ] Decisioni proposte D7, D9, D14 approvate o sostituite in R-F0
- [ ] Hook rubadab attivati in locale (D25)
- [ ] **R-F0 — pianificazione**: da fare

## F2 — Gestione oraria di outatime
**Baseline (S1, <data>)**: da scrivere in S1.
- [ ] T2.01 Tipi e valori predefiniti delle configurazioni
- [ ] T2.02 Schema v2: migrazione e validazione
- [ ] T2.03 Calcolo: parametri dalla configurazione della giornata
- [ ] T2.04 Calcolo: pausa minima FILM
- [ ] T2.05 Calcolo: uscita minima e stima durante la pausa
- [ ] T2.06 Calcolo: effettivi e straordinari
- [ ] T2.07 Calcolo: fasce obbligatorie scoperte e pausa oltre il massimo
- [ ] T2.08 Casi di riferimento di outatime
- [ ] T2.09 Impostazioni: Profilo (FILM) e Orari (configurazioni)
- [ ] T2.10 Impostazioni → Orari: fasce obbligatorie
- [ ] T2.11 Giornata: smart working e configurazione
- [ ] T2.12 Giornata: "Ora di levarsi 👋", effettivi, straordinari, fasce
- [ ] **R1 — gestione oraria dall'interfaccia**: da fare
- [ ] T2.13 Storico: effettivi e straordinari del mese
- [ ] T2.14 CSV: configurazione, effettivi, straordinari
- [ ] T2.15 Aiuto: testi della gestione oraria
- [ ] T2.16 Pulizia dei campi vecchi delle impostazioni
- [ ] T2.17 Pubblicazione su gcampa e versione 2.0.0

## F3 — Pausa caffè
**Baseline (S1, <data>)**: da scrivere in S1.
- [ ] T3.01 Profilo: tipo di pausa caffè e durate
- [ ] T3.02 Impostazioni: scelta della pausa e durate
- [ ] T3.03 Cronometro senza timbrature
- [ ] T3.04 Schermata: il boccale che si svuota
- [ ] T3.05 Calcolo: la sigaretta non è più un permesso a blocchi
- [ ] T3.06 Dati: via il flag sigaretta dalle timbrature
- [ ] **R1 — pausa caffè dall'interfaccia**: da fare
- [ ] T3.07 Aiuto e README
