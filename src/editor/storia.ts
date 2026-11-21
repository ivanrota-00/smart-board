// Annulla / Ripeti: si tengono le versioni precedenti dello schema (copie complete, sono piccole).

export class Storia<T> {
  private passato: string[] = []
  private futuro: string[] = []
  private limite: number

  constructor(limite = 50) {
    this.limite = limite
  }

  /** Da chiamare PRIMA di applicare una modifica, con lo stato di adesso. */
  registra(attuale: T): void {
    this.passato.push(JSON.stringify(attuale))
    if (this.passato.length > this.limite) this.passato.shift()
    this.futuro = []
  }

  get puoAnnullare(): boolean {
    return this.passato.length > 0
  }

  get puoRipetere(): boolean {
    return this.futuro.length > 0
  }

  annulla(attuale: T): T | null {
    const prima = this.passato.pop()
    if (prima === undefined) return null
    this.futuro.push(JSON.stringify(attuale))
    return JSON.parse(prima) as T
  }

  ripeti(attuale: T): T | null {
    const dopo = this.futuro.pop()
    if (dopo === undefined) return null
    this.passato.push(JSON.stringify(attuale))
    return JSON.parse(dopo) as T
  }

  svuota(): void {
    this.passato = []
    this.futuro = []
  }
}
