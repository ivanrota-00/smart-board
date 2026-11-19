import { describe, expect, it } from 'vitest'
import { Archivio, giorniFa } from './archivio'
import type { Schema } from './schema'
import { triangolo } from './schemi/triangolo'
import { leggiImport, validaSchema } from './valida'

const copia = (): Record<string, any> => JSON.parse(JSON.stringify(triangolo))
const errori = (d: unknown) => {
  const r = validaSchema(d)
  return r.ok ? [] : r.errori
}

describe('validaSchema', () => {
  it('il Triangolo è valido', () => {
    expect(validaSchema(copia()).ok).toBe(true)
  })

  it('aggiunge i valori di default (tag, testo)', () => {
    const d = copia()
    delete d.tag
    delete d.passi[0].testo
    const r = validaSchema(d)
    expect(r.ok && r.schema.tag).toEqual([])
    expect(r.ok && r.schema.passi[0].testo).toBe('')
  })

  it('non è uno schema', () => {
    expect(errori('ciao')).toEqual(['Il file non contiene uno schema.'])
    expect(errori([1, 2])).toEqual(['Il file non contiene uno schema.'])
  })

  it('versione più nuova dell’app', () => {
    const d = copia()
    d.versione = 99
    expect(errori(d)[0]).toMatch(/versione più nuova/)
  })

  it('giocatore inesistente in un’azione', () => {
    const d = copia()
    d.passi[1].azioni[0] = { tipo: 'taglio', giocatore: 'A7', percorso: [[1, 1]], inizio: 0, durata: 1 }
    expect(errori(d)).toContain('Il passo pA1 (azione 1) usa il giocatore A7 che non esiste.')
  })

  it('scelta che porta a un passo inesistente', () => {
    const d = copia()
    d.passi[0].scelte[1].vaiA = 'pZ'
    expect(errori(d)[0]).toMatch(/porta al passo pZ che non esiste/)
  })

  it('prossimo inesistente, tipo sconosciuto, percorso rotto', () => {
    const d = copia()
    d.passi[1].prossimo = 'boh'
    d.passi[1].azioni[1].tipo = 'volo'
    d.passi[1].azioni[2].percorso = [[1]]
    const e = errori(d)
    expect(e.some((m) => m.includes('rimanda al passo boh'))).toBe(true)
    expect(e.some((m) => m.includes('tipo "volo" sconosciuto'))).toBe(true)
    expect(e.some((m) => m.includes('lista di punti'))).toBe(true)
  })

  it('giocatori duplicati e palla a un giocatore inesistente', () => {
    const d = copia()
    d.giocatori.push({ ...d.giocatori[0] })
    d.palla.inMano = 'A9'
    const e = errori(d)
    expect(e).toContain('Il giocatore A1 compare due volte.')
    expect(e).toContain('La palla usa il giocatore A9 che non esiste.')
  })
})

describe('leggiImport', () => {
  it('schema singolo', () => {
    expect(leggiImport(copia()).schemi).toHaveLength(1)
  })

  it('backup con più schemi, uno rotto', () => {
    const rotto = copia()
    rotto.nome = 'Rotto'
    rotto.giocatori = []
    const r = leggiImport({ tipo: 'smart-board-backup', versione: 1, data: '', schemi: [copia(), rotto] })
    expect(r.schemi).toHaveLength(1)
    expect(r.errori[0]).toMatch(/^"Rotto": /)
  })
})

describe('Archivio (salvataggio)', () => {
  const memoriaFinta = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  }
  const mio = (id: string): Schema => ({ ...(copia() as Schema), id, nome: `Schema ${id}` })

  it('all’inizio c’è solo il predefinito', () => {
    const a = new Archivio(memoriaFinta(), [triangolo])
    expect(a.tutti().map((v) => [v.schema.id, v.predefinito])).toEqual([['triangolo', true]])
  })

  it('salva, ritrova dopo il "ricaricamento", sostituisce, elimina', () => {
    const mem = memoriaFinta()
    new Archivio(mem, [triangolo]).salva(mio('uno'))
    const a = new Archivio(mem, [triangolo]) // come ricaricare la pagina
    expect(a.trova('uno')?.nome).toBe('Schema uno')
    a.salva({ ...mio('uno'), nome: 'Nuovo nome' })
    expect(a.schemiUtente()).toHaveLength(1)
    expect(a.trova('uno')?.nome).toBe('Nuovo nome')
    a.elimina('uno')
    expect(a.trova('uno')).toBeUndefined()
  })

  it('ricorda ultimo schema, velocità e data del backup', () => {
    const mem = memoriaFinta()
    const a = new Archivio(mem, [triangolo])
    a.ultimo = 'triangolo'
    a.velocita = 0.5
    a.segnaBackup(new Date('2026-11-10T10:00:00'))
    const b = new Archivio(mem, [triangolo])
    expect(b.ultimo).toBe('triangolo')
    expect(b.velocita).toBe(0.5)
    expect(b.ultimoBackup?.getDate()).toBe(10)
  })

  it('funziona anche senza memoria (es. navigazione privata)', () => {
    const rotta = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') } }
    const a = new Archivio(rotta, [triangolo])
    expect(a.tutti()).toHaveLength(1)
    expect(a.salva(mio('x'))).toBe(false)
  })

  it('dati rovinati in memoria vengono ignorati', () => {
    const mem = memoriaFinta()
    mem.setItem('smartboard.schemi', '{non json')
    expect(new Archivio(mem, [triangolo]).schemiUtente()).toEqual([])
  })

  it('giorniFa', () => {
    const oggi = new Date('2026-11-19T20:00:00')
    expect(giorniFa(null, oggi)).toBe('mai')
    expect(giorniFa(new Date('2026-11-19T08:00:00'), oggi)).toBe('oggi')
    expect(giorniFa(new Date('2026-11-18T23:00:00'), oggi)).toBe('ieri')
    expect(giorniFa(new Date('2026-11-12T10:00:00'), oggi)).toBe('7 giorni fa')
  })
})
