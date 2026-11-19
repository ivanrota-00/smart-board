// Logica del player (senza grafica, testabile): quale passo, a che secondo, velocità.
// Regole scelte con Ivan:
// - Play riproduce UN passo; a fine passo ci si ferma sull'inizio del passo dopo (frecce e testo nuovi).
// - Il passo dopo è `prossimo`.
// - Un passo con `scelte`: a fine passo ci si ferma lì (decisione) finché non si sceglie.
// - ⏮ dal primo passo di un ramo riporta alla decisione.
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

  /**
   * Passi lungo il percorso attuale (fatti + corrente + quelli che seguono fino alla fine
   * o fino alla prossima decisione). `poiScelta` = dopo l'ultimo c'è una decisione.
   */
  get percorso(): { totale: number; poiScelta: boolean } {
    let n = this.storia.length
    const visti = new Set(this.storia.map((p) => p.id))
    let p: Passo | undefined = this.passo
    while (p && !p.scelte?.length) {
      const dopo = this.prossimoDi(p)
      if (!dopo || visti.has(dopo.id)) break
      visti.add(dopo.id)
      n++
      p = dopo
    }
    return { totale: n, poiScelta: !!p?.scelte?.length }
  }

  /** true quando il passo corrente è finito e bisogna scegliere. */
  get inDecisione(): boolean {
    return !!this.passo.scelte?.length && this.t >= this.durata
  }

  /** true quando si è alla fine dell'ultimo passo (nessun seguito, nessuna scelta). */
  get finito(): boolean {
    return !this.passo.scelte?.length && !this.prossimoDi(this.passo) && this.t >= this.durata
  }

  get statoInizioPasso(): StatoCampo {
    return this.inizi[this.inizi.length - 1]
  }

  /** Stato del campo da disegnare adesso. */
  statoCampo(): StatoCampo {
    return statoAlTempo(this.statoInizioPasso, this.passo, this.t)
  }

  prossimoDi(passo: Passo): Passo | undefined {
    return passo.prossimo ? this.trova(passo.prossimo) : undefined
  }

  private trova(id: string): Passo | undefined {
    return this.schema.passi.find((p) => p.id === id)
  }

  ricomincia(): void {
    this.storia = [this.schema.passi[0]]
    this.inizi = [statoDaSchema(this.schema)]
    this.t = 0
    this.inRiproduzione = false
  }

  play(): void {
    if (this.inDecisione) return // prima bisogna scegliere
    if (this.finito) this.ricomincia()
    this.inRiproduzione = true
  }

  /** Sceglie un'opzione alla decisione: si va all'inizio del passo di quel ramo. */
  scegli(indice: number): void {
    const scelta = this.passo.scelte?.[indice]
    const p = scelta && this.trova(scelta.vaiA)
    if (!p) return
    this.inRiproduzione = false
    this.t = this.durata
    this.entraIn(p)
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
      this.vaiAlProssimo() // se ci sono scelte resta qui, in decisione
    }
  }

  /** ⏭ Salta all'inizio del passo dopo (se c'è), altrimenti alla fine di questo (o alla decisione). */
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
      // se il passo prima aveva le scelte, si torna alla decisione (fine di quel passo)
      this.t = this.passo.scelte?.length ? this.durata : 0
    }
  }

  private vaiAlProssimo(): boolean {
    const p = this.prossimoDi(this.passo)
    if (!p) return false
    this.entraIn(p)
    return true
  }

  private entraIn(p: Passo): void {
    this.inizi.push(statoFinePasso(this.statoInizioPasso, this.passo))
    this.storia.push(p)
    this.t = 0
  }
}
