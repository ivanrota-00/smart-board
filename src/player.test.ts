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
    expect(p.totale).toBe(3)
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

  it('con le scelte (per ora) segue la prima', () => {
    const conScelte: Schema = {
      ...schema,
      passi: [
        { ...schema.passi[0], prossimo: undefined, scelte: [{ etichetta: 'A', vaiA: 'p3' }, { etichetta: 'B', vaiA: 'p2' }] },
        ...schema.passi.slice(1),
      ],
    }
    const p = new Player(conScelte)
    p.avanti()
    expect(p.passo.id).toBe('p3')
  })
})
