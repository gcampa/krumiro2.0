# Avanzamento

Spuntare `[x]` a fine task con data e nota breve: `- [x] T2.01 … — 2026-01-15, ok (…conteggi test…)`.
Sotto ogni task la riga `Applied lessons: [<id>, …]` oppure `Applied lessons: none`.

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
- [ ] Q29 / D22: conferma dell'utente per branch `chore/unione-main` e PR in bozza su outatime; merge dell'utente
- [ ] Q24–Q28 (gestione oraria di F2), Q11, Q13, Q14, Q2 chiuse con l'utente
- [ ] Decisioni proposte (D7, D9, D11, D14, D16) approvate o sostituite
- [ ] `docs/implementation/README.md` (esecutore), `prompts.md`, `F2-gestione-oraria.md`, `f2-sessioni.md`
- [ ] `.claude/settings.json` e `.mcp.json` di rubadab (Q13)
- [ ] **R-F0 — pianificazione**: da fare
