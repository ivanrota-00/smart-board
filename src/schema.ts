// Modello dati di uno schema (vedi README §5). Uno Schema è un grafo di Passi.
import type { Giocatore } from './stato'

/** Cambia questo numero quando il formato cambia, così i file vecchi si possono migrare. */
export const VERSIONE_SCHEMA = 1

/** Punto in metri: [x, y] */
export type PuntoXY = [number, number]

/** Un giocatore segue un percorso (lista di punti, la partenza è dove si trova). */
export interface AzioneMovimento {
  /** taglio/palleggio/blocco = frecce del PDF; spostamento = movimento senza freccia (es. difensori) */
  tipo: 'taglio' | 'palleggio' | 'blocco' | 'spostamento'
  giocatore: string
  percorso: PuntoXY[]
  /** secondi dall'inizio del passo */
  inizio: number
  durata: number
}

/** La palla va da un giocatore a un altro. */
export interface AzionePalla {
  tipo: 'passaggio' | 'hand-off'
  da: string
  a: string
  inizio: number
  durata: number
}

export type Azione = AzioneMovimento | AzionePalla

export interface Scelta {
  etichetta: string
  vaiA: string
}

export interface Passo {
  id: string
  titolo: string
  testo: string
  azioni: Azione[]
  /** Se presenti, l'app si ferma e mostra i bottoni (Fase 6). */
  scelte?: Scelta[]
}

export interface Schema {
  versione: number
  id: string
  nome: string
  tag: string[]
  campo: 'mezzo'
  premessa?: string
  giocatori: Giocatore[]
  palla: { inMano: string | null }
  passi: Passo[]
}

export function eMovimento(a: Azione): a is AzioneMovimento {
  return a.tipo === 'taglio' || a.tipo === 'palleggio' || a.tipo === 'blocco' || a.tipo === 'spostamento'
}
