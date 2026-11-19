// Stato del campo (solo dati, niente grafica). Coordinate in metri.

export type Squadra = 'att' | 'dif'

export interface Giocatore {
  id: string
  squadra: Squadra
  label: string
  x: number
  y: number
}

export interface Palla {
  /** id del giocatore che ha la palla, oppure null se la palla è libera sul campo */
  inMano: string | null
  /** posizione usata solo quando la palla è libera */
  x: number
  y: number
}

export interface StatoCampo {
  giocatori: Giocatore[]
  palla: Palla
}

/** Posizioni della pagina 1 del PDF "Triangolo" (misurate sull'immagine, arrotondate). */
export function statoIniziale(): StatoCampo {
  return {
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
    palla: { inMano: 'A4', x: 0, y: 0 },
  }
}
