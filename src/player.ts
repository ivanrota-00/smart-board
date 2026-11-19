// Logica del player (senza grafica, testabile): quale passo, a che secondo, velocità.
// Regole scelte con Ivan (Fase 5):
// - Play riproduce UN passo; a fine passo ci si ferma sull'inizio del passo dopo (frecce e testo nuovi).
// - Il passo dopo è `prossimo`. Con le `scelte` (Fase 6) per ora si prende la prima (temporaneo).
import { durataPasso, statoAlTempo, statoDaSchema, statoFinePasso } from './motore'
import type { Passo, Schema } from './schema'
import type { StatoCampo } from './stato'

export const VELOCITA = [0.5, 1, 1.5] as const

export class Player {
  private storia: Passo[] = [] // passi visitati; l'ultimo è quello corrente
  private inizi: StatoCampo[] = [] // stato di partenza di ogni passo della storia
  t = 0 // secondi nel passo corrente
  inRiproduzione = false
  velocita = 1

  constructor(private schema: Schema) {
    this.ricomincia()
  }

  get passo(): Passo {
    return this.storia[this.storia.length - 1]
  }

  get durata(): number {
    return durataPasso(this.passo)
  }

  /** Numero del passo corrente (1 = primo). */
  get numero(): number {
    return this.storia.length
  }

  /** Passi totali lungo il percorso attuale (fatti + quello corrente + quelli che seguono). */
  get totale(): number {
    let n = this.storia.length
    const visti = new Set(this.storia.map((p) => p.id))
    let p = this.prossimoDi(this.passo)
    while (p && !visti.has(p.id)) {
      visti.add(p.id)
      n++
      p = this.prossimoDi(p)
    }
    return n
  }

  /** true quando si è alla fine dell'ultimo passo. */
  get finito(): boolean {
    return !this.prossimoDi(this.passo) && this.t >= this.durata
  }

  get statoInizioPasso(): StatoCampo {
    return this.inizi[this.inizi.length - 1]
  }

  /** Stato del campo da disegnare adesso. */
  statoCampo(): StatoCampo {
    return statoAlTempo(this.statoInizioPasso, this.passo, this.t)
  }

  prossimoDi(passo: Passo): Passo | undefined {
    const id = passo.prossimo ?? passo.scelte?.[0]?.vaiA
    return id ? this.schema.passi.find((p) => p.id === id) : undefined
  }

  ricomincia(): void {
    this.storia = [this.schema.passi[0]]
    this.inizi = [statoDaSchema(this.schema)]
    this.t = 0
    this.inRiproduzione = false
  }

  play(): void {
    if (this.finito) this.ricomincia()
    this.inRiproduzione = true
  }

  pausa(): void {
    this.inRiproduzione = false
  }

  /** Fa passare il tempo (secondi reali). Va chiamato a ogni fotogramma. */
  avanza(secondi: number): void {
    if (!this.inRiproduzione) return
    this.t += secondi * this.velocita
    if (this.t >= this.durata) {
      this.t = this.durata
      this.inRiproduzione = false
      this.vaiAlProssimo()
    }
  }

  /** ⏭ Salta all'inizio del passo dopo (se c'è), altrimenti alla fine di questo. */
  avanti(): void {
    this.inRiproduzione = false
    if (!this.vaiAlProssimo()) this.t = this.durata
  }

  /** ⏮ Torna all'inizio del passo; se sei già all'inizio, al passo prima. */
  indietro(): void {
    this.inRiproduzione = false
    if (this.t > 0) {
      this.t = 0
    } else if (this.storia.length > 1) {
      this.storia.pop()
      this.inizi.pop()
      this.t = 0
    }
  }

  private vaiAlProssimo(): boolean {
    const p = this.prossimoDi(this.passo)
    if (!p) return false
    this.inizi.push(statoFinePasso(this.statoInizioPasso, this.passo))
    this.storia.push(p)
    this.t = 0
    return true
  }
}
