# Gestione oraria di outatime → krumiro2.0

Stato: **F0, analisi del 2026-10-03 (rifatta su outatime v0.2.3).** Obiettivo dell'utente: portare in krumiro2.0
la gestione oraria di outatime, con **orari configurabili** e la configurazione **FILM**. Base della fase F2.
Domande aperte citate (Q24–Q29) in [../README.md](../README.md#domande-aperte).

> La prima analisi (commit `447ba9b`) leggeva `main` di outatime, fermo alla 0.1. La versione in uso è
> **v0.2.3** (branch `firefox-support`, tag `v0.2.3`): TypeScript, esbuild, Jest, CI e release, popup FILM.
> Questo documento la sostituisce.

Fonti: `gcampa/outatime@v0.2.3` — `src/lib.ts` (`getMinimumAfternoonEnd`, `getMinimumPresenceExit`,
`getUnpaidMinutes`), `src/content.ts`, `public/popup.html`, `test/lib.spec.ts`; issue
[gcampa/outatime#2](https://github.com/gcampa/outatime/issues/2) (regole FILM e smart working).
krumiro2.0: `src/core/calcolo.ts` (`calcolaGiornata`), `src/core/tipi.ts` (`IMPOSTAZIONI_PREDEFINITE`).

## 1. Le tre configurazioni di outatime

outatime sceglie la regola per la giornata così: se la prima timbratura è "Entrata per SMART WORKING" →
**Smart working**; altrimenti, se nel popup è attivo "Abilita FILM" (`chrome.storage.local.filmEnabled`) →
**Presenza FILM**; altrimenti → **Presenza**. L'uscita si calcola solo per oggi e solo con almeno 3 timbrature
(entrata, inizio pausa, fine pausa).

| Parametro | Presenza | Presenza FILM | Smart working |
|---|---|---|---|
| Ore dovute | 8:00 | 8:00 | 8:00 |
| Ingresso minimo (prima conta come quest'ora) | 08:30 | 08:30 | 07:00 |
| Pausa minima | 60 min | 30 min | 30 min |
| Finestra in cui vale la pausa minima | tutta la giornata | **13:00–15:00** | tutta la giornata |
| Uscita minima | 17:30 | 17:00 | 17:30 |
| Funzione | `getMinimumAfternoonEnd(…, false)` | `getMinimumPresenceExit` | `getMinimumAfternoonEnd(…, true)` |

Regola FILM (issue #2): "pausa minimo 30 min conteggiata dalle 13:00 alle 15:00; entrata dalle 08:30, uscita minima
alle 17:00; la flessibilità conteggia 30 min minimo e il rimanente va al minuto". I minuti di pausa prima delle
13:00 e quelli oltre i 30 dentro la finestra ritardano l'uscita 1:1.

## 2. Una sola formula per le tre configurazioni (proposta D21)

```
ingresso   = max(prima entrata, ingresso minimo)
pausa      = (minuti di pausa fuori finestra) + max(pausa minima, minuti di pausa dentro la finestra)
uscita     = max(uscita minima, ingresso + pausa + ore dovute)
```
Senza finestra (Presenza, Smart working) la "finestra" è tutta la giornata, quindi `pausa = max(pausa minima,
pausa fatta)`. Con la finestra FILM 13:00–15:00 e pausa minima 30, uscita minima 17:00 = 08:30 + 0:30 + 8:00.

**Verifica: la formula riproduce tutti i 17 casi di `test/lib.spec.ts` di outatime v0.2.3.** Accanto, cosa dà
krumiro2.0 oggi con le impostazioni predefinite (misura del 2026-10-03, script temporaneo non versionato;
eventi registrati come Entrata / Inizio pausa / Fine pausa, ora corrente = fine pausa + 1 min).

| Config. | Entrata · pausa | outatime = formula | krumiro2.0 oggi |
|---|---|---|---|
| Presenza | 8:25 · 13:00–14:00 | 17:30 | 17:30 |
| Presenza | 8:00 · 13:30–13:40 | 17:30 | **17:00** |
| Presenza | 9:45 · 13:30–13:40 | 18:45 | **18:15** |
| Presenza | 9:45 · 12:30–15:00 | 20:15 | 20:15 |
| Presenza | 8:00 · 12:30–15:00 | 19:00 | 19:00 |
| Presenza | 9:25 · 13:10–14:05 | 18:25 | **18:20** |
| Smart working | 9:00 · 13:10–13:30 | 17:30 | 17:30 |
| Smart working | 8:25 · 13:00–14:00 | 17:30 | 17:30 |
| Smart working | 7:15 · 12:30–14:30 | 17:30 | **18:30** |
| Smart working | 7:15 · 12:30–15:00 | 17:45 | **19:00** |
| Smart working | 7:00 · 12:30–15:00 | 17:30 | **19:00** |
| Smart working | 10:00 · 12:30–15:00 | 20:30 | 20:30 |
| FILM | 09:00 · 13:00–13:30 | 17:30 | 17:30 |
| FILM | 08:20 · 13:00–13:30 | 17:00 | 17:00 |
| FILM | 08:30 · 12:55–13:10 | 17:05 | **17:00** |
| FILM | 08:30 · 13:01–13:42 | 17:11 | 17:11 |
| FILM | 08:30 · 12:30–13:00 | 17:30 | **17:00** |

krumiro2.0 sbaglia 8 casi su 17: ha **un solo** insieme di regole (ingresso minimo 08:30, pausa minima 30, nessuna
uscita minima, nessuna finestra della pausa). Ingresso minimo e pausa minima esistono già come impostazioni
(`orarioMinimoConteggio`, `pausaMinima`); mancano **uscita minima**, **finestra della pausa minima**, le **tre
configurazioni** e la scelta della configurazione per giornata.

## 3. Cosa mostra outatime oltre all'uscita

| Dato | Regola outatime | In krumiro2.0 |
|---|---|---|
| 👋 "Ora di levarsi: H:MM" | uscita minima di oggi (§ 2) | oggi "Uscita prevista" (Q28) |
| 🐫 EFFETTIVI | somma delle coppie entrata/uscita complete, minuti reali | non c'è (Q28) |
| Straordinari | effettivi − 8:00, se positivo | non c'è; c'è il saldo (Q28) |
| 💸 VOLONTARIATO / "ore non riconosciute" | effettivi − ore pagate lette dal portale (`ORE ORDINARIE`, `BANCA ORE LUN - VEN MATURATA`, `STRAORDINARI AUT`, `SMART WORKING`) | richiede le ore pagate dal portale: F3 (inserimento) e contratto del QR |

## 4. Dove krumiro2.0 resta più completo (si tiene)

- **Permessi, uscite e rientri multipli**: outatime usa solo le prime 3 timbrature; krumiro2.0 gestisce tutta la
  sequenza (permessi coperti, permesso che copre il pranzo, sigaretta, uscita anticipata).
- **Uscita prevista prima della pausa**: outatime non la calcola con meno di 3 timbrature; krumiro2.0 la stima
  aggiungendo la pausa minima.
- **Giornate passate**: saldo, storico, CSV.

## 5. Punti da decidere

| Punto | Domanda |
|---|---|
| Modello a configurazioni, valori predefiniti di outatime, tutto modificabile, FILM come scelta globale, smart working per giornata | Q24 |
| FILM: minuti di pausa **dopo le 15:00** — outatime li ignora (pausa 14:30–15:30 → uscita 17:00) | Q25 |
| Issue #2: "Entrata 09:00, pausa 13:01–13:42, uscita 17:11" contraddice la regola (17:41); il test usa 08:30 | Q26 |
| Smart working: issue #2 cita fasce obbligatorie 10:00–12:30 e 15:00–17:30, non implementate in outatime | Q27 |
| Etichette e totali di outatime in krumiro2.0 | Q28 |
| Branch di riferimento di outatime (`main` è fermo alla 0.1) | Q29 |
