// Geometria pura (senza grafica): curve, lunghezze, accorciamenti, onde. Tutto in metri.
import type { Punto } from './coordinate'

/** Lunghezza totale di una spezzata. */
export function lunghezza(punti: Punto[]): number {
  let l = 0
  for (let i = 1; i < punti.length; i++) {
    l += Math.hypot(punti[i].x - punti[i - 1].x, punti[i].y - punti[i - 1].y)
  }
  return l
}

/**
 * Curva morbida che passa per TUTTI i punti (Catmull-Rom), restituita come spezzata fitta.
 * Con 2 punti è una linea dritta. La usano sia il motore (movimento) sia le frecce (disegno),
 * così il giocatore segue esattamente la linea disegnata.
 */
export function campionaCurva(punti: Punto[], passiPerTratto = 16): Punto[] {
  if (punti.length < 3) return punti.map((p) => ({ ...p }))
  const out: Punto[] = [{ ...punti[0] }]
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[i - 1] ?? punti[i]
    const p1 = punti[i]
    const p2 = punti[i + 1]
    const p3 = punti[i + 2] ?? punti[i + 1]
    for (let s = 1; s <= passiPerTratto; s++) {
      const t = s / passiPerTratto
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) })
    }
  }
  return out
}

/** Punto e direzione (vettore unitario) a una certa distanza dall'inizio della spezzata. */
export function puntoADistanza(punti: Punto[], distanza: number): { p: Punto; dir: Punto } {
  let resto = Math.max(0, distanza)
  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1]
    const b = punti[i]
    const l = Math.hypot(b.x - a.x, b.y - a.y)
    if (l === 0) continue
    const dir = { x: (b.x - a.x) / l, y: (b.y - a.y) / l }
    if (resto <= l || i === punti.length - 1) {
      const f = Math.min(1, resto / l)
      return { p: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, dir }
    }
    resto -= l
  }
  const ultimo = punti[punti.length - 1] ?? { x: 0, y: 0 }
  return { p: { ...ultimo }, dir: { x: 1, y: 0 } }
}

/** Taglia la spezzata: toglie `inizio` metri all'inizio e `fine` metri alla fine. */
export function accorcia(punti: Punto[], inizio: number, fine: number): Punto[] {
  const tot = lunghezza(punti)
  const da = Math.min(inizio, tot)
  const a = Math.max(da, tot - fine)
  if (a - da <= 0) return []
  const out: Punto[] = [puntoADistanza(punti, da).p]
  let percorsa = 0
  for (let i = 1; i < punti.length; i++) {
    percorsa += Math.hypot(punti[i].x - punti[i - 1].x, punti[i].y - punti[i - 1].y)
    if (percorsa > da && percorsa < a) out.push({ ...punti[i] })
  }
  out.push(puntoADistanza(punti, a).p)
  return out
}

/**
 * Linea ondulata lungo la spezzata (per il palleggio).
 * `ampiezza` e `lunghezzaOnda` in metri; l'onda parte e finisce sulla linea.
 */
export function ondula(punti: Punto[], ampiezza: number, lunghezzaOnda: number): Punto[] {
  const tot = lunghezza(punti)
  if (tot === 0) return punti.map((p) => ({ ...p }))
  const onde = Math.max(1, Math.round(tot / lunghezzaOnda))
  const passi = onde * 12
  const out: Punto[] = []
  for (let i = 0; i <= passi; i++) {
    const d = (i / passi) * tot
    const { p, dir } = puntoADistanza(punti, d)
    const scarto = ampiezza * Math.sin((i / passi) * onde * 2 * Math.PI)
    out.push({ x: p.x - dir.y * scarto, y: p.y + dir.x * scarto })
  }
  return out
}
