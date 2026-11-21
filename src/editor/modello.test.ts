import { describe, expect, it } from 'vitest'
import triangoloJson from '../schemi/triangolo.json'
import type { Schema } from '../schema'
import { validaSchema } from '../valida'
import {
  aggiungiPasso,
  duplicaPasso,
  eliminaPasso,
  idDaNome,
  impostaPalla,
  modificaPasso,
  nuovoSchema,
  ordinePassi,
  spostaGiocatore,
  statoInizioDi,
  stradaVerso,
  type Esito,
} from './modello'
import { Storia } from './storia'

const triangolo = triangoloJson as unknown as Schema
const ok = (e: Esito) => {
  if (!e.ok) throw new Error(e.motivo)
  return e
}
const valido = (s: Schema) => {
  const r = validaSchema(s)
  return r.ok ? [] : r.errori
}

describe('nuovo schema', () => {
  it('è valido: 5 attaccanti, 5 difensori, palla all’1, un passo', () => {
    const s = nuovoSchema('prova', 'Prova')
    expect(valido(s)).toEqual([])
    expect(s.giocatori.filter((g) => g.squadra === 'att')).toHaveLength(5)
    expect(s.giocatori.filter((g) => g.squadra === 'dif')).toHaveLength(5)
    expect(s.palla.inMano).toBe('A1')
    expect(s.passi).toHaveLength(1)
  })

  it('i difensori stanno tra il loro uomo e il canestro', () => {
    const s = nuovoSchema('p', 'P')
    const a1 = s.giocatori.find((g) => g.id === 'A1')!
    const d1 = s.giocatori.find((g) => g.id === 'D1')!
    expect(d1.y).toBeLessThan(a1.y) // più vicino al canestro (y piccola)
  })
})

describe('passi', () => {
  it('aggiungi in fondo e in mezzo: la catena "prossimo" resta giusta', () => {
    let s = nuovoSchema('p', 'P')
    const a = ok(aggiungiPasso(s, 'p1'))
    s = a.schema
    const b = ok(aggiungiPasso(s, 'p1')) // in mezzo tra p1 e il precedente nuovo
    s = b.schema
    expect(ordinePassi(s).map((p) => p.id)).toEqual(['p1', b.id, a.id])
    expect(valido(s)).toEqual([])
  })

  it('non si aggiunge dopo un passo con scelta', () => {
    const e = aggiungiPasso(triangolo, 'p1')
    expect(e.ok).toBe(false)
  })

  it('duplica: copia le azioni e si inserisce subito dopo', () => {
    const e = ok(duplicaPasso(triangolo, 'pA1'))
    const ordine = ordinePassi(e.schema).map((p) => p.id)
    expect(ordine.indexOf(e.id)).toBe(ordine.indexOf('pA1') + 1)
    const orig = triangolo.passi.find((p) => p.id === 'pA1')!
    const doppio = e.schema.passi.find((p) => p.id === e.id)!
    expect(doppio.azioni).toEqual(orig.azioni)
    expect(doppio.prossimo).toBe('pA2')
    expect(valido(e.schema)).toEqual([])
  })

  it('elimina in mezzo: chi puntava al passo ora punta al successivo', () => {
    const e = ok(eliminaPasso(triangolo, 'pA2'))
    expect(e.schema.passi.find((p) => p.id === 'pA1')!.prossimo).toBe('pA3')
    expect(valido(e.schema)).toEqual([])
  })

  it('elimina l’ultimo: il precedente non ha più "prossimo"', () => {
    const e = ok(eliminaPasso(triangolo, 'pA3'))
    expect(e.schema.passi.find((p) => p.id === 'pA2')!.prossimo).toBeUndefined()
    expect(valido(e.schema)).toEqual([])
  })

  it('elimina il primo: la fine del primo diventa la situazione iniziale', () => {
    let s = nuovoSchema('p', 'P')
    s = { ...s, passi: [{ ...s.passi[0], azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[5, 5]], inizio: 0, durata: 1 }] }] }
    s = ok(aggiungiPasso(s, 'p1')).schema
    const e = ok(eliminaPasso(s, 'p1'))
    expect(e.schema.passi).toHaveLength(1)
    expect(e.schema.giocatori.find((g) => g.id === 'A1')).toMatchObject({ x: 5, y: 5 })
    expect(valido(e.schema)).toEqual([])
  })

  it('non elimina: unico passo, passo con scelta, inizio di un ramo', () => {
    expect(eliminaPasso(nuovoSchema('p', 'P'), 'p1').ok).toBe(false)
    expect(eliminaPasso(triangolo, 'p1').ok).toBe(false)
    expect(eliminaPasso(triangolo, 'pA1').ok).toBe(false)
  })

  it('modifica titolo e testo', () => {
    const s = modificaPasso(triangolo, 'pA1', { titolo: 'Nuovo', testo: 'Ciao' })
    expect(s.passi.find((p) => p.id === 'pA1')).toMatchObject({ titolo: 'Nuovo', testo: 'Ciao' })
    expect(triangolo.passi.find((p) => p.id === 'pA1')!.titolo).not.toBe('Nuovo') // originale intatto
  })
})

describe('posizioni e percorso', () => {
  it('sposta un giocatore e la palla nella situazione iniziale', () => {
    let s = spostaGiocatore(nuovoSchema('p', 'P'), 'A3', { x: 3.333, y: 4.444 })
    s = impostaPalla(s, 'A3')
    expect(s.giocatori.find((g) => g.id === 'A3')).toMatchObject({ x: 3.33, y: 4.44 })
    expect(s.palla.inMano).toBe('A3')
  })

  it('strada e stato all’inizio di un passo dentro un ramo', () => {
    expect(stradaVerso(triangolo, 'pB2a').map((p) => p.id)).toEqual(['p1', 'pB1', 'pB2a'])
    const st = statoInizioDi(triangolo, 'pA1')
    expect(st.palla.inMano).toBe('A2') // il 4 ha passato al 2 nel primo passo
  })

  it('ordine di lettura del Triangolo', () => {
    expect(ordinePassi(triangolo).map((p) => p.id)).toEqual(['p1', 'pA1', 'pA2', 'pA3', 'pB1', 'pB1L', 'pB2a', 'pB2b'])
  })

  it('id dal nome, senza doppioni', () => {
    const occupati = new Set(['uscita-da-time-out'])
    expect(idDaNome('Uscità da time-out!', (id) => occupati.has(id))).toBe('uscita-da-time-out-2')
  })
})

describe('annulla / ripeti', () => {
  it('torna indietro e avanti tra le versioni', () => {
    const st = new Storia<{ n: number }>()
    let v = { n: 1 }
    st.registra(v)
    v = { n: 2 }
    st.registra(v)
    v = { n: 3 }
    v = st.annulla(v)!
    expect(v.n).toBe(2)
    v = st.annulla(v)!
    expect(v.n).toBe(1)
    expect(st.puoAnnullare).toBe(false)
    v = st.ripeti(v)!
    expect(v.n).toBe(2)
    st.registra(v) // una modifica nuova cancella il "ripeti"
    expect(st.puoRipetere).toBe(false)
  })
})
