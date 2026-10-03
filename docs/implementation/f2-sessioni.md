# F2 — sessioni, prompt e revisioni obbligatorie

Ogni sessione è nuova (`/clear`); i prompt sono già compilati. Prima di incollare: `/model`, `/effort` come nella
riga del prompt.

| # | Sessione | Modello · effort | Task | Fine sessione |
|---|---|---|---|---|
| S1 | Apertura | Sonnet 5 · medium | — | riepilogo baseline e incoerenze |
| S2 | Tipi, schema, configurazione nel calcolo | Sonnet 5 · medium | T2.01–T2.03 | riepilogo |
| S3 | FILM, uscita minima, effettivi | Sonnet 5 · medium | T2.04–T2.06 | riepilogo |
| S4 | Fasce, casi outatime, Impostazioni → Profilo e Orari | Sonnet 5 · medium | T2.07–T2.09 | riepilogo |
| S5 | Fasce in Impostazioni, giornata | Sonnet 5 · medium | T2.10–T2.12 | 🛑 R1 — revisione obbligatoria: gestione oraria dall'interfaccia |
| S6 | Storico, CSV, aiuto, pulizia | Sonnet 5 · medium | T2.13–T2.16 | riepilogo |
| S7 | Pubblicazione | Sonnet 5 · medium | T2.17 | riepilogo |
| Sc | Chiusura | Opus 5.5 · high | prompt 4 + E2E | 🛑 R-finale |

Regola per tutti gli stop 🛑: l'agente non prosegue finché l'utente non scrive "R1 superata"; la sessione che la
riceve scrive subito progress.md, la casella della PR e il commit `F2/revisione: R1 superata`. Problemi trovati:
commit `F2/fix: …` con test che li riproduce, poi si ripete la checklist.

Precondizione di S1: F0 approvata (R-F0) e la sua PR unita in `main`.

## S1 — apertura
```text
Modello: Sonnet 5 · effort: medium.
Apri la fase F2 di krumiro2.0. Leggi docs/implementation/gestione-fasi.md, README.md ("Flusso git",
"Come lavorare"), progress.md e f2-sessioni.md.
1. Controlla che F0 sia approvata (riga "R-F0" spuntata in progress.md), unita in main, e che `git status` sia
   pulito. Se no, fermati e dimmelo.
2. `git switch main`, `git pull` solo se main ha un upstream, poi `git switch -c feature/f2-gestione-oraria`
   (se esiste già, `git switch feature/f2-gestione-oraria`).
3. Baseline: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm audit --omit=dev`. Riporta in
   progress.md la riga "Baseline (S1, <data>)" sotto "F2": numero di test, warning, dimensione del precache.
4. Leggi F2-gestione-oraria.md (intestazione, "Allineamento al codice", titoli dei task) e segnala, senza
   correggerle, le incoerenze con il codice attuale in "Dubbi per la plenaria".
5. roadmap.md, riga F2: stato `in corso: apertura <data>`.
6. Apri la PR in bozza "F2 — Gestione oraria di outatime" con la sezione Stato (modello della skill).
Non eseguire task. Riassumi: branch, baseline, incoerenze, primo task.
```

## S2 — T2.01–T2.03
```text
Modello: Sonnet 5 · effort: medium.
Continua krumiro2.0 eseguendo i task da T2.01 a T2.03 inclusi, uno alla volta e in ordine.
Per ciascuno: leggi la sua sezione in docs/implementation/F2-gestione-oraria.md (più la tabella dei valori
predefiniti e "Allineamento al codice" in testa al file), eseguilo secondo docs/implementation/README.md, esegui
la Verifica, aggiorna progress.md, fai il commit `F2/T2.<xx>: …`.
Passa al successivo SOLO se la Verifica e tutte le suite sono verdi. Al primo fallimento non risolvibile,
al primo dubbio o blocco: annota in progress.md e fermati.
Regola B5: i 92 test storici non cambiano i valori attesi.
A fine sessione aggiorna la riga della fase in roadmap.md se lo stato è cambiato.
Riassumi: task completati, verifiche con conteggi, blocchi/dubbi, prossimo task.
```

## S3 — T2.04–T2.06
```text
Modello: Sonnet 5 · effort: medium.
Continua krumiro2.0 eseguendo i task da T2.04 a T2.06 inclusi, uno alla volta e in ordine.
Stato (già fatto, non rifarlo): T2.01–T2.03 — tipi delle configurazioni, schema v2, calcolo che legge la
configurazione della giornata; i test storici girano con CONFIGURAZIONE_LEGACY di tests/helpers.ts.
Per ciascun task: sua sezione in docs/implementation/F2-gestione-oraria.md, esecuzione secondo il README,
Verifica con output reale, progress.md, commit `F2/T2.<xx>: …`. Passa al successivo solo con Verifica e suite
verdi. Se un caso atteso del task non torna, NON cambiare il valore atteso: è un Dubbio per la plenaria.
A fine sessione aggiorna roadmap.md se lo stato è cambiato.
Riassumi: task completati, verifiche con conteggi, blocchi/dubbi, prossimo task.
```

## S4 — T2.07–T2.09
```text
Modello: Sonnet 5 · effort: medium.
Continua krumiro2.0 eseguendo i task da T2.07 a T2.09 inclusi, uno alla volta e in ordine.
Stato (già fatto, non rifarlo): T2.01–T2.06 — configurazioni, schema v2, FILM, uscita minima, stima in pausa,
effettivi e straordinari nel calcolo.
Per ciascun task: sua sezione in docs/implementation/F2-gestione-oraria.md, esecuzione secondo il README,
Verifica con output reale, progress.md, commit `F2/T2.<xx>: …`. T2.08 non modifica src/: un caso che fallisce è
un Dubbio. T2.09 ha una Verifica nel browser reale (claude-in-chrome, `npm run dev`): se non puoi, "verifica UI da
fare a mano" in progress.md. Passa al successivo solo con Verifica e suite verdi.
Riassumi: task completati, verifiche con conteggi, blocchi/dubbi, prossimo task.
```

## S5 — T2.10–T2.12 → 🛑 R1
```text
Modello: Sonnet 5 · effort: medium.
Continua la fase F2 di krumiro2.0 fino al checkpoint T2.12, senza superarlo.
Leggi docs/implementation/README.md (regole e DoD), progress.md, F2-gestione-oraria.md ("Allineamento al codice"
incluso) e la sezione R1 di docs/implementation/f2-sessioni.md.

Stato (già fatto, non rifarlo):
T2.01–T2.09 — configurazioni Presenza/FILM/Smart working nel calcolo (FILM, uscita minima, stima in pausa,
effettivi, straordinari, fasce scoperte), 19 casi di riferimento outatime in tests/outatime.test.ts,
Impostazioni → Profilo (FILM) e Orari (configurazioni).

Esegui i task da T2.10 a T2.12 inclusi, uno alla volta. Per ciascuno: sua sezione, esecuzione, Verifica con
output reale (browser reale per le voci UI), progress.md, commit `F2/T2.<xx>: …`. Passa al successivo solo con
Verifica e suite verdi.

🛑 STOP OBBLIGATORIO dopo T2.12: riassumi task, verifiche con conteggi, decisioni e problemi aperti, elenca la
checklist R1 e ASPETTA la mia revisione. Non iniziare T2.13 nemmeno se tutto è verde. Quando scrivo
"R1 superata": riga in progress.md, casella nella PR, commit `F2/revisione: R1 superata`.

Regole della sessione:
- scelta non scritta o contraddizione → "Dubbi per la plenaria", fermati;
- verifiche UI nel browser reale; se non puoi, "verifica UI da fare a mano";
- non anticipare, non aggiungere; blocco esterno → "Blocchi", fermati;
- non cancellare né sovrascrivere i dati locali del browser;
- Applied lessons: none (rubadab non disponibile) finché gli hook non sono attivi.
```

### R1 — checklist "gestione oraria dall'interfaccia"
Preparazione (utente): da eseguire **dopo le 15:01** (gli orari della checklist devono essere già passati: con
timbrature future l'ora di levarsi non ha senso). `npm run dev`; nel browser Impostazioni → Esporta backup completo
(JSON); poi dati del sito cancellati. Se oggi è sabato o domenica: Impostazioni → Ore dovute di quel giorno, togli
"predefinito", 08:00.
- [ ] *(T2.09)* Impostazioni → Profilo: "Abilita FILM" spento; Impostazioni → Orari: tre gruppi "Presenza", "Presenza FILM", "Smart
  working" con i valori della tabella in testa a F2-gestione-oraria.md.
- [ ] *(T2.03, T2.12)* Oggi: + Aggiungi timbratura Entrata 08:25, Inizio pausa 13:00, Fine pausa 14:00 →
  "Ora di levarsi 👋" 17:30.
- [ ] *(T2.04, T2.09)* Impostazioni → Profilo → Abilita FILM; Oggi: modifica le timbrature in Entrata 08:30, Inizio pausa 12:55, Fine pausa
  13:10 → 17:05; il sottotitolo finisce con "· Presenza FILM".
- [ ] *(T2.05, T2.09)* "Presenza FILM" → Uscita minima 18:00 → Oggi 18:00 con nota "uscita minima della
  configurazione".
- [ ] *(T2.09)* Ripristina valori predefiniti → "Abilita FILM" resta attivo (è del profilo) e Oggi resta 17:05;
  Impostazioni → Profilo → spengo "Abilita FILM" → Oggi "· Presenza" e **17:30** (pausa minima 60), anche le
  giornate passate in presenza passano a Presenza.
- [ ] *(T2.11, T2.05)* FILM spento; tocca "🏠 Smart working"; Oggi con Entrata 07:15, Inizio pausa 12:30, Fine
  pausa 15:00 → 17:45; sottotitolo "· Smart working"; ricaricando la pagina resta attivo.
- [ ] *(T2.06, T2.07, T2.12)* Storico → + Giornata dimenticata (giorno feriale passato): Entrata 08:00, Uscita
  17:00 → Effettivi 9h, Straordinari 1h, avviso "Fascia obbligatoria 15:00–17:30 non coperta".
- [ ] *(T2.10)* Smart working → Rimuovi la fascia 2 → la giornata del punto precedente, se in smart working, non
  segnala più 15:00–17:30; fascia con inizio 16:00 e fine 15:00 → toast "L'inizio deve precedere la fine".
- [ ] *(T2.08)* `npm test` verde, `tests/outatime.test.ts` con 19 casi.
- [ ] Tema scuro (Impostazioni → Aspetto → Scuro): Impostazioni → Orari e avviso fasce leggibili.
- [ ] Diff: `git diff main..HEAD --stat` senza file fuori da `src/`, `tests/`, `docs/implementation/`.
- [ ] Dati ripristinati: Impostazioni → Importa CSV o backup JSON… con il backup della preparazione.

## S6 — T2.13–T2.16
```text
Modello: Sonnet 5 · effort: medium.
Continua krumiro2.0 eseguendo i task da T2.13 a T2.16 inclusi, uno alla volta e in ordine.
Prima di tutto: controlla in progress.md che R1 sia registrata come superata; se manca, chiedimi l'esito e
registralo prima di proseguire.
Stato (già fatto, non rifarlo): T2.01–T2.12 e R1 — gestione oraria completa nel calcolo, Impostazioni → Orari con
fasce, giornata con smart working, "Ora di levarsi 👋", effettivi, straordinari, avviso fasce.
Per ciascun task: sua sezione in docs/implementation/F2-gestione-oraria.md, esecuzione secondo il README,
Verifica con output reale, progress.md, commit `F2/T2.<xx>: …`. Passa al successivo solo con Verifica e suite
verdi. Al primo dubbio o blocco: annota e fermati.
Riassumi: task completati, verifiche con conteggi, blocchi/dubbi, prossimo task.
```

## S7 — T2.17
```text
Modello: Sonnet 5 · effort: medium.
Continua krumiro2.0 con il task T2.17 (un solo task). Leggi docs/implementation/README.md, progress.md e la
sezione T2.17 di docs/implementation/F2-gestione-oraria.md. Controlla di essere su feature/f2-gestione-oraria.
Esegui la Verifica e riporta l'output reale; aggiorna progress.md e roadmap.md (riga F2: "in corso: T2.17, R1
superata"); commit `F2/T2.17: pubblicazione su gcampa e versione 2.0.0`.
Non impostare GitHub Pages: è un passo dell'utente.
Riassumi: file toccati, verifiche, prossimo passo (chiusura Sc).
```

## Sc — chiusura → 🛑 R-finale
```text
Modello: Opus 5.5 · effort: high (o superiore). Usa la skill metodo-fasi, § "Sc — chiusura di fase".
Chiudi la fase F2 di krumiro2.0. Non aggiungere funzioni.
Leggi gestione-fasi.md, README, progress.md, F2-gestione-oraria.md e f2-sessioni.md.
1. Tutti i task spuntati, esito R1 scritto, nessuna "verifica UI da fare a mano" e nessun Dubbio aperti.
2. `npm test`, `npm run typecheck`, `npm run build`: nessun nuovo warning rispetto alla baseline di S1;
   `npm audit --omit=dev`: nessuna vulnerabilità.
3. Revisione del diff `git diff main...HEAD`: correggi con test ciò che è certo (`F2/fix: …`), elenca il resto;
   se ci sono fix, di nuovo le suite del passo 2.
4. E2E dal frontend sul codice finale: FERMATI e chiedimi di esportare il backup e svuotare i dati del sito;
   poi ripercorri i 5 punti di "Uscita" in testa a F2-gestione-oraria.md (il punto 5 dopo che avrò attivato
   GitHub Pages e unito la PR), annotando ogni passo in progress.md. Alla fine ricordami di reimportare il backup.
5. progress.md "Uscita da F2: raggiunta — data, conteggi"; roadmap aggiornata; questo file cancellato; commit
   `F2/chiusura: …`.
6. PR pronta con "Test da eseguire" a checkbox.
Non fare merge. Riassumi l'esito e lasciami R-finale e il merge.
```

### R-finale
- [ ] progress.md completo, "Uscita da F2: raggiunta"
- [ ] Suite verdi senza nuovi warning; pacchetti vulnerabili: nessuno
- [ ] Revisione del diff `main...HEAD` fatta prima della E2E, punti aperti elencati
- [ ] Dati locali reimportati dal backup
- [ ] GitHub Pages attivo su `gcampa/krumiro2.0` (Settings → Pages → Source: GitHub Actions)
- [ ] Questo file cancellato; roadmap aggiornata
- [ ] Test da eseguire della PR tutti spuntati → merge (utente)
