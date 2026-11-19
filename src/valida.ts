// Controllo di un file JSON importato: è uno schema valido? Messaggi in italiano chiaro.
import { VERSIONE_SCHEMA, type Schema } from './schema'

export type Risultato = { ok: true; schema: Schema } | { ok: false; errori: string[] }

const TIPI_MOVIMENTO = ['taglio', 'palleggio', 'blocco', 'spostamento']
const TIPI_PALLA = ['passaggio', 'hand-off']

const eOggetto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const eNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const eTesto = (v: unknown): v is string => typeof v === 'string'

/** Controlla uno schema. Se va bene restituisce una copia pulita (con i valori di default). */
export function validaSchema(dati: unknown): Risultato {
  const errori: string[] = []
  const err = (m: string) => errori.length < 15 && errori.push(m)

  if (!eOggetto(dati)) return { ok: false, errori: ['Il file non contiene uno schema.'] }
  const d = dati

  if (!eNumero(d.versione)) err('Manca il numero di versione dello schema.')
  else if (d.versione > VERSIONE_SCHEMA)
    err(`Lo schema è stato creato con una versione più nuova dell'app (${d.versione}).`)
  if (!eTesto(d.id) || !d.id.trim()) err('Manca l’id dello schema.')
  if (!eTesto(d.nome) || !d.nome.trim()) err('Manca il nome dello schema.')
  const nome = eTesto(d.nome) ? `"${d.nome}"` : 'Lo schema'

  // Giocatori
  const ids = new Set<string>()
  if (!Array.isArray(d.giocatori) || d.giocatori.length === 0) {
    err(`${nome} non ha giocatori.`)
  } else {
    d.giocatori.forEach((g, i) => {
      if (!eOggetto(g) || !eTesto(g.id)) return err(`Il giocatore n. ${i + 1} non ha un id.`)
      if (ids.has(g.id)) err(`Il giocatore ${g.id} compare due volte.`)
      ids.add(g.id)
      if (g.squadra !== 'att' && g.squadra !== 'dif')
        err(`Il giocatore ${g.id} deve essere "att" (attacco) o "dif" (difesa).`)
      if (!eTesto(g.label)) err(`Il giocatore ${g.id} non ha un'etichetta (es. "1" o "X1").`)
      if (!eNumero(g.x) || !eNumero(g.y)) err(`Il giocatore ${g.id} non ha una posizione (x, y) in metri.`)
    })
  }
  const esisteG = (id: unknown, dove: string) => {
    if (!eTesto(id) || !ids.has(id)) err(`${dove} usa il giocatore ${String(id)} che non esiste.`)
  }

  // Palla
  if (!eOggetto(d.palla)) err('Manca la palla (es. "palla": { "inMano": "A1" }).')
  else if (d.palla.inMano !== null) esisteG(d.palla.inMano, 'La palla')

  // Passi
  const idPassi = new Set<string>()
  if (!Array.isArray(d.passi) || d.passi.length === 0) {
    err(`${nome} non ha passi.`)
  } else {
    for (const p of d.passi) if (eOggetto(p) && eTesto(p.id)) idPassi.add(p.id)
    const visti = new Set<string>()
    d.passi.forEach((p, i) => {
      if (!eOggetto(p) || !eTesto(p.id)) return err(`Il passo n. ${i + 1} non ha un id.`)
      const dove = `Il passo ${p.id}`
      if (visti.has(p.id)) err(`Il passo ${p.id} compare due volte.`)
      visti.add(p.id)
      if (!eTesto(p.titolo)) err(`${dove} non ha un titolo.`)
      if (p.testo !== undefined && !eTesto(p.testo)) err(`${dove}: il testo deve essere una frase.`)
      if (!Array.isArray(p.azioni)) err(`${dove} non ha la lista delle azioni.`)
      else
        p.azioni.forEach((a, j) => {
          const qui = `${dove} (azione ${j + 1})`
          if (!eOggetto(a)) return err(`${qui} non è valida.`)
          if (!eNumero(a.inizio) || a.inizio < 0 || !eNumero(a.durata) || a.durata < 0)
            err(`${qui}: "inizio" e "durata" devono essere secondi (numeri ≥ 0).`)
          if (eTesto(a.tipo) && TIPI_MOVIMENTO.includes(a.tipo)) {
            esisteG(a.giocatore, qui)
            const ok =
              Array.isArray(a.percorso) &&
              a.percorso.length > 0 &&
              a.percorso.every((pt) => Array.isArray(pt) && pt.length === 2 && pt.every(eNumero))
            if (!ok) err(`${qui}: il percorso deve essere una lista di punti [x, y].`)
          } else if (eTesto(a.tipo) && TIPI_PALLA.includes(a.tipo)) {
            esisteG(a.da, qui)
            esisteG(a.a, qui)
          } else {
            err(`${qui}: tipo "${String(a.tipo)}" sconosciuto.`)
          }
        })
      if (p.prossimo !== undefined && (!eTesto(p.prossimo) || !idPassi.has(p.prossimo)))
        err(`${dove} rimanda al passo ${String(p.prossimo)} che non esiste.`)
      if (p.scelte !== undefined) {
        if (!Array.isArray(p.scelte)) err(`${dove}: le scelte devono essere una lista.`)
        else
          p.scelte.forEach((s) => {
            if (!eOggetto(s) || !eTesto(s.etichetta)) return err(`${dove}: una scelta non ha l'etichetta.`)
            if (!eTesto(s.vaiA) || !idPassi.has(s.vaiA))
              err(`${dove}: la scelta "${s.etichetta}" porta al passo ${String(s.vaiA)} che non esiste.`)
          })
      }
    })
  }

  if (errori.length) return { ok: false, errori }

  // Copia pulita con i default
  const copia = JSON.parse(JSON.stringify(d)) as Schema
  copia.tag = Array.isArray(d.tag) ? (d.tag.filter(eTesto) as string[]) : []
  copia.campo = 'mezzo'
  for (const p of copia.passi) p.testo = p.testo ?? ''
  return { ok: true, schema: copia }
}

export interface FileBackup {
  tipo: 'smart-board-backup'
  versione: number
  data: string
  schemi: Schema[]
}

/** Legge il contenuto di un file importato: uno schema singolo oppure un backup con più schemi. */
export function leggiImport(dati: unknown): { schemi: Schema[]; errori: string[] } {
  const lista: unknown[] =
    eOggetto(dati) && dati.tipo === 'smart-board-backup' && Array.isArray(dati.schemi)
      ? dati.schemi
      : [dati]
  const schemi: Schema[] = []
  const errori: string[] = []
  lista.forEach((s, i) => {
    const r = validaSchema(s)
    if (r.ok) schemi.push(r.schema)
    else {
      const chi = eOggetto(s) && eTesto(s.nome) ? `"${s.nome}"` : `Schema n. ${i + 1}`
      errori.push(...r.errori.map((e) => (lista.length > 1 ? `${chi}: ${e}` : e)))
    }
  })
  return { schemi, errori }
}
