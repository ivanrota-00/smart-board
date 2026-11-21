// Operazioni dell'editor sullo schema (pure: ricevono uno schema e ne restituiscono uno NUOVO).
// Così annulla/ripeti è semplice e tutto si può testare senza grafica.
import type { Punto } from '../coordinate'
import { statoDaSchema, statoFinePasso } from '../motore'
import { VERSIONE_SCHEMA, type Passo, type Schema } from '../schema'
import type { Giocatore, StatoCampo } from '../stato'

const CANESTRO = { x: 7.5, y: 1.575 }

const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** Posizioni di partenza di uno schema nuovo: 4 fuori e 1 dentro, difensori tra uomo e canestro. */
export function nuovoSchema(id: string, nome: string): Schema {
  const attacco: [string, number, number][] = [
    ['1', 7.5, 9.5],
    ['2', 13.0, 6.5],
    ['3', 2.0, 6.5],
    ['4', 14.0, 1.3],
    ['5', 10.0, 3.2],
  ]
  const giocatori: Giocatore[] = []
  for (const [n, x, y] of attacco) giocatori.push({ id: `A${n}`, squadra: 'att', label: n, x, y })
  for (const [n, x, y] of attacco) {
    const dx = CANESTRO.x - x
    const dy = CANESTRO.y - y
    const d = Math.hypot(dx, dy) || 1
    const passo = Math.min(1.4, d / 2) // 1,4 m: i cerchi non si sovrappongono
    giocatori.push({
      id: `D${n}`,
      squadra: 'dif',
      label: `X${n}`,
      x: Math.round((x + (dx / d) * passo) * 100) / 100,
      y: Math.round((y + (dy / d) * passo) * 100) / 100,
    })
  }
  return {
    versione: VERSIONE_SCHEMA,
    id,
    nome,
    tag: [],
    campo: 'mezzo',
    giocatori,
    palla: { inMano: 'A1' },
    passi: [{ id: 'p1', titolo: 'Situazione iniziale', testo: '', azioni: [] }],
  }
}

/** Primo id libero del tipo p1, p2, … */
export function nuovoIdPasso(schema: Schema): string {
  const usati = new Set(schema.passi.map((p) => p.id))
  let n = schema.passi.length + 1
  while (usati.has(`p${n}`)) n++
  return `p${n}`
}

/** Il primo passo (quello da cui parte lo schema). */
export function primoPasso(schema: Schema): Passo {
  return schema.passi[0]
}

/** Passi che portano a `id` (tramite `prossimo` o una scelta). */
function predecessori(schema: Schema, id: string): Passo[] {
  return schema.passi.filter((p) => p.prossimo === id || p.scelte?.some((s) => s.vaiA === id))
}

/** Ordine "di lettura": dal primo passo seguendo prossimo e scelte; i passi non raggiungibili in fondo. */
export function ordinePassi(schema: Schema): Passo[] {
  const visti = new Set<string>()
  const out: Passo[] = []
  const trova = (id: string) => schema.passi.find((p) => p.id === id)
  const visita = (p: Passo | undefined) => {
    if (!p || visti.has(p.id)) return
    visti.add(p.id)
    out.push(p)
    if (p.prossimo) visita(trova(p.prossimo))
    for (const s of p.scelte ?? []) visita(trova(s.vaiA))
  }
  visita(schema.passi[0])
  for (const p of schema.passi) visita(p)
  return out
}

/** Strada dal primo passo fino a `id` (compreso). Vuota se `id` non è raggiungibile. */
export function stradaVerso(schema: Schema, id: string): Passo[] {
  const trova = (x: string) => schema.passi.find((p) => p.id === x)
  const cerca = (p: Passo | undefined, strada: Passo[], visti: Set<string>): Passo[] | null => {
    if (!p || visti.has(p.id)) return null
    const nuova = [...strada, p]
    if (p.id === id) return nuova
    visti.add(p.id)
    for (const dopo of [p.prossimo, ...(p.scelte ?? []).map((s) => s.vaiA)]) {
      const r = dopo ? cerca(trova(dopo), nuova, visti) : null
      if (r) return r
    }
    return null
  }
  return cerca(schema.passi[0], [], new Set()) ?? []
}

/** Stato del campo all'inizio del passo `id` (fine di tutti i passi che lo precedono). */
export function statoInizioDi(schema: Schema, id: string): StatoCampo {
  let stato = statoDaSchema(schema)
  const strada = stradaVerso(schema, id)
  for (const p of strada.slice(0, -1)) stato = statoFinePasso(stato, p)
  return stato
}

// --- Modifiche ----------------------------------------------------------------------

export function rinominaSchema(schema: Schema, nome: string): Schema {
  return { ...copia(schema), nome }
}

/** Sposta un giocatore nella situazione iniziale. */
export function spostaGiocatore(schema: Schema, id: string, p: Punto): Schema {
  const s = copia(schema)
  const g = s.giocatori.find((x) => x.id === id)
  if (g) {
    g.x = Math.round(p.x * 100) / 100
    g.y = Math.round(p.y * 100) / 100
  }
  return s
}

/** Chi ha la palla all'inizio (null = palla a terra). */
export function impostaPalla(schema: Schema, inMano: string | null): Schema {
  return { ...copia(schema), palla: { inMano } }
}

export function modificaPasso(schema: Schema, id: string, campi: Partial<Pick<Passo, 'titolo' | 'testo'>>): Schema {
  const s = copia(schema)
  const p = s.passi.find((x) => x.id === id)
  if (p) Object.assign(p, campi)
  return s
}

export type Esito = { ok: true; schema: Schema; id: string } | { ok: false; motivo: string }

/** Aggiunge un passo vuoto subito dopo `dopoId`. */
export function aggiungiPasso(schema: Schema, dopoId: string): Esito {
  const s = copia(schema)
  const prima = s.passi.find((p) => p.id === dopoId)
  if (!prima) return { ok: false, motivo: 'Passo non trovato.' }
  if (prima.scelte?.length)
    return { ok: false, motivo: 'Questo passo finisce con una scelta: i passi dopo si aggiungono dentro i rami.' }
  const id = nuovoIdPasso(s)
  const nuovo: Passo = { id, titolo: `Passo ${s.passi.length + 1}`, testo: '', azioni: [] }
  if (prima.prossimo) nuovo.prossimo = prima.prossimo
  prima.prossimo = id
  s.passi.splice(s.passi.indexOf(prima) + 1, 0, nuovo)
  return { ok: true, schema: s, id }
}

/** Copia del passo (stesse azioni) subito dopo l'originale. */
export function duplicaPasso(schema: Schema, id: string): Esito {
  const s = copia(schema)
  const orig = s.passi.find((p) => p.id === id)
  if (!orig) return { ok: false, motivo: 'Passo non trovato.' }
  if (orig.scelte?.length) return { ok: false, motivo: 'Un passo con una scelta non si può duplicare.' }
  const nuovoId = nuovoIdPasso(s)
  const doppio: Passo = { ...copia(orig), id: nuovoId, titolo: `${orig.titolo} (copia)` }
  delete doppio.prossimo
  if (orig.prossimo) doppio.prossimo = orig.prossimo
  orig.prossimo = nuovoId
  s.passi.splice(s.passi.indexOf(orig) + 1, 0, doppio)
  return { ok: true, schema: s, id: nuovoId }
}

/**
 * Elimina un passo e ricollega chi puntava a lui al passo successivo.
 * Se è il primo, le posizioni di fine diventano la nuova situazione iniziale.
 */
export function eliminaPasso(schema: Schema, id: string): Esito {
  const p = schema.passi.find((x) => x.id === id)
  if (!p) return { ok: false, motivo: 'Passo non trovato.' }
  if (schema.passi.length === 1) return { ok: false, motivo: 'Uno schema deve avere almeno un passo.' }
  if (p.scelte?.length) return { ok: false, motivo: 'Prima togli la scelta di questo passo.' }
  if (predecessori(schema, id).some((x) => x.scelte?.some((sc) => sc.vaiA === id)))
    return { ok: false, motivo: 'Questo passo è l’inizio di un ramo di una scelta: elimina prima la scelta.' }

  let s = copia(schema)
  const primo = s.passi[0].id === id
  if (primo) {
    if (!p.prossimo) return { ok: false, motivo: 'Non c’è un passo dopo questo.' }
    const fine = statoFinePasso(statoDaSchema(s), s.passi[0])
    s.giocatori = s.giocatori.map((g) => {
      const f = fine.giocatori.find((x) => x.id === g.id)!
      return { ...g, x: Math.round(f.x * 100) / 100, y: Math.round(f.y * 100) / 100 }
    })
    s.palla = { inMano: fine.palla.inMano }
  }
  for (const q of s.passi) if (q.prossimo === id) q.prossimo = p.prossimo
  for (const q of s.passi) if (q.prossimo === undefined) delete q.prossimo
  s.passi = s.passi.filter((q) => q.id !== id)
  if (primo) {
    // il successivo deve diventare il primo della lista
    const nuovoPrimo = s.passi.find((q) => q.id === p.prossimo)!
    s = { ...s, passi: [nuovoPrimo, ...s.passi.filter((q) => q !== nuovoPrimo)] }
  }
  const vicino = p.prossimo ?? predecessori(schema, id)[0]?.id ?? s.passi[0].id
  return { ok: true, schema: s, id: vicino }
}

/** Copia modificabile di uno schema (es. dal playbook) con id e nome nuovi. */
export function copiaSchema(schema: Schema, id: string, nome: string): Schema {
  return { ...copia(schema), id, nome }
}

/** id libero a partire dal nome: "Uscita da time out" → "uscita-da-time-out" (-2, -3… se occupato). */
export function idDaNome(nome: string, occupato: (id: string) => boolean): string {
  const base =
    nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'schema'
  let id = base
  for (let n = 2; occupato(id); n++) id = `${base}-${n}`
  return id
}
