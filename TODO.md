# TODO — Smart Board

Compiti pratici. Il piano completo è nel README (§7).

## Da fare ora
- [ ] Ivan: attivare l'autenticazione a due fattori su GitHub (se non c'è già)
- [x] Fase 8 — test in palestra: successo (21/11/2026). Richiesta: versione per telefono (Android + iPhone)

## Pubblicazione + PWA
- [x] Manifest, icone, service worker per l'offline
- [x] Repository pubblico su GitHub + GitHub Pages con pubblicazione automatica
- [x] Controllo di sicurezza prima di pubblicare
- [x] Installata da Ivan sull'iPad, funziona offline (20/11/2026)
- [ ] Aggiornare le versioni delle azioni GitHub (avviso: Node 20 deprecato) — non urgente

## Fase 7 — Libreria + salvataggio + import/export
- [x] Salvataggio locale (schemi, ultimo schema, velocità) con test
- [x] Controllo dei file importati con messaggi chiari, con test
- [x] Schermata Libreria: apri, importa, esporta, elimina, backup
- [x] File di prova `docs/esempi/dai-e-vai.json`
- [x] Provata da Ivan su iPad: tutto ok (20/11/2026)
- [ ] Ivan: dare un'occhiata alla Decisione 2 (fine B1) sull'iPad

## Fase 6 — Scelte A/B
- [x] Player: decisione, scegli, ritorno alla decisione (7 test)
- [x] Bottoni delle scelte nel pannello + domanda
- [x] Triangolo: Scelta B (B1, B2 in due parti)
- [x] Provata da Ivan su iPad: tutto ok (19/11/2026)
- [x] Decisione 2 a fine B1: back door libero / chiuso

## Fase 5 — Player
- [x] Logica del player con 9 test (play/pausa, avanti/indietro, velocità, fine schema)
- [x] Comandi grandi nel pannello, testi del passo, premessa, barra di avanzamento
- [x] Triangolo: Scelta A (Step 1–3) trascritta dal PDF
- [x] Tolti i pulsanti di prova delle Fasi 3–4
- [x] Provata da Ivan su iPad: tutto ok (19/11/2026)

## Fase 4 — Frecce e tipi di azione
- [x] Percorsi curvi (motore + disegno), con test
- [x] 5 frecce: taglio, passaggio, palleggio, blocco, hand-off
- [x] Pulsante temporaneo "Prova frecce" (da togliere in Fase 5)
- [x] Provata da Ivan su iPad: tutto ok (19/11/2026)

## Fase 3 — Modello dati + motore di animazione
- [x] Vitest installato, `npm test`
- [x] Tipi dello schema (con `versione`) e motore (`statoAlTempo`, `statoFinePasso`)
- [x] 14 test sul motore
- [x] Passo 1 del Triangolo + pulsanti di prova (temporanei, sostituiti in Fase 5)
- [x] Provata da Ivan su iPad: funziona (19/11/2026)

## Fase 2 — Campo SVG + giocatori trascinabili
- [x] Campo FIBA in SVG, coordinate in metri, con pezzo oltre la metà campo
- [x] 5 attaccanti + 5 difensori + palla (posizioni pagina 1 del PDF)
- [x] Trascinamento col dito, multi-tocco, giocatore sollevato sopra il dito
- [x] Provata da Ivan su iPad: funziona tutto (19/11/2026)

## Da verificare più avanti (🟡)
- [ ] Freccia "blocco": usata la stanghetta finale standard; confermare che sia come nel PDF

## Fatto
- [x] Pagina verificata da Ivan su Mac e iPad (19/11/2026)
- [x] Fase 1: setup Vite + TypeScript, git, CLAUDE.md, pagina base (19/11/2026)
