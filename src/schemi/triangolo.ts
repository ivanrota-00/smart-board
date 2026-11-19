// Schema "Triangolo" dal PDF di esempio (docs/esempi/Triangolo.pdf).
// Posizioni misurate sulle immagini del PDF e arrotondate (🟡 approssimate).
// Situazione iniziale → Decisione 1 → Scelta A (Step 1–3) oppure Scelta B (B1, B2 in due parti).
import { VERSIONE_SCHEMA, type Schema } from '../schema'

export const triangolo: Schema = {
  versione: VERSIONE_SCHEMA,
  id: 'triangolo',
  nome: 'Triangolo',
  tag: ['attacco', 'mezzo-campo'],
  campo: 'mezzo',
  premessa:
    'Non importa come si arriva in attacco, ma è necessario partire con il 4 in posizione di play (trasferimento in palleggio o hand off).',
  giocatori: [
    { id: 'A1', squadra: 'att', label: '1', x: 1.3, y: 7.0 },
    { id: 'A2', squadra: 'att', label: '2', x: 14.0, y: 6.75 },
    { id: 'A3', squadra: 'att', label: '3', x: 1.25, y: 1.3 },
    { id: 'A4', squadra: 'att', label: '4', x: 7.4, y: 9.6 },
    { id: 'A5', squadra: 'att', label: '5', x: 10.8, y: 3.9 },
    { id: 'D1', squadra: 'dif', label: 'X1', x: 3.6, y: 6.9 },
    { id: 'D2', squadra: 'dif', label: 'X2', x: 11.9, y: 6.4 },
    { id: 'D3', squadra: 'dif', label: 'X3', x: 3.4, y: 3.2 },
    { id: 'D4', squadra: 'dif', label: 'X4', x: 7.3, y: 7.1 },
    { id: 'D5', squadra: 'dif', label: 'X5', x: 9.5, y: 4.2 },
  ],
  palla: { inMano: 'A4' },
  passi: [
    {
      id: 'p1',
      titolo: 'Situazione iniziale',
      testo: '1) 4 passa a 2 e va in angolo. 2) 1 e 3 rimpiazzano le posizioni.',
      azioni: [
        { tipo: 'passaggio', da: 'A4', a: 'A2', inizio: 0, durata: 0.7 },
        { tipo: 'taglio', giocatore: 'A4', percorso: [[14.2, 1.2]], inizio: 0.7, durata: 1.6 },
        { tipo: 'spostamento', giocatore: 'D4', percorso: [[13.0, 2.6]], inizio: 0.8, durata: 1.6 },
        { tipo: 'taglio', giocatore: 'A1', percorso: [[7.3, 10.0]], inizio: 1.2, durata: 1.4 },
        { tipo: 'spostamento', giocatore: 'D1', percorso: [[7.3, 8.4]], inizio: 1.3, durata: 1.4 },
        { tipo: 'taglio', giocatore: 'A3', percorso: [[1.0, 3.8], [1.05, 6.4]], inizio: 1.2, durata: 1.4 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[2.6, 6.4]], inizio: 1.3, durata: 1.4 },
      ],
      domanda: 'Decisione 1: scegliere se passare la palla al 5 oppure riportarla verso 1.',
      scelte: [
        { etichetta: 'A: passa al 5', vaiA: 'pA1' },
        { etichetta: 'B: passa al 1', vaiA: 'pB1' },
      ],
    },
    {
      id: 'pA1',
      titolo: 'Scelta A — Step 1',
      testo: '2 passa al 5. Con palla sul 5, il 4 taglia per un back door mentre 3 si avvicina all’area.',
      prossimo: 'pA2',
      azioni: [
        { tipo: 'passaggio', da: 'A2', a: 'A5', inizio: 0, durata: 0.7 },
        { tipo: 'taglio', giocatore: 'A4', percorso: [[7.5, 1.0], [1.0, 1.1]], inizio: 0.6, durata: 2.0 },
        { tipo: 'spostamento', giocatore: 'D4', percorso: [[4.3, 2.0]], inizio: 0.8, durata: 2.0 },
        { tipo: 'taglio', giocatore: 'A3', percorso: [[4.5, 4.5]], inizio: 0.6, durata: 1.4 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[6.6, 4.5]], inizio: 0.7, durata: 1.4 },
        { tipo: 'spostamento', giocatore: 'D5', percorso: [[11.2, 2.6]], inizio: 0.3, durata: 1.0 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[12.1, 5.8]], inizio: 0.3, durata: 1.0 },
        { tipo: 'spostamento', giocatore: 'D1', percorso: [[9.0, 8.4]], inizio: 0.3, durata: 1.0 },
      ],
    },
    {
      id: 'pA2',
      titolo: 'Scelta A — Step 2',
      testo: '2 va a bloccare 3 ed esce sul lato opposto. 3 sfrutta il blocco ed esce sul lato opposto per giocare con il 5.',
      prossimo: 'pA3',
      azioni: [
        { tipo: 'blocco', giocatore: 'A2', percorso: [[11.0, 6.4], [7.2, 5.1]], inizio: 0, durata: 1.5 },
        { tipo: 'taglio', giocatore: 'A2', percorso: [[4.5, 6.0], [1.6, 6.4]], inizio: 1.8, durata: 1.6 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[5.1, 5.7]], inizio: 1.9, durata: 1.6 },
        { tipo: 'taglio', giocatore: 'A3', percorso: [[4.8, 5.3], [8.5, 5.4], [13.9, 3.8]], inizio: 1.4, durata: 2.0 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[7.4, 4.6], [12.4, 3.2]], inizio: 1.6, durata: 2.0 },
      ],
    },
    {
      id: 'pA3',
      titolo: 'Scelta A — Step 3',
      testo: '5 passa a 3. 3 può scegliere di giocare hand off con 2 oppure P&R con il 5.',
      azioni: [
        { tipo: 'passaggio', da: 'A5', a: 'A3', inizio: 0, durata: 0.7 },
        { tipo: 'palleggio', giocatore: 'A3', percorso: [[12.8, 5.0], [10.3, 5.9], [8.0, 5.2], [5.1, 3.4]], inizio: 0.8, durata: 2.6 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[12.0, 4.6], [9.6, 5.0], [6.3, 3.8]], inizio: 0.9, durata: 2.6 },
        { tipo: 'taglio', giocatore: 'A4', percorso: [[1.45, 5.3]], inizio: 0.5, durata: 1.4 },
        { tipo: 'spostamento', giocatore: 'D4', percorso: [[2.6, 4.4]], inizio: 0.6, durata: 1.4 },
        { tipo: 'taglio', giocatore: 'A2', percorso: [[5.2, 6.7], [9.0, 3.4]], inizio: 1.0, durata: 1.8 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[7.6, 5.0]], inizio: 1.1, durata: 1.8 },
      ],
    },
    // --- Scelta B ---
    // Nel PDF, B1 disegna anche il passaggio 1 → 3 sul back door, ma B2 riparte con la palla all'1:
    // per non rompere la continuità il passaggio è solo citato nel testo (🟡 da confermare con Ivan).
    {
      id: 'pB1',
      titolo: 'Scelta B — Step B1',
      testo: '2 passa a 1. 3 gioca back door con 1 (se è libero, 1 gli passa la palla).',
      prossimo: 'pB2a',
      azioni: [
        { tipo: 'passaggio', da: 'A2', a: 'A1', inizio: 0, durata: 0.8 },
        { tipo: 'taglio', giocatore: 'A3', percorso: [[2.9, 7.6], [4.4, 6.6], [5.7, 3.6]], inizio: 0.7, durata: 1.8 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[3.6, 7.0], [5.0, 4.4]], inizio: 0.8, durata: 1.8 },
        { tipo: 'spostamento', giocatore: 'D1', percorso: [[7.3, 7.8]], inizio: 0.4, durata: 0.8 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[12.1, 6.0]], inizio: 0.4, durata: 0.8 },
      ],
    },
    {
      id: 'pB2a',
      titolo: 'Scelta B — Step B2 (1ª parte)',
      testo: '1 si allarga in palleggio mentre 3 si sposta in angolo. 2 e 5 si preparano per lo stagger.',
      prossimo: 'pB2b',
      azioni: [
        { tipo: 'palleggio', giocatore: 'A1', percorso: [[5.6, 9.4], [3.6, 8.7]], inizio: 0, durata: 1.6 },
        { tipo: 'spostamento', giocatore: 'D1', percorso: [[4.6, 7.6]], inizio: 0.1, durata: 1.6 },
        { tipo: 'taglio', giocatore: 'A3', percorso: [[3.0, 2.5], [0.9, 1.0]], inizio: 0, durata: 1.8 },
        { tipo: 'spostamento', giocatore: 'D3', percorso: [[2.5, 2.1]], inizio: 0.2, durata: 1.8 },
        { tipo: 'blocco', giocatore: 'A5', percorso: [[10.4, 2.3]], inizio: 0.6, durata: 1.0 },
        { tipo: 'spostamento', giocatore: 'D5', percorso: [[9.5, 3.6]], inizio: 0.6, durata: 1.0 },
        { tipo: 'blocco', giocatore: 'A2', percorso: [[10.5, 4.8]], inizio: 0.6, durata: 1.2 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[11.3, 5.8]], inizio: 0.7, durata: 1.2 },
        { tipo: 'spostamento', giocatore: 'D4', percorso: [[11.9, 2.2]], inizio: 0.6, durata: 1.0 },
      ],
    },
    {
      id: 'pB2b',
      titolo: 'Scelta B — Step B2 (2ª parte)',
      testo: '2 e 5 montano lo stagger per il 4, che esce verso la palla e riceve da 1. 2 si allarga per un tiro.',
      azioni: [
        { tipo: 'taglio', giocatore: 'A4', percorso: [[11.0, 1.1], [10.9, 4.0], [9.0, 5.3], [7.1, 3.7]], inizio: 0, durata: 2.6 },
        { tipo: 'spostamento', giocatore: 'D4', percorso: [[11.6, 1.7], [10.0, 4.7], [7.9, 4.5]], inizio: 0.2, durata: 2.6 },
        { tipo: 'passaggio', da: 'A1', a: 'A4', inizio: 2.4, durata: 0.7 },
        { tipo: 'taglio', giocatore: 'A2', percorso: [[12.6, 7.1]], inizio: 1.8, durata: 1.2 },
        { tipo: 'spostamento', giocatore: 'D2', percorso: [[11.9, 6.4]], inizio: 1.9, durata: 1.2 },
      ],
    },
  ],
}
