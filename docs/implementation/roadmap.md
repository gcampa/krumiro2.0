# Roadmap

Ogni fase si chiude con i propri criteri di uscita e una revisione obbligatoria. Metodo in
[gestione-fasi.md](gestione-fasi.md); avanzamento in [progress.md](progress.md). Fasi **proposte**: diventano
definitive con R-F0. F2–F4 dipendono da Q16 (A: Firebase; B: QR offline, senza Firebase).

```mermaid
flowchart LR
    F00[Fino a 1.5.0<br/>chiusa ✓] --> F0[F0<br/>Pianificazione] --> F1[F1<br/>Design leggero] --> F2[F2<br/>Fondamenta]
    F2 --> F3[F3<br/>outatime scrive] --> F4[F4<br/>krumiro legge] --> F6[F6<br/>Consolidamento]
```

| Fase | Contenuto | Uscita | Piano | Stato |
|---|---|---|---|---|
| Fino a 1.5.0 | calcolo, PWA, aiuto, tema, banner, pausa sigaretta | 92 test verdi, in `main` | `docs/superpowers/` | chiusa prima dell'adozione |
| F0 Pianificazione | architettura, sicurezza, decisioni, contratto dati, fasi | documenti approvati, Domande aperte chiuse | — | in corso: plenaria 2026-10-03, 6 domande chiuse, Q16 bloccante |
| F1 Design leggero | Impostazioni → Sincronizzazione, etichetta "portale", toast Annulla, popup estensione | `pages-and-widgets.md` approvato | — | da fare |
| F2 Fondamenta | progetto Firebase (manuale), `firebase/` con regole + test emulatore + CI, outatime 1.0 TS/Vite/Vitest/CI, modulo cifratura + vettori, login/logout Google in PWA e popup | regole testate in CI; login → logout da PWA e popup | F2-fondamenta.md | da fare |
| F3 outatime scrive | parser del cartellino, content script automatico, passphrase, cifratura, scrittura solo dei cambiamenti, stato nel popup | cartellino aperto → documenti cifrati in Firestore; riapertura → 0 scritture | F3-outatime-scrive.md | da fare |
| F4 krumiro2.0 legge | decifratura, classificazione, unione, `onSnapshot`, etichetta "portale", Annulla | portale aperto → krumiro2.0 aggiornato entro 10 s | F4-krumiro-legge.md | da fare |
| ~~F5 Notifiche~~ | — | — | — | scartata il 2026-10-03 (D18) |
| F6 Consolidamento | revisione di sicurezza, Disconnetti/Cancella, CSP, Aiuto/README, distribuzione estensione, E2E | revisione di sicurezza superata | F6-consolidamento.md | da fare |

| Milestone | Fasi | Risultato |
|---|---|---|
| M0 | F0–F1 | Piano e design approvati |
| M1 | F2–F4 | Sincronizzazione sicura portale → krumiro2.0, senza notifiche (già utilizzabile) |
| M2 | F6 | Revisione di sicurezza: pronto all'uso quotidiano |
