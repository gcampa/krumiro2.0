# Integrazione outatime → krumiro2.0 (trasferimento offline con QR)

Stato: **F0 — architettura approvata il 2026-10-03 (Q16-B, D19).** Nessun servizio esterno: i dati passano dallo
schermo del PC alla fotocamera del telefono. Il piano Firebase (D8) è scartato; le notifiche anche (D18).
Sicurezza in [sicurezza.md](sicurezza.md); regole di calcolo in [regole-outatime.md](regole-outatime.md).

## 1. Obiettivo

1. **Subito (F2)**: timbro a mano in krumiro2.0 con gli orari, le configurazioni e le convenzioni di outatime.
2. **Poi (F3)**: inserisco a mano le timbrature come le mostra il portale (Entrata/Uscita) e krumiro2.0 le
   classifica e le unisce a quelle che ho toccato.
3. **Infine (F4–F5)**: apro il portale come sempre, outatime mostra un QR cifrato con le timbrature recenti,
   lo inquadro con krumiro2.0 e la giornata si aggiorna.

## 2. Stato attuale (inventario del 2026-10-03)

### outatime (`gcampa/outatime`, commit `f655344`)

| Aspetto | Stato |
|---|---|
| Tipo | Estensione Chrome Manifest V3, versione `0.1`, un solo file `background.js` (~350 righe), nessuna build, nessun test |
| Attivazione | **solo al clic** sull'icona (`chrome.action.onClicked` → `chrome.scripting.executeScript`); nessun content script automatico |
| Portale | `http://172.16.0.32/*` (HTTP in chiaro, rete interna); `https` solo come permesso opzionale |
| Lettura | elementi `[data-giorno]` (valore `gg/mm/aaaa`) con figlio `.cartellino-portale-timb`; regex `((2[0-3]|[01][0-9]):[0-5][0-9])|([A-Z])\w+` sul testo; scarta le parole `SMART` e `WORKING` |
| Calcoli | ore "ufficiali" e "effettive", pausa pranzo minima 1h, "Ora di levarsi" (8:30–9:30 → 17:30 + ritardo) iniettati nella pagina |
| Uscita dati | `report` (array `{date, details}`) stampato con `console.log`; **non esce dal browser** |
| Permessi | `activeTab`, `scripting`, `storage` |

Difetti rilevati (non da "correggere" in outatime 0.1: la nuova versione non riusa questi calcoli, vedi D9):
- `new Date(year, month, day)` usa il mese non decrementato (mese successivo): le durate tornano, le date no.
- `mergeData` confronta `Date(w.date) == Date(e.date)` (stringa dell'ora corrente): sempre vero.
- `searchLunch` riscrive l'orario senza zeri iniziali (`"9:5"`), poi letto con `substr` → orari errati.
- Coppie `[orario, parola]` costruite a passo 2: una parola in più o in meno (es. `Nessuna timbratura`, una
  dicitura nuova) sfasa tutta la giornata.
- `document.head.innerHTML += …` a ogni clic: riscrive l'head della pagina del portale.

### krumiro2.0 (`gcampa/krumiro2.0`, branch base `main` @ `1440056`, versione `1.5.0`)

| Aspetto | Stato |
|---|---|
| Stack | TypeScript 5.9 senza framework, Vite 8, vite-plugin-pwa 1.3 (`generateSW`), Vitest 5, Node 22 |
| Dati | solo `localStorage` chiave `timbrature`, schema `version: 1`, migrazioni in `src/storage/migrazioni.ts` |
| Backend | **nessuno** ("i dati restano sul telefono", README) |
| Deploy | GitHub Pages via `.github/workflows/deploy.yml`; README indica `https://ricky79.github.io/krumiro2.0/` |
| Modello | `Giornata { data, permessoInizioMinuti, eventi: Evento[] }`, `Evento { id, tipo, minuti, pausaConfermata?, sigaretta? }` |
| Tipi evento | `ENTRATA`, `INIZIO_PAUSA`, `FINE_PAUSA`, `USCITA_PERMESSO`, `RIENTRO_PERMESSO`, `USCITA`, `USCITA_ANTICIPATA` |
| Baseline | 8 file di test, **92/92 verdi**; build ok, precache 16 voci (98.96 KiB) |

Conseguenza principale: il portale conosce solo **Entrata/Uscita** (più "per SMART WORKING"); krumiro2.0 distingue
pausa, permesso, sigaretta, uscita anticipata. Serve una **classificazione** (§ 6) e una regola di **unione** con i
dati inseriti a mano (§ 7).

## 3. Architettura

```mermaid
flowchart LR
    subgraph PC["PC aziendale (Chrome)"]
        P["Portale timbrature<br/>http://172.16.0.32"]
        CS["outatime 1.0<br/>legge il cartellino"]
        Q["QR cifrato<br/>sullo schermo"]
        P -- DOM --> CS -- "GiornataPortale[] cifrate" --> Q
    end
    subgraph TEL["Telefono"]
        K["krumiro2.0 PWA<br/>fotocamera → decifra → classifica → unisce"]
    end
    Q -. "inquadratura (nessuna rete)" .-> K
    M["Inserimento manuale<br/>(F3)"] --> K
```

Principi:
1. **Nessun dato lascia il PC attraverso la rete**: outatime non ha permessi di rete verso l'esterno; il QR è
   l'unico canale (rispetta le regole aziendali: Q1, Q16).
2. **Il portale è la fonte di verità** (D7): il QR porta le giornate intere; l'import è idempotente.
3. **Cifratura end-to-end** (D6): chi fotografa lo schermo non legge nulla; krumiro2.0 accetta solo QR prodotti
   dalla tua outatime (cifratura autenticata).
4. **outatime trasmette timbrature grezze** (D9): i calcoli restano in krumiro2.0.
5. **Classificazione e unione sono le stesse** per l'inserimento manuale (F3) e per il QR (F5): una sola
   funzione pura, `unisciPortale`.

## 4. Flusso (F4–F5)

```mermaid
sequenceDiagram
    participant U as Utente
    participant P as Portale
    participant O as outatime
    participant K as krumiro2.0
    U->>P: apre il cartellino (login aziendale come sempre)
    P-->>O: DOM caricato
    O->>O: leggiCartellino → GiornataPortale[] (ultimi 7 giorni)
    O->>O: cifra AES-256-GCM → testo `KR1.…` → QR
    O-->>U: QR visibile (modalità decisa nel P di F4)
    U->>K: Oggi → "Leggi QR dal portale"
    K->>K: fotocamera → testo → decifra → verifica lettoIl
    K->>K: per ogni giorno: classificaPortale → unisciPortale → salva
    K-->>U: "3 giornate aggiornate dal portale" + Annulla
```

## 5. Contratto dati

### 5.1 Contenuto in chiaro (prima della cifratura) — `GiornataPortale` v1
```ts
/** Versione 1 del contratto outatime → krumiro2.0. Solo questi campi, nessun altro. */
interface GiornataPortale {
  v: 1;
  /** 'YYYY-MM-DD', fuso Europe/Rome. */
  data: string;
  /** In ordine di orario, come compaiono nel cartellino. Massimo 20. */
  timbrature: { minuti: number; verso: 'E' | 'U'; smart: boolean }[];
  /** Istante della lettura, ISO 8601 UTC. */
  lettoIl: string;
}
```
- `minuti`: minuti dalla mezzanotte (0–1439), stessa convenzione di `Evento.minuti` di krumiro2.0.
- `verso`: `E` = "Entrata…", `U` = "Uscita…"; `smart` = la dicitura contiene "SMART WORKING".
- Giorni senza timbrature ("Nessuna timbratura"): `timbrature: []` — il giorno si scrive comunque, così una
  correzione sul portale che toglie timbrature arriva a krumiro2.0.
- Niente nome, matricola, URL del portale, HTML, cookie.

### 5.2 Contenuto del QR (proposta, si fissa nel P di F4)

Testo `KR1.<iv base64url>.<ct base64url>`: `ct` = AES-256-GCM di `JSON.stringify({ v: 1, giornate:
GiornataPortale[] })`, al più 7 giornate (le ultime, oggi compreso). Stima: ~7 × 120 byte di JSON → ~1,2 KB di
testo, QR versione ≤ 25 con correzione d'errore M. Se non entra, si riducono i giorni, mai la cifratura.
La chiave (passphrase o QR di abbinamento) si decide nel P di F4 (Q23).

Regole di accettazione in krumiro2.0: prefisso e versione noti; decifratura riuscita (altrimenti "QR non
riconosciuto: non è della tua outatime o la chiave è cambiata"); ogni giornata valida come in
`normalizzaGiornata`; `lettoIl` non più vecchio di quello dell'ultimo QR importato per la stessa data (un QR vecchio
non cancella timbrature più recenti).

## 6. Classificazione Entrata/Uscita → eventi krumiro2.0 (approvata: D15)

Funzione pura `classificaPortale(timbrature, impostazioni, oggi, adesso) → Evento[]` in krumiro2.0
(`src/core/portale.ts`). Le timbrature si ordinano per `minuti`; la sequenza attesa alterna E/U.

| Caso | Evento krumiro2.0 |
|---|---|
| prima `E` | `ENTRATA` |
| coppia intermedia `U`→`E`, nessuna pausa ancora assegnata, l'intervallo interseca la fascia pranzo | `INIZIO_PAUSA` → `FINE_PAUSA` |
| altra coppia intermedia `U`→`E` | `USCITA_PERMESSO` → `RIENTRO_PERMESSO` |
| ultima `U` | `USCITA` |
| ultima `U` di **oggi**, nella fascia pranzo, pausa non ancora fatta | `INIZIO_PAUSA` (provvisorio: alla prossima `E` diventa coppia pausa) |
| sequenza non alternata (due `E` di fila, ecc.) | si importano gli eventi come sono; krumiro2.0 segnala già la giornata **da correggere** |

Ogni evento importato ha `origine: 'portale'` (campo opzionale nuovo, nessun cambio di `VERSIONE_CORRENTE`,
come fu per `sigaretta`).

## 7. Unione con i dati inseriti a mano (approvata: D15)

Per ogni giornata ricevuta (da inserimento manuale in F3 o da QR in F5), `unisciPortale(giornataLocale, eventiPortale) → { giornata, sostituiti }`
(`src/core/portale.ts`), funzione pura:
1. Gli eventi locali con `origine: 'portale'` si tolgono (verranno ricreati: l'import è idempotente).
2. Ogni evento manuale si abbina all'evento del portale con lo stesso **verso** (E/U) più vicino entro
   **10 minuti**. Abbinato → resta l'orario del portale, ma si conservano **tipo e annotazioni** manuali
   (`sigaretta`, `pausaConfermata`, `USCITA_ANTICIPATA`): così "Pausa sigaretta" toccata alle 10:15 e timbrata
   alle 10:16 resta una sigaretta.
3. Gli eventi manuali non abbinati **si tolgono** e si contano in `sostituiti`; la giornata precedente si salva
   in `timbrature-portale-annulla` (localStorage, una sola giornata) e un toast offre **Annulla** per 10 s.
4. `permessoInizioMinuti` (permesso a inizio giornata) resta quello locale.

## 8. Dove sta il codice

| Repository | Cartella | Contenuto | Fase |
|---|---|---|---|
| `gcampa/krumiro2.0` | `src/core/calcolo.ts`, `src/core/tipi.ts`, `src/ui/impostazioni.ts` | regole di outatime | F2 |
| `gcampa/krumiro2.0` | `src/core/portale.ts`, `src/ui/portale.ts` | classificazione, unione, inserimento manuale | F3 |
| `gcampa/outatime` | `src/` | estensione MV3 in TypeScript, build Vite, test Vitest, parser, cifratura, QR | F4 |
| `gcampa/krumiro2.0` | `src/core/cifratura.ts`, `src/ui/leggiQr.ts` | decifratura, lettura QR | F5 |
| `gcampa/krumiro2.0` | `docs/` | documentazione unica (D16) | tutte |

Tipo `GiornataPortale` e cifratura esistono identici nei due repository con vettori di prova comuni (D14).
