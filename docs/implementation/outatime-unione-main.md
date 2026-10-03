# outatime — riunire tutto in `main` (valutazione e procedura)

Stato: **proposta del 2026-10-03, da approvare (D22, Q29).** Lavoro fuori fase sul repository `gcampa/outatime`:
nessun codice nuovo, solo l'unione dei branch esistenti. Il merge in `main` lo fa l'utente (punto fisso 14).

## 1. Situazione (verificata il 2026-10-03)

| Ramo / tag | Ultimo commit | Contenuto | Note |
|---|---|---|---|
| `main` (predefinito) | `f655344` 2024-08-05 "git-tonic" | outatime 0.1: `background.js`, `manifest.json`, `.npmrc`, `.gitignore` | 1 solo commit non presente altrove: aggiunge `.npmrc` (`registry=https://registry.npmjs.org/`) e `.gitignore` (`node_modules`) |
| `firefox-support` | `be9d6b6` 2026-07-27 "versione 0.2.3" | outatime **0.2.3**: TypeScript, esbuild, Jest, CI, release, FILM, timetable viewer | 29 commit non in `main`; contiene i tag `v0.2.0`–`v0.2.3` |
| `feature/bun-firefox` | `108902e` 2024-07-29 | prototipo Bun abbandonato (`oldbun/`, `content.js` di prova) | `getMinimumAfternoonEnd` già presente, evoluta, in `src/lib.ts` di 0.2.3 |
| Release GitHub | `v0.2.3` del 2026-07-27 | zip Chrome e Firefox | ultima release pubblicata; costruita da `firefox-support` |

- Punto comune `main` / `firefox-support`: `397e8ec` (2024-02-21). I due rami sono **divergenti**: `main` non si
  può far avanzare in fast-forward.
- Pull request aperte su outatime: nessuna.
- Stato di `v0.2.3` controllato su una copia pulita: `npm ci` ok, `npm run typecheck` ok, `npm test` **41/41**
  (2 suite), `npm run build` ok, `npm audit --omit=dev` 0 vulnerabilità (Node 22; la CI usa Node 20).
- Prova di unione `firefox-support` + `main`: **un solo conflitto**, `.gitignore` (aggiunto da entrambe le parti);
  `.npmrc` entra senza conflitti.

Conseguenza: chi apre il repository (o clona il ramo predefinito) vede la 0.1, non la versione rilasciata.

## 2. Opzioni

| Opzione | Come | Storia | Tag e release | Valutazione |
|---|---|---|---|---|
| **A — PR `firefox-support` → `main` con commit di merge** *(raccomandata)* | branch di unione da `firefox-support`, merge di `main`, conflitto `.gitignore` risolto per unione delle righe, PR verso `main`, merge "Create a merge commit" | conservata intera | `v0.2.0`–`v0.2.3` diventano raggiungibili da `main`; nessun tag spostato | nessuna riscrittura, la CI gira sulla PR, il contenuto di `main` = 0.2.3 + `.npmrc` |
| B — Ripuntare `main` su `firefox-support` (force push) | `git push --force origin firefox-support:main` | perde `f655344` da `main` | invariati | riscrive il ramo predefinito; scartata |
| C — Cambiare il ramo predefinito in `firefox-support` | impostazione del repository | invariata | invariati | nome fuorviante, `main` resta vecchio; scartata |

## 3. Procedura dell'opzione A

Eseguibile da Claude su tua conferma (branch e PR in bozza); il merge lo fai tu.

1. `git switch -c chore/unione-main origin/firefox-support`
2. `git merge --no-ff origin/main -m "Unione di main in firefox-support: main allineato alla release 0.2.3"`
3. Risolvere `.gitignore` con l'unione delle righe, in quest'ordine:
   `node_modules`, `.amo-upload-uuid`, `web-ext-artifacts`, `dist`; tenere `.npmrc` come arriva da `main`.
4. Verifiche, tutte obbligatorie prima della PR:
   - `git diff v0.2.3 HEAD --stat` → solo `.npmrc` (1 riga aggiunta); `.gitignore` identico a `v0.2.3`.
   - `npm ci && npm run typecheck && npm test && npm run build` → 41/41, build ok.
   - `package.json` `version` = `0.2.3` (nessun cambio di versione: il contenuto rilasciato non cambia).
5. Push di `chore/unione-main`, PR verso `main` titolo `Allinea main alla release 0.2.3`; la CI (`ci.yml`, su
   `push` e `pull_request`) deve essere verde.
6. **Utente**: merge con "Create a merge commit" (non squash né rebase: i tag devono restare antenati di `main`).
7. **Utente**, dopo il merge:
   - verificare su GitHub che `main` mostri README e `src/` di 0.2.3;
   - eliminare `feature/bun-firefox` (prototipo superato; se vuoi conservarlo, prima un tag
     `archivio/bun-firefox` su `108902e`);
   - eliminare `firefox-support` (i tag conservano le release); da qui in poi si lavora solo da `main`.
8. Nessuna nuova release: il codice dell'estensione è identico a `v0.2.3`.

## 4. Impatto sul piano

- F4 (outatime con QR) parte da `main` aggiornato; il riferimento "v0.2.3 sul branch `firefox-support`" nei
  documenti diventa "`main` (= v0.2.3)" dopo il merge.
- F2 (gestione oraria in krumiro2.0) non dipende da questa unione: può partire prima o dopo.
- I 17 casi di `test/lib.spec.ts` restano la fonte dei casi di riferimento di F2.
