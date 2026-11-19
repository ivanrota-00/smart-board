// Schema "Triangolo" dal PDF di esempio (docs/esempi/Triangolo.pdf).
// Posizioni misurate sulle immagini del PDF e arrotondate (🟡 approssimate).
// Per ora solo il primo passo (Fase 3); gli altri arrivano con le Fasi 5–6.
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
      scelte: [
        { etichetta: 'A: passa al 5', vaiA: 'pA1' },
        { etichetta: 'B: passa al 1', vaiA: 'pB1' },
      ],
    },
  ],
}
