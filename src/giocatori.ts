// Disegno dei giocatori e della palla + trascinamento col dito (pointer events).
import { limitaAllaVista, schermoAMetri, type Punto } from './coordinate'
import type { Giocatore, StatoCampo } from './stato'
import { creaSvg } from './svg'

const RAGGIO_GIOCATORE = 0.52 // metri: ~48 px di diametro su iPad
const RAGGIO_PALLA = 0.2
const RAGGIO_TOCCO_PALLA = 0.42 // area toccabile più grande della palla disegnata
const PALLA_SPOSTAMENTO = { x: 0.42, y: 0.42 } // palla in basso a destra di chi la ha (come nel PDF)
const SOLLEVA = 0.9 // metri: quanto si alza l'oggetto sopra il dito mentre lo trascini
const SOGLIA_MOVIMENTO = 0.2 // metri: sotto questa distanza è un tocco, non un trascinamento
const DISTANZA_PRESA_PALLA = 1.0 // metri: palla lasciata vicino a un attaccante → passa a lui

interface Trascinamento {
  tipo: 'giocatore' | 'palla'
  giocatore?: Giocatore
  dito: Punto // dove era il dito all'inizio
  origine: Punto // dove era l'oggetto all'inizio
  sollevato: boolean
}

export function montaGiocatori(svg: SVGSVGElement, stato: StatoCampo): void {
  const strato = creaSvg('g', { class: 'strato-giocatori' })
  const elementi = new Map<string, SVGGElement>()
  const anelliPalla = new Map<string, SVGCircleElement>()
  const attivi = new Map<number, Trascinamento>() // un trascinamento per ogni dito

  // --- Disegno ---------------------------------------------------------------

  for (const g of stato.giocatori) {
    const el = creaSvg('g', { class: `giocatore ${g.squadra}` })
    const anello = creaSvg('circle', {
      r: RAGGIO_GIOCATORE + 0.14,
      fill: 'none',
      stroke: '#e8692c',
      'stroke-width': 0.1,
    })
    anelliPalla.set(g.id, anello)

    if (g.squadra === 'att') {
      el.append(
        anello,
        creaSvg('circle', {
          r: RAGGIO_GIOCATORE,
          fill: '#1c1c1c',
          stroke: '#f2f2f2',
          'stroke-width': 0.09,
        }),
      )
    } else {
      el.append(
        anello,
        creaSvg('circle', {
          r: RAGGIO_GIOCATORE,
          fill: 'rgba(200, 40, 40, 0.28)',
          stroke: '#e04848',
          'stroke-width': 0.09,
        }),
      )
    }
    const testo = creaSvg('text', {
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': g.squadra === 'att' ? 0.58 : 0.44,
      fill: g.squadra === 'att' ? '#ffffff' : '#ffb0b0',
    })
    testo.textContent = g.label
    el.append(testo)

    el.addEventListener('pointerdown', (e) => inizia(e, { tipo: 'giocatore', giocatore: g }))
    elementi.set(g.id, el)
    strato.append(el)
  }

  const palla = creaSvg('g', { class: 'palla' })
  palla.append(
    creaSvg('circle', { r: RAGGIO_TOCCO_PALLA, fill: 'transparent' }),
    creaSvg('circle', {
      r: RAGGIO_PALLA,
      fill: '#e8692c',
      stroke: '#7a2e0c',
      'stroke-width': 0.05,
    }),
  )
  palla.addEventListener('pointerdown', (e) => inizia(e, { tipo: 'palla' }))

  svg.append(strato, palla) // la palla sta sopra i giocatori
  aggiornaTutto()

  // --- Aggiornamento grafica -------------------------------------------------

  function posizionePalla(): Punto {
    const p = stato.palla
    const chi = stato.giocatori.find((g) => g.id === p.inMano)
    if (chi) return { x: chi.x + PALLA_SPOSTAMENTO.x, y: chi.y + PALLA_SPOSTAMENTO.y }
    return { x: p.x, y: p.y }
  }

  function aggiornaGiocatore(g: Giocatore): void {
    elementi.get(g.id)?.setAttribute('transform', `translate(${g.x} ${g.y})`)
  }

  function aggiornaPalla(): void {
    const p = posizionePalla()
    palla.setAttribute('transform', `translate(${p.x} ${p.y})`)
    for (const [id, anello] of anelliPalla) {
      anello.setAttribute('display', id === stato.palla.inMano ? 'inline' : 'none')
    }
  }

  function aggiornaTutto(): void {
    stato.giocatori.forEach(aggiornaGiocatore)
    aggiornaPalla()
  }

  // --- Trascinamento ---------------------------------------------------------

  function giaInMovimento(t: Pick<Trascinamento, 'tipo' | 'giocatore'>): boolean {
    for (const a of attivi.values()) {
      if (a.tipo === t.tipo && a.giocatore === t.giocatore) return true
    }
    return false
  }

  function inizia(e: PointerEvent, t: Pick<Trascinamento, 'tipo' | 'giocatore'>): void {
    if (giaInMovimento(t)) return
    e.preventDefault()
    e.stopPropagation()
    const dito = schermoAMetri(svg, e.clientX, e.clientY)
    const origine = t.tipo === 'palla' ? posizionePalla() : { x: t.giocatore!.x, y: t.giocatore!.y }
    if (t.tipo === 'palla') {
      // la palla si stacca da chi la aveva e diventa libera mentre la sposti
      stato.palla = { inMano: null, x: origine.x, y: origine.y }
    }
    attivi.set(e.pointerId, { ...t, dito, origine, sollevato: false })
    svg.setPointerCapture(e.pointerId)

    const el = t.tipo === 'palla' ? palla : elementi.get(t.giocatore!.id)!
    el.parentNode?.appendChild(el) // porta in primo piano
    el.classList.add('in-trascinamento')
    aggiornaPalla()
  }

  svg.addEventListener('pointermove', (e) => {
    const t = attivi.get(e.pointerId)
    if (!t) return
    const dito = schermoAMetri(svg, e.clientX, e.clientY)
    const dx = dito.x - t.dito.x
    const dy = dito.y - t.dito.y
    if (!t.sollevato && Math.hypot(dx, dy) > SOGLIA_MOVIMENTO) t.sollevato = true
    if (!t.sollevato) return

    if (t.tipo === 'giocatore' && t.giocatore) {
      const p = limitaAllaVista(
        { x: t.origine.x + dx, y: t.origine.y + dy - SOLLEVA },
        RAGGIO_GIOCATORE,
      )
      t.giocatore.x = p.x
      t.giocatore.y = p.y
      aggiornaGiocatore(t.giocatore)
      if (stato.palla.inMano === t.giocatore.id) aggiornaPalla()
    } else {
      const p = limitaAllaVista(
        { x: t.origine.x + dx, y: t.origine.y + dy - SOLLEVA },
        RAGGIO_PALLA,
      )
      stato.palla.x = p.x
      stato.palla.y = p.y
      aggiornaPalla()
    }
  })

  function fine(e: PointerEvent): void {
    const t = attivi.get(e.pointerId)
    if (!t) return
    attivi.delete(e.pointerId)
    const el = t.tipo === 'palla' ? palla : elementi.get(t.giocatore!.id)
    el?.classList.remove('in-trascinamento')

    if (t.tipo === 'palla') {
      // Palla lasciata vicino a un attaccante → la prende lui
      const p = { x: stato.palla.x, y: stato.palla.y }
      let vicino: Giocatore | null = null
      let distanzaMin = DISTANZA_PRESA_PALLA
      for (const g of stato.giocatori) {
        if (g.squadra !== 'att') continue
        const d = Math.hypot(g.x - p.x, g.y - p.y)
        if (d < distanzaMin) {
          distanzaMin = d
          vicino = g
        }
      }
      if (vicino) stato.palla.inMano = vicino.id
      aggiornaPalla()
    }
  }

  svg.addEventListener('pointerup', fine)
  svg.addEventListener('pointercancel', fine)
}
