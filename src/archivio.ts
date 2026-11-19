// Salvataggio locale (localStorage del browser): libreria degli schemi + preferenze.
// I dati restano solo su questo dispositivo → fare backup con "Esporta tutto".
import type { Schema } from './schema'
import { validaSchema } from './valida'

const CHIAVI = {
  schemi: 'smartboard.schemi',
  ultimo: 'smartboard.ultimo',
  velocita: 'smartboard.velocita',
  backup: 'smartboard.ultimoBackup',
} as const

type Memoria = Pick<Storage, 'getItem' | 'setItem'>

export interface VoceLibreria {
  schema: Schema
  predefinito: boolean // schemi che arrivano con l'app: non si eliminano
}

export class Archivio {
  private memoria: Memoria | null
  private predefiniti: Schema[]

  constructor(memoria: Memoria | null, predefiniti: Schema[]) {
    this.memoria = memoria
    this.predefiniti = predefiniti
  }

  // Ogni accesso è protetto: in navigazione privata o con memoria piena il browser può dare errore.
  private leggi(k: string): string | null {
    try {
      return this.memoria?.getItem(k) ?? null
    } catch {
      return null
    }
  }

  private scrivi(k: string, v: string): boolean {
    try {
      this.memoria?.setItem(k, v)
      return !!this.memoria
    } catch {
      return false
    }
  }

  /** Schemi salvati dall'utente (quelli rovinati vengono ignorati). */
  schemiUtente(): Schema[] {
    try {
      const dati: unknown = JSON.parse(this.leggi(CHIAVI.schemi) ?? '[]')
      if (!Array.isArray(dati)) return []
      return dati.flatMap((d) => {
        const r = validaSchema(d)
        return r.ok ? [r.schema] : []
      })
    } catch {
      return []
    }
  }

  tutti(): VoceLibreria[] {
    return [
      ...this.predefiniti.map((schema) => ({ schema, predefinito: true })),
      ...this.schemiUtente().map((schema) => ({ schema, predefinito: false })),
    ]
  }

  trova(id: string): Schema | undefined {
    return this.tutti().find((v) => v.schema.id === id)?.schema
  }

  ePredefinito(id: string): boolean {
    return this.predefiniti.some((s) => s.id === id)
  }

  eUtente(id: string): boolean {
    return this.schemiUtente().some((s) => s.id === id)
  }

  /** Salva (o sostituisce, se l'id esiste già) uno schema dell'utente. */
  salva(schema: Schema): boolean {
    const lista = this.schemiUtente().filter((s) => s.id !== schema.id)
    lista.push(schema)
    return this.scrivi(CHIAVI.schemi, JSON.stringify(lista))
  }

  elimina(id: string): boolean {
    const lista = this.schemiUtente().filter((s) => s.id !== id)
    return this.scrivi(CHIAVI.schemi, JSON.stringify(lista))
  }

  get ultimo(): string | null {
    return this.leggi(CHIAVI.ultimo)
  }
  set ultimo(id: string | null) {
    if (id) this.scrivi(CHIAVI.ultimo, id)
  }

  get velocita(): number | null {
    const v = Number(this.leggi(CHIAVI.velocita))
    return v > 0 ? v : null
  }
  set velocita(v: number | null) {
    if (v) this.scrivi(CHIAVI.velocita, String(v))
  }

  get ultimoBackup(): Date | null {
    const t = this.leggi(CHIAVI.backup)
    const d = t ? new Date(t) : null
    return d && !Number.isNaN(d.getTime()) ? d : null
  }
  segnaBackup(quando = new Date()): void {
    this.scrivi(CHIAVI.backup, quando.toISOString())
  }
}

/** "oggi", "ieri", "5 giorni fa", "mai" */
export function giorniFa(data: Date | null, oggi = new Date()): string {
  if (!data) return 'mai'
  const inizio = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const giorni = Math.round((inizio(oggi) - inizio(data)) / 86_400_000)
  if (giorni <= 0) return 'oggi'
  if (giorni === 1) return 'ieri'
  return `${giorni} giorni fa`
}
