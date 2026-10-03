# Regole di outatime e regole di krumiro2.0 — confronto

Stato: **F0, analisi del 2026-10-03.** Base della fase F2 ("Timbratura manuale con le regole di outatime").
Le domande aperte citate (Q18–Q22) sono in [../README.md](../README.md#domande-aperte).

Fonte outatime: `gcampa/outatime@f655344`, `background.js` (funzioni `timeToExit`, `getPausaPranzo`,
`searchLunch`, `normalizeLunch`, `injectWorkingTime`, `injectEffectiveTime`).
Fonte krumiro2.0: `src/core/calcolo.ts` (`calcolaGiornata`), `src/core/tipi.ts` (`IMPOSTAZIONI_PREDEFINITE`).

## 1. Le regole di outatime, scritte per esteso

| # | Regola | Dove |
|---|---|---|
| O1 | Orario di riferimento 08:30–17:30: 8 h di lavoro + 1 h di pausa pranzo | `timeToExit` (`ottoemezza`, `cinqueemezza`) |
| O2 | Entrata **prima delle 08:30** → l'uscita è comunque 17:30 (+ eccedenza pausa) | `timeToExit` |
| O3 | Entrata **tra 08:30 e 09:30** (fascia flessibile) → uscita = 17:30 + ritardo rispetto alle 08:30 + eccedenza pausa | `timeToExit` |
| O4 | Entrata **dalle 09:30 in poi** → nessuna ora di uscita calcolata | `timeToExit` (`exitTime` resta 0) |
| O5 | Pausa pranzo **minima 60 min**: una pausa più breve conta 60 min | `lunchMinTime`, `getPausaPranzo` |
| O6 | Pausa non ancora timbrata → si assumono 60 min | `getPausaPranzo` (meno di 3 timbrature) |
| O7 | La pausa è il rientro che cade tra **12:30 e 14:30** (orario del rientro meno timbratura precedente) | `getPausaPranzo` |
| O8 | Nel totale "Official Timing" una pausa **interamente tra 13:00 e 14:30** più breve di 60 min conta 60 min | `searchLunch`, `normalizeLunch` |
| O9 | "Entrata per SMART WORKING" / "Uscita per SMART WORKING" valgono come Entrata/Uscita | `createBadgeDictionary` |
| O10 | Due totali: **Official Timing** (con pausa normalizzata, ⏱️) ed **Effective timing** (orari reali, 🐫) | `injectWorkingTime`, `injectEffectiveTime` |
| O11 | Etichetta dell'uscita: **"Ora di levarsi: HH:MM 👋"**, solo per oggi | `timeToExit` |
| O12 | Permessi (uscite/rientri a metà mattina o pomeriggio) **non** considerati | assenza di codice |

Difetti di outatime da **non** riprodurre (si rispettano le regole, non gli errori): mese non decrementato nelle
date; `mergeData` sempre vero; orari senza zeri iniziali dopo `searchLunch`; con un rientro dopo le 14:30 la
"pausa" diventa l'intervallo dall'entrata del mattino (es. uscita 14:00, rientro 14:45 → uscita prevista 21:45).

## 2. Confronto misurato

Uscita prevista calcolata con `calcolaGiornata` di krumiro2.0 (impostazioni predefinite, eventi registrati come
pausa) e uscita di outatime ricavata da O1–O7. Misura del 2026-10-03, script temporaneo non versionato.

| Caso | outatime | krumiro2.0 oggi (pausa minima 30) | krumiro2.0 con pausa minima 60 |
|---|---|---|---|
| 1 · Entrata 08:10, pausa 13:00–14:00 | 17:30 | 17:30 | 17:30 |
| 2 · Entrata 08:45, pausa 13:00–13:40 | 17:45 | **17:25** | 17:45 |
| 3 · Entrata 08:45, pausa 12:40–13:30 | 17:45 | **17:35** | 17:45 |
| 4 · Entrata 09:45, pausa non ancora fatta | — (O4) | 18:45 | 18:45 |
| 5 · Entrata 08:45, pausa 13:00–14:20 | 18:05 | 18:05 | 18:05 |
| 6 · Entrata 08:45, pausa non ancora fatta | 17:45 | 17:45 | 17:45 |
| 7 · Entrata 08:45, permesso 10:00–11:00, pausa 13:00–14:00 | 17:45 (O12) | 17:45 (permesso coperto) | 17:45 |

**Risultato**: con la sola pausa minima a 60 min krumiro2.0 dà la stessa uscita di outatime in tutti i casi
definiti. Restano da decidere i casi che outatime non definisce o definisce in modo diverso:

| Differenza | outatime | krumiro2.0 oggi | Domanda |
|---|---|---|---|
| Pausa minima | 60 min (O5) | 30 min | Q18 |
| Fascia pranzo | 12:30–14:30 (O7), 13:00–14:30 (O8) | 12:00–14:30 | Q19 |
| Entrata dopo le 09:30 | nessun calcolo (O4) | calcolo normale, nessun avviso | Q20 |
| Smart working | riconosciuto, stesso calcolo (O9) | non esiste | Q21 |
| Totali ed etichette | Official + Effective, "Ora di levarsi 👋" (O10, O11) | lavorate, "Uscita prevista" | Q22 |
| Timbrature prima delle 08:30 | contano 08:30 solo per l'uscita | contano 08:30 in tutti i calcoli | nessuna: krumiro2.0 è coerente, si tiene |
| Permessi | ignorati (O12) | coperti | nessuna: krumiro2.0 è più completo, si tiene |
