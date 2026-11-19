// Passo FINTO (temporaneo, Fase 4) per vedere tutti i tipi di freccia sul campo.
// Usa le posizioni iniziali del Triangolo.
import type { Passo } from '../schema'

export const passoProvaFrecce: Passo = {
  id: 'prova-frecce',
  titolo: 'Prova frecce',
  testo:
    'Palleggio (blu ondulata), passaggio (verde tratteggiata), blocco (stanghetta finale), taglio curvo (bianca), hand-off (due stanghette).',
  azioni: [
    { tipo: 'palleggio', giocatore: 'A4', percorso: [[5.6, 10.6], [4.3, 9.2]], inizio: 0, durata: 1.5 },
    { tipo: 'spostamento', giocatore: 'D4', percorso: [[5.4, 8.4]], inizio: 0.1, durata: 1.4 },
    { tipo: 'blocco', giocatore: 'A5', percorso: [[11.4, 5.6]], inizio: 0, durata: 1.2 },
    { tipo: 'taglio', giocatore: 'A2', percorso: [[12.6, 4.4], [10.2, 2.0]], inizio: 1.2, durata: 1.6 },
    { tipo: 'taglio', giocatore: 'A3', percorso: [[1.6, 3.6], [3.4, 4.6]], inizio: 0, durata: 1.4 },
    { tipo: 'passaggio', da: 'A4', a: 'A1', inizio: 1.6, durata: 0.6 },
    { tipo: 'hand-off', da: 'A1', a: 'A3', inizio: 2.5, durata: 0.5 },
  ],
}
