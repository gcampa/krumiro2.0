# Immagini di permessi e vacanze

Stato: **requisiti approvati il 2026-10-03 (D35)**; i task si scrivono nel P di F5, quando F4 avrà fissato come le
vacanze e i permessi arrivano dai dati del portale. Stile e regole tecniche come la sigaretta e il boccale della
pausa caffè (F3).

## Dove compaiono (Q34)

| Posto | Permesso | Vacanza |
|---|---|---|
| Giornata (scheda principale) | animazione "valigetta in fuga" quando la giornata ha un permesso | animazione "atollo con il corvo" quando la giornata è di vacanza |
| Storico del mese | icona ferma della valigetta accanto al giorno | icona ferma dell'atollo accanto al giorno |

Nello storico solo icone ferme: tante animazioni insieme pesano sul telefono.

## Da dove arrivano i dati (Q35)

Vacanze e permessi arrivano **dai dati del portale** (JSON scaricati o timbrature), non si segnano a mano. Il modo in
cui il portale li descrive (diciture del cartellino, giustificativi) si fissa nel P di F4 con l'esempio
anonimizzato del JSON (Q33). Fino ad allora il permesso è quello che krumiro2.0 già conosce (uscita/rientro in
permesso, permesso a inizio giornata, uscita anticipata).

## Le due animazioni (Q36)

Disegni SVG originali, animati come la sigaretta e il boccale; markup statico senza dati dell'utente; leggibili in
tema chiaro e scuro; con "riduci movimento" restano fermi (regola globale di `src/style.css`).

### Permesso — valigetta in fuga
Una valigetta da ufficio marrone con la maniglia, due gambine nere che corrono e qualche sbuffo di polvere dietro:
attraversa la scena da sinistra a destra in circa 3 s, poi riparte. Icona dello storico: la valigetta ferma con le
gambine in posa di corsa.

### Vacanza — atollo con il corvo
Un piccolo atollo di sabbia con una palma, il mare con due onde che ondeggiano piano e un sole. Ogni tanto (circa
ogni 8 s) un **corvo nero** attraversa il cielo da destra a sinistra battendo le ali, con un fumetto **"Cra!"**.
Ispirato alla gag del corvo di *City Hunter*, ma **disegno originale**: niente personaggi, grafica o testi
dell'anime. Icona dello storico: l'atollo con la palma, senza corvo.

## Da decidere nel P di F5
- Dimensione dell'animazione nella scheda della giornata (sopra o accanto all'ora di levarsi).
- Se una giornata ha sia permesso sia vacanza (es. mezza giornata): quale immagine prevale.
- Colori esatti dai token del tema esistenti.
