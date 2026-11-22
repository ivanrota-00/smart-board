// Disegno delle frecce di un passo (taglio, passaggio, palleggio, blocco, hand-off).
// Non si distinguono solo per colore: anche per tratteggio, onda e forma della fine.
import type { Punto } from './coordinate'
import { accorcia, campionaCurva, ondula, puntoADistanza, lunghezza } from './geometria'
import { posizioneAlTempo } from './motore'
import { eMovimento, type Azione, type Passo } from './schema'
import type { StatoCampo } from './stato'
import { creaSvg } from './svg'

const STILE = {
  taglio: { colore: '#f4f1ea' },
  passaggio: { colore: '#3fd17f', tratteggio: '0.38 0.26' },
  palleggio: { colore: '#5aa2ff' },
  blocco: { colore: '#f4f1ea' },
  'hand-off': { colore: '#f4f1ea' },
} as const

const SPESSORE = 0.11
const PUNTA = { lunghezza: 0.5, larghezza: 0.46 }
const STANGHETTA_BLOCCO = 0.8 // lunghezza della "T" finale del blocco
const STANGHETTE_HANDOFF = { lunghezza: 0.55, distanza: 0.18 }
const STACCO_GIOCATORE = 0.62 // la freccia parte dal bordo del giocatore, non dal centro
const ONDA = { ampiezza: 0.16, lunghezza: 0.55 }
const DISSOLVENZA = 0.4 // secondi: quanto ci mette una freccia a sparire a fine azione

interface FrecciaDisegnata {
  el: SVGGElement
  fine: number // secondo in cui finisce l'azione
  linea: Punto[] // per capire se il dito l'ha toccata
  indice: number // posizione dell'azione nel passo
}

const DISTANZA_TOCCO = 0.5 // metri: un tocco entro questa distanza dalla linea seleziona la freccia

/** Distanza di un punto da una spezzata. */
function distanzaDaLinea(p: Punto, linea: Punto[]): number {
  let min = Infinity
  for (let i = 1; i < linea.length; i++) {
    const a = linea[i - 1]
    const b = linea[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l2 = dx * dx + dy * dy
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2))
    min = Math.min(min, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)))
  }
  return min
}

export interface ControlliFrecce {
  /** Disegna le frecce del passo, calcolate a partire dallo stato `inizio`. */
  mostraPasso(inizio: StatoCampo, passo: Passo): void
  /** Aggiorna la visibilità al secondo t (le frecce delle azioni finite spariscono). */
  aggiorna(t: number): void
  /** Indice dell'azione la cui freccia passa vicino al punto toccato (null = nessuna). */
  trova(p: Punto): number | null
  /** Mette in risalto una freccia e attenua le altre (null = tutte normali). */
  evidenzia(indice: number | null): void
}

const d = (punti: Punto[]) =>
  punti.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')

/** Triangolo della punta con la base in `base` e orientato secondo `dir`. */
function punta(base: Punto, dir: Punto, colore: string): SVGPathElement {
  const cima = { x: base.x + dir.x * PUNTA.lunghezza, y: base.y + dir.y * PUNTA.lunghezza }
  const w = PUNTA.larghezza / 2
  const sx = { x: base.x - dir.y * w, y: base.y + dir.x * w }
  const dx = { x: base.x + dir.y * w, y: base.y - dir.x * w }
  return creaSvg('path', { d: `${d([sx, cima, dx])} Z`, fill: colore, stroke: 'none' })
}

/** Segmento perpendicolare alla direzione, centrato in `centro`. */
function stanghetta(centro: Punto, dir: Punto, lung: number, colore: string): SVGLineElement {
  const h = lung / 2
  return creaSvg('line', {
    x1: centro.x - dir.y * h,
    y1: centro.y + dir.x * h,
    x2: centro.x + dir.y * h,
    y2: centro.y - dir.x * h,
    stroke: colore,
    'stroke-width': SPESSORE * 1.2,
    'stroke-linecap': 'round',
  })
}

/** Linea (già accorciata) + fine giusta per il tipo. */
function disegnaFreccia(tipo: Exclude<Azione['tipo'], 'spostamento'>, linea: Punto[]): SVGGElement {
  const stile = STILE[tipo]
  const g = creaSvg('g', { class: `freccia ${tipo}` })
  const lineaAttr = {
    fill: 'none',
    stroke: stile.colore,
    'stroke-width': SPESSORE,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }

  if (tipo === 'blocco') {
    g.append(creaSvg('path', { d: d(linea), ...lineaAttr }))
    const fine = puntoADistanza(linea, lunghezza(linea))
    g.append(stanghetta(fine.p, fine.dir, STANGHETTA_BLOCCO, stile.colore))
    return g
  }

  // Le altre frecce hanno la punta: la linea si ferma alla base della punta
  const corpo = accorcia(linea, 0, PUNTA.lunghezza)
  const base = puntoADistanza(linea, lunghezza(linea) - PUNTA.lunghezza)
  if (corpo.length >= 2) {
    if (tipo === 'palleggio') {
      // onda su tutto il corpo tranne l'ultimo tratto, che resta dritto verso la punta
      const ondaFino = Math.max(0, lunghezza(corpo) - 0.3)
      const ondulata = ondula(accorcia(corpo, 0, lunghezza(corpo) - ondaFino), ONDA.ampiezza, ONDA.lunghezza)
      g.append(creaSvg('path', { d: d([...ondulata, base.p]), ...lineaAttr }))
    } else if (tipo === 'passaggio') {
      g.append(
        creaSvg('path', { d: d(corpo), ...lineaAttr, 'stroke-dasharray': STILE.passaggio.tratteggio }),
      )
    } else {
      g.append(creaSvg('path', { d: d(corpo), ...lineaAttr }))
    }
  }
  g.append(punta(base.p, base.dir, stile.colore))

  if (tipo === 'hand-off') {
    const meta = lunghezza(linea) / 2
    for (const s of [-1, 1]) {
      const m = puntoADistanza(linea, meta + (s * STANGHETTE_HANDOFF.distanza) / 2)
      g.append(stanghetta(m.p, m.dir, STANGHETTE_HANDOFF.lunghezza, stile.colore))
    }
  }
  return g
}

export function montaFrecce(strato: SVGGElement): ControlliFrecce {
  let disegnate: FrecciaDisegnata[] = []

  return {
    mostraPasso(inizio, passo) {
      strato.replaceChildren()
      disegnate = []
      passo.azioni.forEach((a, indice) => {
        if (a.tipo === 'spostamento') return
        let linea: Punto[]
        if (eMovimento(a)) {
          const partenza = posizioneAlTempo(inizio, passo, a.giocatore, a.inizio)
          const curva = campionaCurva([partenza, ...a.percorso.map(([x, y]) => ({ x, y }))])
          linea = accorcia(curva, STACCO_GIOCATORE, 0)
        } else {
          const da = posizioneAlTempo(inizio, passo, a.da, a.inizio)
          const ad = posizioneAlTempo(inizio, passo, a.a, a.inizio + a.durata)
          linea = accorcia([da, ad], STACCO_GIOCATORE, STACCO_GIOCATORE)
        }
        if (linea.length < 2) return
        const el = disegnaFreccia(a.tipo, linea)
        strato.append(el)
        disegnate.push({ el, fine: a.inizio + a.durata, linea, indice })
      })
    },
    trova(p) {
      let migliore: FrecciaDisegnata | null = null
      let min = DISTANZA_TOCCO
      for (const f of disegnate) {
        const d = distanzaDaLinea(p, f.linea)
        if (d < min) {
          min = d
          migliore = f
        }
      }
      return migliore ? migliore.indice : null
    },
    evidenzia(indice) {
      for (const f of disegnate) {
        f.el.classList.toggle('selezionata', indice !== null && f.indice === indice)
        f.el.classList.toggle('attenuata', indice !== null && f.indice !== indice)
      }
    },
    aggiorna(t) {
      for (const f of disegnate) {
        const opacita = t <= f.fine ? 1 : Math.max(0, 1 - (t - f.fine) / DISSOLVENZA)
        f.el.setAttribute('opacity', opacita.toFixed(2))
      }
    },
  }
}
