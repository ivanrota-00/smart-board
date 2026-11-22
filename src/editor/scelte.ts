// Scelte (rami A/B…) e specchia schema: operazioni pure, testabili.
import type { Passo, Schema } from '../schema'
import { eMovimento } from '../schema'
import { nuovoIdPasso, ordinePassi, type Esito } from './modello'

const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const LARGHEZZA = 15

function passoVuoto(s: Schema, titolo: string): Passo {
  return { id: nuovoIdPasso(s), titolo, testo: '', azioni: [] }
}

/** Toglie i passi che non si raggiungono più dal primo (es. il ramo di una scelta eliminata). */
function togliIrraggiungibili(s: Schema): Schema {
  const vivi = new Set(ordinePassiRaggiungibili(s))
  return { ...s, passi: s.passi.filter((p) => vivi.has(p.id)) }
}

function ordinePassiRaggiungibili(s: Schema): string[] {
  const visti = new Set<string>()
  const visita = (id: string | undefined) => {
    const p = id && s.passi.find((x) => x.id === id)
    if (!p || visti.has(p.id)) return
    visti.add(p.id)
    visita(p.prossimo)
    for (const sc of p.scelte ?? []) visita(sc.vaiA)
  }
  visita(s.passi[0]?.id)
  return [...visti]
}

/**
 * Aggiunge una decisione alla fine del passo: due opzioni A e B.
 * Se il passo aveva un seguito, quel seguito diventa il ramo A; il ramo B parte con un passo vuoto.
 */
export function aggiungiScelta(schema: Schema, passoId: string): Esito {
  const s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  if (!p) return { ok: false, motivo: 'Passo non trovato.' }
  if (p.scelte?.length) return { ok: false, motivo: 'Questo passo ha già una scelta.' }
  let vaiA = p.prossimo
  if (!vaiA) {
    const a = passoVuoto(s, 'Ramo A — passo 1')
    s.passi.push(a)
    vaiA = a.id
  }
  const b = passoVuoto(s, 'Ramo B — passo 1')
  s.passi.push(b)
  delete p.prossimo
  p.domanda = 'Decisione: cosa fare?'
  p.scelte = [
    { etichetta: 'A', vaiA },
    { etichetta: 'B', vaiA: b.id },
  ]
  return { ok: true, schema: s, id: passoId }
}

/** Aggiunge un'altra opzione (C, D…) con il suo ramo vuoto. */
export function aggiungiOpzione(schema: Schema, passoId: string): Esito {
  const s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  if (!p?.scelte?.length) return { ok: false, motivo: 'Questo passo non ha una scelta.' }
  if (p.scelte.length >= 4) return { ok: false, motivo: 'Al massimo 4 opzioni.' }
  const lettera = 'ABCD'[p.scelte.length]
  const nuovo = passoVuoto(s, `Ramo ${lettera} — passo 1`)
  s.passi.push(nuovo)
  p.scelte.push({ etichetta: lettera, vaiA: nuovo.id })
  return { ok: true, schema: s, id: passoId }
}

export function modificaScelta(schema: Schema, passoId: string, indice: number, etichetta: string): Schema {
  const s = copia(schema)
  const sc = s.passi.find((x) => x.id === passoId)?.scelte?.[indice]
  if (sc) sc.etichetta = etichetta
  return s
}

export function modificaDomanda(schema: Schema, passoId: string, domanda: string): Schema {
  const s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  if (p) p.domanda = domanda
  return s
}

/**
 * Elimina un'opzione e i passi del suo ramo. Se resta una sola opzione,
 * la scelta sparisce e quel ramo diventa il seguito normale del passo.
 */
export function eliminaScelta(schema: Schema, passoId: string, indice: number): Esito {
  let s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  if (!p?.scelte?.[indice]) return { ok: false, motivo: 'Opzione non trovata.' }
  p.scelte.splice(indice, 1)
  if (p.scelte.length === 1) {
    p.prossimo = p.scelte[0].vaiA
    delete p.scelte
    delete p.domanda
  }
  s = togliIrraggiungibili(s)
  return { ok: true, schema: s, id: passoId }
}

/** Toglie del tutto la decisione dal passo (e tutti i rami). */
export function togliScelta(schema: Schema, passoId: string): Esito {
  let s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  if (!p?.scelte?.length) return { ok: false, motivo: 'Questo passo non ha una scelta.' }
  delete p.scelte
  delete p.domanda
  s = togliIrraggiungibili(s)
  return { ok: true, schema: s, id: passoId }
}

/** Specchia destra ↔ sinistra: x diventa 15 − x per giocatori e percorsi. */
export function specchiaSchema(schema: Schema): Schema {
  const s = copia(schema)
  const sx = (x: number) => Math.round((LARGHEZZA - x) * 100) / 100
  for (const g of s.giocatori) g.x = sx(g.x)
  for (const p of s.passi)
    for (const a of p.azioni) if (eMovimento(a)) a.percorso = a.percorso.map(([x, y]) => [sx(x), y])
  return s
}

/** Sigla breve di un'opzione per l'elenco passi: "A: passa al 5" → "A". */
function sigla(etichetta: string): string {
  const prima = etichetta.split(':')[0].trim()
  return (prima.length <= 12 ? prima : `${prima.slice(0, 11)}…`) || '?'
}

/** Per ogni passo, il ramo in cui si trova: "" (tronco), "A", "B › Libero"… */
export function ramiDeiPassi(schema: Schema): Map<string, string> {
  const rami = new Map<string, string>()
  const visita = (id: string | undefined, ramo: string) => {
    const p = id && schema.passi.find((x) => x.id === id)
    if (!p || rami.has(p.id)) return
    rami.set(p.id, ramo)
    visita(p.prossimo, ramo)
    for (const sc of p.scelte ?? []) visita(sc.vaiA, ramo ? `${ramo} › ${sigla(sc.etichetta)}` : sigla(sc.etichetta))
  }
  visita(schema.passi[0]?.id, '')
  for (const p of ordinePassi(schema)) if (!rami.has(p.id)) rami.set(p.id, '?')
  return rami
}
