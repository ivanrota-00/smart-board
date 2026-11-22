import { describe, expect, it } from 'vitest'
import { Player } from '../player'
import triangoloJson from '../schemi/triangolo.json'
import type { Schema } from '../schema'
import { validaSchema } from '../valida'
import { aggiungiPasso, nuovoSchema, ordinePassi, type Esito } from './modello'
import { aggiungiOpzione, aggiungiScelta, eliminaScelta, modificaScelta, ramiDeiPassi, specchiaSchema, togliScelta } from './scelte'

const triangolo = triangoloJson as unknown as Schema
const ok = (e: Esito) => {
  if (!e.ok) throw new Error(e.motivo)
  return e.schema
}
const valido = (s: Schema) => {
  const r = validaSchema(s)
  return r.ok ? [] : r.errori
}
const passo = (s: Schema, id: string) => s.passi.find((p) => p.id === id)!

describe('scelte', () => {
  it('su un passo senza seguito: crea due rami vuoti A e B', () => {
    const s = ok(aggiungiScelta(nuovoSchema('t', 'T'), 'p1'))
    const p1 = passo(s, 'p1')
    expect(p1.scelte?.map((x) => x.etichetta)).toEqual(['A', 'B'])
    expect(p1.prossimo).toBeUndefined()
    expect(s.passi).toHaveLength(3)
    expect(valido(s)).toEqual([])
  })

  it('su un passo con seguito: il seguito diventa il ramo A', () => {
    let s = ok(aggiungiPasso(nuovoSchema('t', 'T'), 'p1'))
    const seguito = passo(s, 'p1').prossimo!
    s = ok(aggiungiScelta(s, 'p1'))
    expect(passo(s, 'p1').scelte![0].vaiA).toBe(seguito)
    expect(valido(s)).toEqual([])
  })

  it('il player si ferma alla decisione e segue il ramo scelto', () => {
    const s = ok(aggiungiScelta(nuovoSchema('t', 'T'), 'p1'))
    const pl = new Player(s)
    pl.avanti()
    expect(pl.inDecisione).toBe(true)
    pl.scegli(1)
    expect(pl.passo.titolo).toBe('Ramo B — passo 1')
  })

  it('aggiungi opzione C, rinomina, massimo 4', () => {
    let s = ok(aggiungiScelta(nuovoSchema('t', 'T'), 'p1'))
    s = ok(aggiungiOpzione(s, 'p1'))
    s = modificaScelta(s, 'p1', 2, 'C: tiro')
    expect(passo(s, 'p1').scelte!.map((x) => x.etichetta)).toEqual(['A', 'B', 'C: tiro'])
    s = ok(aggiungiOpzione(s, 'p1'))
    expect(aggiungiOpzione(s, 'p1').ok).toBe(false)
  })

  it('elimina un’opzione: sparisce anche il suo ramo; con una sola rimasta torna un seguito normale', () => {
    let s = ok(aggiungiScelta(nuovoSchema('t', 'T'), 'p1'))
    const ramoA = passo(s, 'p1').scelte![0].vaiA
    s = ok(eliminaScelta(s, 'p1', 1))
    expect(passo(s, 'p1').scelte).toBeUndefined()
    expect(passo(s, 'p1').prossimo).toBe(ramoA)
    expect(s.passi).toHaveLength(2)
    expect(valido(s)).toEqual([])
  })

  it('nel Triangolo: togliere la scelta B elimina tutti i passi del ramo B', () => {
    const s = ok(eliminaScelta(triangolo, 'p1', 1))
    expect(ordinePassi(s).map((p) => p.id)).toEqual(['p1', 'pA1', 'pA2', 'pA3'])
    expect(valido(s)).toEqual([])
  })

  it('togli del tutto la decisione', () => {
    const s = ok(togliScelta(triangolo, 'p1'))
    expect(s.passi.map((p) => p.id)).toEqual(['p1'])
    expect(valido(s)).toEqual([])
  })

  it('rami dei passi per l’elenco', () => {
    const r = ramiDeiPassi(triangolo)
    expect(r.get('p1')).toBe('')
    expect(r.get('pA2')).toBe('A')
    expect(r.get('pB2a')).toBe('B › Chiuso')
    expect(r.get('pB1L')).toBe('B › Libero')
  })
})

describe('specchia', () => {
  it('x diventa 15 − x per giocatori e percorsi; due volte = originale', () => {
    const s = specchiaSchema(triangolo)
    expect(s.giocatori.find((g) => g.id === 'A2')!.x).toBeCloseTo(15 - 14)
    const taglio = passo(s, 'p1').azioni.find((a) => a.tipo === 'taglio')!
    expect('percorso' in taglio && taglio.percorso[0][0]).toBeCloseTo(15 - 14.2)
    expect(specchiaSchema(s)).toEqual(triangolo)
    expect(valido(s)).toEqual([])
  })
})
