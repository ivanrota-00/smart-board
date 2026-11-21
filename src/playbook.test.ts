import { describe, expect, it } from 'vitest'
import { caricaPlaybook, playbook } from './playbook'

// Questo test protegge la pubblicazione: se un file in src/schemi/ è sbagliato,
// GitHub si ferma e l'app dei giocatori non viene rovinata.
describe('playbook della squadra', () => {
  it('tutti i file in src/schemi/ sono validi e con id diversi', () => {
    const file = import.meta.glob<unknown>('./schemi/*.json', { eager: true, import: 'default' })
    expect(caricaPlaybook(file).errori).toEqual([])
    expect(playbook.length).toBe(Object.keys(file).length)
  })

  it('contiene il Triangolo', () => {
    expect(playbook.map((s) => s.id)).toContain('triangolo')
  })

  it('segnala file rotti e id doppi', () => {
    const t = playbook[0]
    const r = caricaPlaybook({ './schemi/a.json': t, './schemi/b.json': t, './schemi/c.json': { nome: 'x' } })
    expect(r.schemi).toHaveLength(1)
    expect(r.errori.some((e) => e.startsWith('b.json: l\'id'))).toBe(true)
    expect(r.errori.some((e) => e.startsWith('c.json:'))).toBe(true)
  })
})
