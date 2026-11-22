import { describe, expect, it } from 'vitest'
import { durataPasso, statoFinePasso, statoDaSchema } from '../motore'
import type { Schema } from '../schema'
import { validaSchema } from '../valida'
import {
  aggiungiMovimento,
  aggiungiPassaggio,
  descriviAzione,
  durataMovimento,
  eInsieme,
  eliminaAzione,
  impostaInsieme,
  spostaPunto,
  type EsitoAzione,
} from './azioni'
import { nuovoSchema } from './modello'

const ok = (e: EsitoAzione) => {
  if (!e.ok) throw new Error(e.motivo)
  return e
}
const passo = (s: Schema) => s.passi[0]
const base = () => nuovoSchema('t', 'Test') // palla all'1, A1 in (7.5, 9.5)

describe('tempi automatici', () => {
  it('la durata cresce con la lunghezza, con un minimo e un massimo', () => {
    const corto = durataMovimento('taglio', [{ x: 0, y: 0 }, { x: 0.5, y: 0 }])
    const medio = durataMovimento('taglio', [{ x: 0, y: 0 }, { x: 8.4, y: 0 }])
    const lungo = durataMovimento('taglio', [{ x: 0, y: 0 }, { x: 40, y: 0 }])
    expect(corto).toBe(0.6)
    expect(medio).toBeCloseTo(2)
    expect(lungo).toBe(3.5)
  })

  it('"dopo": la seconda azione parte quando finisce la prima', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A2', [{ x: 10, y: 3 }], false)).schema
    s = ok(aggiungiMovimento(s, 'p1', 'taglio', 'A3', [{ x: 5, y: 3 }], false)).schema
    const [a, b] = passo(s).azioni
    expect(a.inizio).toBe(0)
    expect(b.inizio).toBeCloseTo(a.inizio + a.durata)
    expect(eInsieme(passo(s), 1)).toBe(false)
  })

  it('"insieme": la seconda azione parte con la prima', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A2', [{ x: 10, y: 3 }], false)).schema
    s = ok(aggiungiMovimento(s, 'p1', 'taglio', 'A3', [{ x: 5, y: 3 }], true)).schema
    expect(passo(s).azioni[1].inizio).toBe(0)
    expect(eInsieme(passo(s), 1)).toBe(true)
  })

  it('cambiare "insieme" su un’azione esistente', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A2', [{ x: 10, y: 3 }], false)).schema
    s = ok(aggiungiMovimento(s, 'p1', 'taglio', 'A3', [{ x: 5, y: 3 }], false)).schema
    s = impostaInsieme(s, 'p1', 1, true)
    expect(passo(s).azioni[1].inizio).toBe(0)
    s = impostaInsieme(s, 'p1', 1, false)
    expect(passo(s).azioni[1].inizio).toBeCloseTo(passo(s).azioni[0].durata)
  })
})

describe('palla', () => {
  it('passaggio solo da chi ha la palla', () => {
    const e = aggiungiPassaggio(base(), 'p1', 'passaggio', 'A2', 'A3', false)
    expect(e.ok).toBe(false)
    expect(!e.ok && e.motivo).toMatch(/non ha la palla/)
    const s = ok(aggiungiPassaggio(base(), 'p1', 'passaggio', 'A1', 'A2', false)).schema
    expect(statoFinePasso(statoDaSchema(s), passo(s)).palla.inMano).toBe('A2')
  })

  it('dopo un passaggio, palleggia chi ha ricevuto (non chi ha passato)', () => {
    const s = ok(aggiungiPassaggio(base(), 'p1', 'passaggio', 'A1', 'A2', false)).schema
    expect(aggiungiMovimento(s, 'p1', 'palleggio', 'A1', [{ x: 5, y: 9 }], false).ok).toBe(false)
    expect(aggiungiMovimento(s, 'p1', 'palleggio', 'A2', [{ x: 12, y: 8 }], false).ok).toBe(true)
  })

  it('il percorso parte da dove il giocatore è arrivato prima, nello stesso passo', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A1', [{ x: 7.5, y: 5.3 }], false)).schema
    s = ok(aggiungiMovimento(s, 'p1', 'taglio', 'A1', [{ x: 7.5, y: 1.1 }], false)).schema
    // secondo taglio: da y 5.3 a 1.1 = 4.2 m → 1 s
    expect(passo(s).azioni[1].durata).toBeCloseTo(1)
    expect(durataPasso(passo(s))).toBeCloseTo(passo(s).azioni[0].durata + 1)
  })
})

describe('modifiche', () => {
  it('spostare un punto ricalcola la durata', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A1', [{ x: 7.5, y: 8.5 }], false)).schema
    const prima = passo(s).azioni[0].durata
    s = spostaPunto(s, 'p1', 0, 0, { x: 7.5, y: 1.1234 })
    expect(passo(s).azioni[0]).toMatchObject({ percorso: [[7.5, 1.12]] })
    expect(passo(s).azioni[0].durata).toBeGreaterThan(prima)
  })

  it('elimina un’azione', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'taglio', 'A1', [{ x: 7, y: 5 }], false)).schema
    s = eliminaAzione(s, 'p1', 0)
    expect(passo(s).azioni).toHaveLength(0)
  })

  it('lo schema resta valido e le descrizioni sono leggibili', () => {
    let s = ok(aggiungiMovimento(base(), 'p1', 'blocco', 'A5', [{ x: 11, y: 5 }], false)).schema
    s = ok(aggiungiPassaggio(s, 'p1', 'hand-off', 'A1', 'A2', true)).schema
    s = ok(aggiungiMovimento(s, 'p1', 'spostamento', 'D2', [{ x: 11, y: 5.5 }], true)).schema
    expect(validaSchema(s).ok).toBe(true)
    expect(passo(s).azioni.map((a) => descriviAzione(s, a))).toEqual([
      'Blocco del 5',
      'Hand-off 1 → 2',
      'Spostamento di X2',
    ])
  })
})
