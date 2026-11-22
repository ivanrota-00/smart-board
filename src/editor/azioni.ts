// Operazioni dell'editor sulle AZIONI di un passo (pure, testabili).
// Tempi automatici: ogni azione nuova parte "dopo" tutte le altre oppure "insieme" all'ultima;
// la durata si calcola dalla lunghezza del percorso.
import type { Punto } from '../coordinate'
import { campionaCurva, lunghezza } from '../geometria'
import { durataPasso, posizioneAlTempo, statoAlTempo } from '../motore'
import { eMovimento, type Azione, type AzioneMovimento, type AzionePalla, type Passo, type Schema } from '../schema'
import { statoInizioDi } from './modello'

/** Velocità indicative in metri al secondo (per calcolare la durata). */
const VELOCITA: Record<AzioneMovimento['tipo'], number> = {
  taglio: 4.2,
  palleggio: 3.4,
  blocco: 3.2,
  spostamento: 3.8,
}

const arrotonda = (v: number, passo = 0.1) => Math.round(v / passo) * passo
const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const tondo = (p: Punto): [number, number] => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]
const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export function durataMovimento(tipo: AzioneMovimento['tipo'], punti: Punto[]): number {
  const l = lunghezza(campionaCurva(punti))
  return limita(arrotonda(l / VELOCITA[tipo]), 0.6, 3.5)
}

export function durataPalla(tipo: AzionePalla['tipo'], da: Punto, a: Punto): number {
  if (tipo === 'hand-off') return 0.5
  return limita(arrotonda(Math.hypot(a.x - da.x, a.y - da.y) / 14 + 0.3), 0.5, 1.1)
}

/** Quando parte un'azione nuova: alla fine di tutto il passo, oppure insieme all'ultima azione. */
export function inizioNuova(passo: Passo, insieme: boolean): number {
  const ultima = passo.azioni[passo.azioni.length - 1]
  return insieme && ultima ? ultima.inizio : durataPasso(passo)
}

/** true se l'azione parte insieme a quella prima di lei. */
export function eInsieme(passo: Passo, indice: number): boolean {
  return indice > 0 && passo.azioni[indice].inizio === passo.azioni[indice - 1].inizio
}

export type EsitoAzione = { ok: true; schema: Schema; indice: number } | { ok: false; motivo: string }

const etichetta = (schema: Schema, id: string) => schema.giocatori.find((g) => g.id === id)?.label ?? id

function conPasso(schema: Schema, passoId: string): { s: Schema; p: Passo } | null {
  const s = copia(schema)
  const p = s.passi.find((x) => x.id === passoId)
  return p ? { s, p } : null
}

/** Chi ha la palla al secondo t del passo. */
export function pallaAl(schema: Schema, passo: Passo, t: number): string | null {
  return statoAlTempo(statoInizioDi(schema, passo.id), passo, t).palla.inMano
}

/** Dove si trova un giocatore al secondo t del passo. */
export function posizioneAl(schema: Schema, passo: Passo, id: string, t: number): Punto {
  return posizioneAlTempo(statoInizioDi(schema, passo.id), passo, id, t)
}

export function aggiungiMovimento(
  schema: Schema,
  passoId: string,
  tipo: AzioneMovimento['tipo'],
  giocatore: string,
  percorso: Punto[],
  insieme: boolean,
): EsitoAzione {
  const x = conPasso(schema, passoId)
  if (!x) return { ok: false, motivo: 'Passo non trovato.' }
  if (percorso.length === 0) return { ok: false, motivo: 'Tocca almeno un punto del percorso.' }
  const inizio = inizioNuova(x.p, insieme)
  if (tipo === 'palleggio' && pallaAl(schema, x.p, inizio) !== giocatore)
    return { ok: false, motivo: `Il ${etichetta(schema, giocatore)} non ha la palla in quel momento: il palleggio si fa con la palla.` }
  const partenza = posizioneAl(schema, x.p, giocatore, inizio)
  const azione: AzioneMovimento = {
    tipo,
    giocatore,
    percorso: percorso.map(tondo),
    inizio,
    durata: durataMovimento(tipo, [partenza, ...percorso]),
  }
  x.p.azioni.push(azione)
  return { ok: true, schema: x.s, indice: x.p.azioni.length - 1 }
}

export function aggiungiPassaggio(
  schema: Schema,
  passoId: string,
  tipo: AzionePalla['tipo'],
  da: string,
  a: string,
  insieme: boolean,
): EsitoAzione {
  const x = conPasso(schema, passoId)
  if (!x) return { ok: false, motivo: 'Passo non trovato.' }
  if (da === a) return { ok: false, motivo: 'Scegli un compagno diverso.' }
  const inizio = inizioNuova(x.p, insieme)
  if (pallaAl(schema, x.p, inizio) !== da)
    return { ok: false, motivo: `Il ${etichetta(schema, da)} non ha la palla in quel momento.` }
  const pDa = posizioneAl(schema, x.p, da, inizio)
  const pA = posizioneAl(schema, x.p, a, inizio)
  x.p.azioni.push({ tipo, da, a, inizio, durata: durataPalla(tipo, pDa, pA) })
  return { ok: true, schema: x.s, indice: x.p.azioni.length - 1 }
}

/** Sposta un punto del percorso di un movimento (maniglia). La durata si ricalcola. */
export function spostaPunto(schema: Schema, passoId: string, indice: number, iPunto: number, nuovo: Punto): Schema {
  const x = conPasso(schema, passoId)
  if (!x) return schema
  const a = x.p.azioni[indice]
  if (!a || !eMovimento(a) || !a.percorso[iPunto]) return schema
  a.percorso[iPunto] = tondo(nuovo)
  const partenza = posizioneAl(schema, x.p, a.giocatore, a.inizio)
  a.durata = durataMovimento(a.tipo, [partenza, ...a.percorso.map(([px, py]) => ({ x: px, y: py }))])
  return x.s
}

export function eliminaAzione(schema: Schema, passoId: string, indice: number): Schema {
  const x = conPasso(schema, passoId)
  if (!x || !x.p.azioni[indice]) return schema
  x.p.azioni.splice(indice, 1)
  return x.s
}

/** "Insieme alla precedente" sì/no per un'azione già esistente (cambia solo quando parte). */
export function impostaInsieme(schema: Schema, passoId: string, indice: number, insieme: boolean): Schema {
  const x = conPasso(schema, passoId)
  if (!x || indice <= 0 || !x.p.azioni[indice]) return schema
  const prima = x.p.azioni.slice(0, indice)
  x.p.azioni[indice].inizio = insieme
    ? prima[prima.length - 1].inizio
    : Math.max(...prima.map((a) => a.inizio + a.durata))
  return x.s
}

/** Descrizione breve per l'elenco: "Taglio del 4", "Passaggio 4 → 2". */
export function descriviAzione(schema: Schema, a: Azione): string {
  const n = (id: string) => etichetta(schema, id)
  switch (a.tipo) {
    case 'taglio':
      return `Taglio del ${n(a.giocatore)}`
    case 'palleggio':
      return `Palleggio del ${n(a.giocatore)}`
    case 'blocco':
      return `Blocco del ${n(a.giocatore)}`
    case 'spostamento':
      return `Spostamento di ${n(a.giocatore)}`
    case 'passaggio':
      return `Passaggio ${n(a.da)} → ${n(a.a)}`
    case 'hand-off':
      return `Hand-off ${n(a.da)} → ${n(a.a)}`
  }
}
