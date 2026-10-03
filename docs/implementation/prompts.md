# Prompt — krumiro2.0 + outatime

Prompt generici del metodo (skill `metodo-fasi`) compilati per il progetto. I prompt della fase in corso, già
compilati con task e checklist, sono in `f<n>-sessioni.md`. Prima di incollare: sessione nuova (`/clear`),
`/model <modello>`, `/effort <effort>`. rubadab: fino all'attivazione degli hook (D25) non compare "rubadab:
recalling lessons…" e le righe di progress.md riportano `Applied lessons: none (rubadab non disponibile)`.

Effort degli esecutori: **solo medium** (D24).

## Plenaria B — pianificazione di fase (P)
```text
Modello: Opus 5.5 · effort: high (o superiore). Usa la skill metodo-fasi, § "P — pianificazione di fase".
Pianifica la fase F<n> di krumiro2.0 (documentazione unica in krumiro2.0/docs, D16; se la fase tocca outatime,
anche gcampa/outatime da main). Leggi progress.md, roadmap.md, F<n>-<nome>.md (se esiste) e il codice che la
fase tocca.
0. Crea il branch feature/f<n>-<nome> da main aggiornato (in ogni repository toccato).
1. Scrivi la sezione "Allineamento al codice" del file di fase.
2. Scrivi i task secondo le "Regole di scrittura dei task" con effort solo medium: ogni task un modulo, firme,
   testi, formule e casi di test scritti. Ogni punto che non sai decidere diventa una domanda per me, a scelta
   multipla (rispondo dal telefono), con la tua raccomandazione.
3. Scrivi f<n>-sessioni.md: sessioni (max 4 task), checkpoint 🛑 solo su gruppi provabili dall'interfaccia,
   checklist con valori letterali, prompt compilati.
4. Aggiorna roadmap e progress. Commit `docs: piano F<n> …`.
Non eseguire task. Riassumi: task, sessioni, checkpoint, decisioni prese con me.
```

## Plenaria C — revisione di checkpoint
```text
Modello: Opus 5.5 · effort: high (o superiore). Usa la skill metodo-fasi.
Revisione R<k> della fase F<n> di krumiro2.0. Leggi progress.md e la sezione R<k> di f<n>-sessioni.md.
1. Revisione del diff `git diff <commit di inizio gruppo>..HEAD`: bug, regole B/W, test mancanti, file fuori
   scope. Correggi solo ciò che è certo, con test che fallisce prima (`F<n>/fix: …`).
2. Guidami nella checklist R<k> nel browser, voce per voce.
3. Quando scrivo "R<k> superata": subito la riga `- [x] **R<k> — <gruppo>**: superata — <data> · correzioni: …` in
   progress.md, checkbox nella PR in bozza, roadmap, commit `F<n>/revisione: R<k> superata`.
Non iniziare il task successivo.
```

## Plenaria D — dubbi aperti
```text
Modello: Opus 5.5 · effort: high (o superiore). Usa la skill metodo-fasi, § "Dubbi".
Leggi "Dubbi per la plenaria" in docs/implementation/progress.md di krumiro2.0. Per ciascun dubbio aperto:
contesto dal codice e dai documenti, opzioni, tua raccomandazione. Fammi le domande a scelta multipla, una per
dubbio. Registra ogni esito (decisions.md, file di fase o README) e segna il dubbio come risolto con il
riferimento. Commit `docs: dubbi F<n> risolti …`, poi scrivi il prompt per riprendere l'esecuzione.
```

## Prompt 2 — un task
```text
Modello: Sonnet 5 · effort: medium.
Continua l'implementazione di krumiro2.0. Leggi docs/implementation/README.md e progress.md, prendi il PRIMO task
non spuntato e leggi solo la sua sezione nel file di fase e le sezioni dei documenti che cita.
Controlla di essere sul branch feature/ della fase; se sei su main fermati.
Esegui il task secondo le regole del README:
- esegui la Verifica e riporta l'output reale; azioni nell'interfaccia → browser reale con claude-in-chrome; se
  non puoi, "verifica UI da fare a mano" in progress.md;
- aggiorna progress.md (data, nota breve con conteggi test, riga Applied lessons) e, se lo stato della fase è
  cambiato, la riga della fase in roadmap.md;
- un commit `F<n>/T<n>.<xx>: <descrizione breve>`.
Un solo task. Non anticipare, non aggiungere.
Blocco esterno → "Blocchi" e fermati. Qualunque scelta non scritta o contraddizione → "Dubbi per la plenaria" e
fermati.
Riassumi: file toccati, verifiche con conteggi, prossimo task.
```

## Prompt 1, 3, 4, 5
Apertura (1), più task di fila (3), chiusura (4) e continuazione fino al checkpoint (5) sono compilati per la fase in
corso in `f<n>-sessioni.md` (per F2: [f2-sessioni.md](f2-sessioni.md)), dai modelli della skill.
