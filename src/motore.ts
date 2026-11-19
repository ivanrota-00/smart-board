// Motore di animazione: funzioni "pure" (stessi dati → stesso risultato), senza grafica.
// Domanda a cui risponde: "dove sono giocatori e palla al secondo t di un passo?"
import type { Punto } from './coordinate'
import { campionaCurva } from './geometria'
import { eMovimento, type AzioneMovimento, type AzionePalla, type Passo, type Schema } from './schema'
import { PALLA_IN_MANO, type StatoCampo } from './stato'

/** Partenza e arrivo morbidi (0 → 0, 1 → 1). */
export function morbido(p: number): number {
  return p * p * (3 - 2 * p)
}

function limita01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Punto a una certa frazione (0–1) della lunghezza di una spezzata. */
export function puntoSuPercorso(punti: Punto[], frazione: number): Punto {
  if (punti.length === 0) return { x: 0, y: 0 }
  if (punti.length === 1) return { ...punti[0] }
  const tratti: number[] = []
  let totale = 0
  for (let i = 1; i < punti.length; i++) {
    const l = Math.hypot(punti[i].x - punti[i - 1].x, punti[i].y - punti[i - 1].y)
    tratti.push(l)
    totale += l
  }
  if (totale === 0) return { ...punti[0] }
  let resto = limita01(frazione) * totale
  for (let i = 0; i < tratti.length; i++) {
    if (resto <= tratti[i] || i === tratti.length - 1) {
      const f = tratti[i] === 0 ? 1 : Math.min(1, resto / tratti[i])
      const a = punti[i]
      const b = punti[i + 1]
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    resto -= tratti[i]
  }
  return { ...punti[punti.length - 1] }
}

/** Durata totale di un passo in secondi (fine dell'ultima azione). */
export function durataPasso(passo: Passo): number {
  return passo.azioni.reduce((max, a) => Math.max(max, a.inizio + a.durata), 0)
}

/** Posizione di un giocatore al tempo t, partendo dalla sua posizione a inizio passo. */
function posizioneGiocatore(partenza: Punto, movimenti: AzioneMovimento[], t: number): Punto {
  let pos = { ...partenza }
  for (const m of movimenti) {
    if (t <= m.inizio) break
    const punti = campionaCurva([pos, ...m.percorso.map(([x, y]) => ({ x, y }))])
    const avanzamento = m.durata > 0 ? limita01((t - m.inizio) / m.durata) : 1
    pos = puntoSuPercorso(punti, morbido(avanzamento))
    if (avanzamento < 1) break
  }
  return pos
}

/** Posizione di un giocatore al tempo t del passo (partendo dallo stato `inizio`). */
export function posizioneAlTempo(inizio: StatoCampo, passo: Passo, id: string, t: number): Punto {
  const g = inizio.giocatori.find((x) => x.id === id)
  if (!g) return { x: 0, y: 0 }
  const movimenti = passo.azioni
    .filter(eMovimento)
    .filter((a) => a.giocatore === id)
    .sort((a, b) => a.inizio - b.inizio)
  return posizioneGiocatore({ x: g.x, y: g.y }, movimenti, t)
}

/** Stato completo del campo al secondo t del passo. Non modifica `inizio`. */
export function statoAlTempo(inizio: StatoCampo, passo: Passo, t: number): StatoCampo {
  const posAl = (id: string, tempo: number) => posizioneAlTempo(inizio, passo, id, tempo)

  const giocatori = inizio.giocatori.map((g) => ({ ...g, ...posAl(g.id, t) }))

  // Palla: si applicano in ordine i passaggi già iniziati
  let palla = { ...inizio.palla }
  const passaggi = passo.azioni
    .filter((a): a is AzionePalla => !eMovimento(a))
    .sort((a, b) => a.inizio - b.inizio)
  for (const p of passaggi) {
    if (t <= p.inizio) break
    if (p.durata <= 0 || t >= p.inizio + p.durata) {
      palla = { inMano: p.a, x: palla.x, y: palla.y }
      continue
    }
    // In volo: dalla mano di chi passa (a inizio passaggio) alla mano di chi riceve (all'arrivo)
    const da = posAl(p.da, p.inizio)
    const a = posAl(p.a, p.inizio + p.durata)
    const f = (t - p.inizio) / p.durata
    palla = {
      inMano: null,
      x: da.x + PALLA_IN_MANO.x + (a.x - da.x) * f,
      y: da.y + PALLA_IN_MANO.y + (a.y - da.y) * f,
    }
    break
  }

  return { giocatori, palla }
}

/** Stato a fine passo = punto di partenza del passo dopo (si calcola, non si salva). */
export function statoFinePasso(inizio: StatoCampo, passo: Passo): StatoCampo {
  return statoAlTempo(inizio, passo, durataPasso(passo))
}

/** Stato di partenza di uno schema. */
export function statoDaSchema(schema: Schema): StatoCampo {
  return {
    giocatori: schema.giocatori.map((g) => ({ ...g })),
    palla: { inMano: schema.palla.inMano, x: 0, y: 0 },
  }
}
