import { describe, expect, it } from 'vitest'
import { Player } from './player'
import type { Schema } from './schema'

// Schema di prova: 3 passi in fila, ognuno dura 2 secondi
const schema: Schema = {
  versione: 1,
  id: 'test',
  nome: 'Test',
  tag: [],
  campo: 'mezzo',
  giocatori: [{ id: 'A1', squadra: 'att', label: '1', x: 0, y: 0 }],
  palla: { inMano: 'A1' },
  passi: [
    {
      id: 'p1', titolo: 'Uno', testo: '', prossimo: 'p2',
      azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[2, 0]], inizio: 0, durata: 2 }],
    },
    {
      id: 'p2', titolo: 'Due', testo: '', prossimo: 'p3',
      azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[2, 2]], inizio: 0, durata: 2 }],
    },
    {
      id: 'p3', titolo: 'Tre', testo: '',
      azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[0, 2]], inizio: 0, durata: 2 }],
    },
  ],
}

const posA1 = (p: Player) => {
  const g = p.statoCampo().giocatori[0]
  return { x: g.x, y: g.y }
}

describe('player', () => {
  it('parte dal primo passo, fermo, al secondo 0', () => {
    const p = new Player(schema)
    expect(p.passo.id).toBe('p1')
    expect(p.t).toBe(0)
    expect(p.inRiproduzione).toBe(false)
    expect(p.numero).toBe(1)
    expect(p.percorso).toEqual({ totale: 3, poiScelta: false })
  })

  it('senza play il tempo non passa', () => {
    const p = new Player(schema)
    p.avanza(1)
    expect(p.t).toBe(0)
  })

  it('play fa passare il tempo; la velocità lo moltiplica', () => {
    const p = new Player(schema)
    p.play()
    p.avanza(0.5)
    expect(p.t).toBeCloseTo(0.5)
    p.velocita = 0.5
    p.avanza(1)
    expect(p.t).toBeCloseTo(1)
  })

  it('a fine passo si ferma all’inizio del passo dopo', () => {
    const p = new Player(schema)
    p.play()
    p.avanza(5) // più della durata
    expect(p.passo.id).toBe('p2')
    expect(p.t).toBe(0)
    expect(p.inRiproduzione).toBe(false)
    expect(posA1(p)).toEqual({ x: 2, y: 0 }) // parte da dove era finito il passo 1
  })

  it('⏭ salta al passo dopo; all’ultimo va alla fine', () => {
    const p = new Player(schema)
    p.avanti()
    p.avanti()
    expect(p.passo.id).toBe('p3')
    expect(posA1(p)).toEqual({ x: 2, y: 2 })
    p.avanti()
    expect(p.passo.id).toBe('p3')
    expect(p.t).toBe(2)
    expect(p.finito).toBe(true)
  })

  it('⏮ torna all’inizio del passo, poi al passo prima', () => {
    const p = new Player(schema)
    p.avanti() // p2
    p.play()
    p.avanza(1)
    p.indietro()
    expect(p.passo.id).toBe('p2')
    expect(p.t).toBe(0)
    p.indietro()
    expect(p.passo.id).toBe('p1')
    expect(posA1(p)).toEqual({ x: 0, y: 0 })
    p.indietro() // già al primo: resta lì
    expect(p.passo.id).toBe('p1')
  })

  it('play alla fine dello schema ricomincia da capo', () => {
    const p = new Player(schema)
    p.avanti()
    p.avanti()
    p.avanti()
    p.play()
    expect(p.passo.id).toBe('p1')
    expect(p.inRiproduzione).toBe(true)
  })

  it('ricomincia torna al primo passo, fermo', () => {
    const p = new Player(schema)
    p.avanti()
    p.ricomincia()
    expect(p.passo.id).toBe('p1')
    expect(p.numero).toBe(1)
  })

})

describe('scelte A/B', () => {
  // p0 → decisione → A (pA1 → pA2) oppure B (pB1)
  const base = schema.passi[0]
  const conScelte: Schema = {
    ...schema,
    passi: [
      {
        ...base, id: 'p0', prossimo: undefined, domanda: 'A o B?',
        scelte: [{ etichetta: 'A', vaiA: 'pA1' }, { etichetta: 'B', vaiA: 'pB1' }],
      },
      { ...schema.passi[1], id: 'pA1', prossimo: 'pA2' },
      { ...schema.passi[2], id: 'pA2' },
      {
        id: 'pB1', titolo: 'B', testo: '',
        azioni: [{ tipo: 'taglio', giocatore: 'A1', percorso: [[5, 0]], inizio: 0, durata: 1 }],
      },
    ],
  }

  it('prima della scelta: "passo 1, poi scelta"', () => {
    const p = new Player(conScelte)
    expect(p.percorso).toEqual({ totale: 1, poiScelta: true })
    expect(p.inDecisione).toBe(false)
  })

  it('a fine passo si ferma alla decisione; play non fa niente', () => {
    const p = new Player(conScelte)
    p.play()
    p.avanza(5)
    expect(p.passo.id).toBe('p0')
    expect(p.inDecisione).toBe(true)
    expect(p.finito).toBe(false)
    p.play()
    expect(p.inRiproduzione).toBe(false)
  })

  it('⏭ porta alla decisione, non sceglie da solo', () => {
    const p = new Player(conScelte)
    p.avanti()
    expect(p.passo.id).toBe('p0')
    expect(p.inDecisione).toBe(true)
  })

  it('scegliere A porta all’inizio del ramo A, partendo dalla fine del passo prima', () => {
    const p = new Player(conScelte)
    p.avanti()
    p.scegli(0)
    expect(p.passo.id).toBe('pA1')
    expect(p.t).toBe(0)
    expect(posA1(p)).toEqual({ x: 2, y: 0 })
    expect(p.percorso).toEqual({ totale: 3, poiScelta: false })
  })

  it('scegliere B porta al ramo B', () => {
    const p = new Player(conScelte)
    p.avanti()
    p.scegli(1)
    expect(p.passo.id).toBe('pB1')
    expect(p.percorso).toEqual({ totale: 2, poiScelta: false })
    p.avanti()
    expect(p.finito).toBe(true)
  })

  it('⏮ dal primo passo del ramo torna alla decisione, poi all’inizio', () => {
    const p = new Player(conScelte)
    p.avanti()
    p.scegli(1)
    p.indietro()
    expect(p.passo.id).toBe('p0')
    expect(p.inDecisione).toBe(true)
    p.indietro()
    expect(p.passo.id).toBe('p0')
    expect(p.t).toBe(0)
  })

  it('dopo essere tornati alla decisione si può scegliere l’altro ramo', () => {
    const p = new Player(conScelte)
    p.avanti()
    p.scegli(0)
    p.indietro()
    p.scegli(1)
    expect(p.passo.id).toBe('pB1')
    expect(p.numero).toBe(2)
  })
})
