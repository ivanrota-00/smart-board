import { describe, expect, it } from 'vitest'
import {
  durataPasso,
  morbido,
  puntoSuPercorso,
  statoAlTempo,
  statoFinePasso,
} from './motore'
import type { Passo } from './schema'
import { PALLA_IN_MANO, type StatoCampo } from './stato'

const inizio: StatoCampo = {
  giocatori: [
    { id: 'A1', squadra: 'att', label: '1', x: 0, y: 0 },
    { id: 'A2', squadra: 'att', label: '2', x: 10, y: 0 },
  ],
  palla: { inMano: 'A1', x: 0, y: 0 },
}

const taglio: Passo = {
  id: 'p1',
  titolo: 'Taglio',
  testo: '',
  azioni: [{ tipo: 'taglio', giocatore: 'A2', percorso: [[10, 4]], inizio: 1, durata: 2 }],
}

const pos = (s: StatoCampo, id: string) => {
  const g = s.giocatori.find((x) => x.id === id)!
  return { x: g.x, y: g.y }
}

describe('funzioni di base', () => {
  it('morbido parte da 0, arriva a 1, a metà vale 0,5', () => {
    expect(morbido(0)).toBe(0)
    expect(morbido(1)).toBe(1)
    expect(morbido(0.5)).toBe(0.5)
  })

  it('puntoSuPercorso segue la lunghezza dei tratti', () => {
    // percorso a L: 3 m a destra, poi 3 m in giù (totale 6 m)
    const punti = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }]
    expect(puntoSuPercorso(punti, 0)).toEqual({ x: 0, y: 0 })
    expect(puntoSuPercorso(punti, 0.5)).toEqual({ x: 3, y: 0 })
    expect(puntoSuPercorso(punti, 0.75)).toEqual({ x: 3, y: 1.5 })
    expect(puntoSuPercorso(punti, 1)).toEqual({ x: 3, y: 3 })
  })

  it('durataPasso = fine dell’ultima azione', () => {
    expect(durataPasso(taglio)).toBe(3)
  })
})

describe('movimento di un giocatore', () => {
  it('prima dell’inizio è fermo', () => {
    expect(pos(statoAlTempo(inizio, taglio, 0.5), 'A2')).toEqual({ x: 10, y: 0 })
  })

  it('a metà azione è a metà strada', () => {
    const p = pos(statoAlTempo(inizio, taglio, 2), 'A2')
    expect(p.x).toBeCloseTo(10)
    expect(p.y).toBeCloseTo(2)
  })

  it('alla fine è arrivato e ci resta', () => {
    expect(pos(statoAlTempo(inizio, taglio, 3), 'A2')).toEqual({ x: 10, y: 4 })
    expect(pos(statoAlTempo(inizio, taglio, 99), 'A2')).toEqual({ x: 10, y: 4 })
  })

  it('chi non ha azioni non si muove', () => {
    expect(pos(statoAlTempo(inizio, taglio, 2), 'A1')).toEqual({ x: 0, y: 0 })
  })

  it('non modifica lo stato di partenza', () => {
    statoAlTempo(inizio, taglio, 3)
    expect(pos(inizio, 'A2')).toEqual({ x: 10, y: 0 })
  })

  it('due movimenti di fila dello stesso giocatore', () => {
    const passo: Passo = {
      ...taglio,
      azioni: [
        { tipo: 'taglio', giocatore: 'A1', percorso: [[2, 0]], inizio: 0, durata: 1 },
        { tipo: 'palleggio', giocatore: 'A1', percorso: [[2, 2]], inizio: 1, durata: 1 },
      ],
    }
    expect(pos(statoAlTempo(inizio, passo, 1), 'A1')).toEqual({ x: 2, y: 0 })
    expect(pos(statoAlTempo(inizio, passo, 2), 'A1')).toEqual({ x: 2, y: 2 })
  })
})

describe('palla', () => {
  const passaggio: Passo = {
    id: 'p',
    titolo: 'Passaggio',
    testo: '',
    azioni: [{ tipo: 'passaggio', da: 'A1', a: 'A2', inizio: 0, durata: 1 }],
  }

  it('prima del passaggio è in mano a chi passa', () => {
    expect(statoAlTempo(inizio, passaggio, 0).palla.inMano).toBe('A1')
  })

  it('durante il passaggio è in volo, a metà strada', () => {
    const p = statoAlTempo(inizio, passaggio, 0.5).palla
    expect(p.inMano).toBeNull()
    expect(p.x).toBeCloseTo(5 + PALLA_IN_MANO.x)
    expect(p.y).toBeCloseTo(0 + PALLA_IN_MANO.y)
  })

  it('dopo il passaggio è in mano a chi riceve', () => {
    expect(statoAlTempo(inizio, passaggio, 1).palla.inMano).toBe('A2')
  })

  it('palleggio: la palla resta in mano e segue il giocatore', () => {
    const passo: Passo = {
      ...taglio,
      azioni: [{ tipo: 'palleggio', giocatore: 'A1', percorso: [[0, 5]], inizio: 0, durata: 1 }],
    }
    const s = statoAlTempo(inizio, passo, 1)
    expect(s.palla.inMano).toBe('A1')
    expect(pos(s, 'A1')).toEqual({ x: 0, y: 5 })
  })
})

describe('passi in sequenza', () => {
  it('la fine di un passo è la partenza del successivo', () => {
    const passo1: Passo = {
      id: 'p1',
      titolo: '',
      testo: '',
      azioni: [
        { tipo: 'passaggio', da: 'A1', a: 'A2', inizio: 0, durata: 1 },
        { tipo: 'taglio', giocatore: 'A1', percorso: [[0, 6]], inizio: 1, durata: 1 },
      ],
    }
    const passo2: Passo = {
      id: 'p2',
      titolo: '',
      testo: '',
      azioni: [{ tipo: 'passaggio', da: 'A2', a: 'A1', inizio: 0, durata: 1 }],
    }
    const fine1 = statoFinePasso(inizio, passo1)
    expect(pos(fine1, 'A1')).toEqual({ x: 0, y: 6 })
    expect(fine1.palla.inMano).toBe('A2')

    const fine2 = statoFinePasso(fine1, passo2)
    expect(pos(fine2, 'A1')).toEqual({ x: 0, y: 6 }) // A1 parte da dove era arrivato
    expect(fine2.palla.inMano).toBe('A1')
  })
})
