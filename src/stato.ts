// Stato del campo in un istante (solo dati, niente grafica). Coordinate in metri.

export type Squadra = 'att' | 'dif'

export interface Giocatore {
  id: string
  squadra: Squadra
  label: string
  x: number
  y: number
}

export interface Palla {
  /** id del giocatore che ha la palla, oppure null se la palla è libera o in volo */
  inMano: string | null
  /** posizione usata solo quando la palla non è in mano a nessuno */
  x: number
  y: number
}

export interface StatoCampo {
  giocatori: Giocatore[]
  palla: Palla
}

/** Dove si disegna la palla rispetto al centro di chi la ha (in basso a destra, come nel PDF). */
export const PALLA_IN_MANO = { x: 0.42, y: 0.42 } as const

/** Copia indipendente di uno stato (per non modificare l'originale). */
export function copiaStato(s: StatoCampo): StatoCampo {
  return { giocatori: s.giocatori.map((g) => ({ ...g })), palla: { ...s.palla } }
}
