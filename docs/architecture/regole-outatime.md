# Gestione oraria di outatime → krumiro2.0

Stato: **F0, analisi del 2026-10-03 (rifatta su outatime v0.2.3).** Obiettivo dell'utente: portare in krumiro2.0
la gestione oraria di outatime, con **orari configurabili** e la configurazione **FILM**. Base della fase F2.
Decisioni in § 5.

> La prima analisi (commit `447ba9b`) leggeva `main` di outatime, fermo alla 0.1. La versione in uso è
> **v0.2.3** (branch `firefox-support`, tag `v0.2.3`): TypeScript, esbuild, Jest, CI e release, popup FILM.
> Questo documento la sostituisce.

**Questa tabella oraria è la fonte di verità (D27)**: dove krumiro2.0 e outatime divergono su ciò che outatime
definisce, ha ragione outatime.

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
| 💸 VOLONTARIATO / "ore non riconosciute" | effettivi − ore pagate lette dal portale (`ORE ORDINARIE`, `BANCA ORE LUN - VEN MATURATA`, `STRAORDINARI AUT`, `SMART WORKING`) | richiede le ore pagate dal portale: F4 (inserimento) e contratto del QR |

## 4. Dove krumiro2.0 resta più completo (si tiene)

- **Permessi, uscite e rientri multipli**: outatime usa solo le prime 3 timbrature; krumiro2.0 gestisce tutta la
  sequenza (permessi coperti, permesso che copre il pranzo, sigaretta, uscita anticipata).
- **Uscita prevista prima della pausa**: outatime non la calcola con meno di 3 timbrature; krumiro2.0 la stima
  aggiungendo la pausa minima.
- **Giornate passate**: saldo, storico, CSV.
- **Ore dovute per giorno della settimana**: impostazione già presente in krumiro2.0 1.5.0, non una regola di
  outatime. I predefiniti sono 8:00 lun–ven (= `minimumWorkingHours` di outatime) e 0 sab–dom (giorni liberi).
  Il piano non introduce giorni con ore diverse da 8:00.

## 5. Decisioni (2026-10-03)

Tutti i punti aperti sono chiusi in [D21](decisions.md#d21--gestione-oraria-a-configurazioni-presenza-film-smart-working)
e [D23](decisions.md#d23--dettagli-del-calcolo-della-gestione-oraria): FILM globale, smart working per giornata, minuti
di pausa FILM dopo le 15:00 come outatime, 09:00 + 13:01–13:42 → 17:41, fasce obbligatorie per configurazione
(solo avviso), "Ora di levarsi 👋", Effettivi (solo coppie complete, come outatime), Straordinari; uscita minima
sempre tranne nei giorni liberi; FILM configurazione del profilo dell'utente (D28); outatime `main` allineato a 0.2.3 (D22); la tabella
oraria di outatime è la fonte di verità (D27).
