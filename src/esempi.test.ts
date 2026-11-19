import { describe, expect, it } from 'vitest'
import daiEVai from '../docs/esempi/dai-e-vai.json?raw'
import { validaSchema } from './valida'

describe('file di esempio', () => {
  it('docs/esempi/dai-e-vai.json è valido', () => {
    const r = validaSchema(JSON.parse(daiEVai))
    expect(r.ok ? [] : r.errori).toEqual([])
  })
})
