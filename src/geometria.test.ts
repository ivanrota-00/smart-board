import { describe, expect, it } from 'vitest'
import { accorcia, campionaCurva, lunghezza, ondula, puntoADistanza } from './geometria'
import { posizioneAlTempo } from './motore'
import type { Passo } from './schema'
import type { StatoCampo } from './stato'

const vicino = (a: { x: number; y: number }, b: { x: number; y: number }, tol = 1e-6) =>
  Math.hypot(a.x - b.x, a.y - b.y) < tol

describe('curva morbida', () => {
  it('con 2 punti resta una linea dritta', () => {
    expect(campionaCurva([{ x: 0, y: 0 }, { x: 4, y: 0 }])).toEqual([{ x: 0, y: 0 }, { x: 4, y: 0 }])
  })

  it('passa per tutti i punti dati', () => {
    const punti = [{ x: 0, y: 0 }, { x: 3, y: 2 }, { x: 6, y: 0 }, { x: 8, y: 3 }]
    const curva = campionaCurva(punti, 10)
    for (const p of punti) expect(curva.some((c) => vicino(c, p))).toBe(true)
    expect(vicino(curva[0], punti[0])).toBe(true)
    expect(vicino(curva[curva.length - 1], punti[3])).toBe(true)
  })

  it('il motore segue la curva: a fine azione il giocatore è sull’ultimo punto', () => {
    const inizio: StatoCampo = {
      giocatori: [{ id: 'A1', squadra: 'att', label: '1', x: 0, y: 0 }],
      palla: { inMano: null, x: 0, y: 0 },
    }
    const passo: Passo = {
      id: 'p',
      titolo: '',
      testo: '',
      azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[3, 2], [6, 0]], inizio: 0, durata: 1 }],
    }
    expect(vicino(posizioneAlTempo(inizio, passo, 'A1', 1), { x: 6, y: 0 })).toBe(true)
    // a metà del tempo (partenza/arrivo morbidi = metà strada) passa per il punto centrale
    expect(vicino(posizioneAlTempo(inizio, passo, 'A1', 0.5), { x: 3, y: 2 }, 0.05)).toBe(true)
  })
})

describe('strumenti per le frecce', () => {
  const linea = [{ x: 0, y: 0 }, { x: 10, y: 0 }]

  it('lunghezza', () => {
    expect(lunghezza([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5)
  })

  it('puntoADistanza dà punto e direzione', () => {
    const { p, dir } = puntoADistanza(linea, 2.5)
    expect(p).toEqual({ x: 2.5, y: 0 })
    expect(dir).toEqual({ x: 1, y: 0 })
  })

  it('accorcia toglie i metri richiesti alle due estremità', () => {
    const c = accorcia(linea, 1, 2)
    expect(c[0]).toEqual({ x: 1, y: 0 })
    expect(c[c.length - 1]).toEqual({ x: 8, y: 0 })
  })

  it('accorcia una linea troppo corta → vuota', () => {
    expect(accorcia(linea, 6, 6)).toEqual([])
  })

  it('ondula: parte e finisce sulla linea, oscilla al massimo di ±ampiezza', () => {
    const onda = ondula(linea, 0.2, 1)
    expect(vicino(onda[0], { x: 0, y: 0 })).toBe(true)
    expect(vicino(onda[onda.length - 1], { x: 10, y: 0 })).toBe(true)
    expect(Math.max(...onda.map((p) => Math.abs(p.y)))).toBeCloseTo(0.2, 2)
  })
})
