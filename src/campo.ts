// Disegno del mezzo campo FIBA. Tutte le misure sono in metri.
import { FINE_CAMPO_EXTRA, VISTA } from './coordinate'
import { creaSvg } from './svg'

const LARGHEZZA = 15
const META_CAMPO = 14
const CANESTRO = { x: 7.5, y: 1.575 } // centro del ferro: 1,575 m dalla linea di fondo
const RAGGIO_FERRO = 0.225
const TABELLONE_Y = 1.2 // 1,2 m dalla linea di fondo, largo 1,8 m
const AREA = { sinistra: 5.05, destra: 9.95, profondita: 5.8 } // area larga 4,9 m, lunetta a 5,8 m
const RAGGIO_CERCHI = 1.8 // lunetta e cerchio centrale
const TRE_PUNTI_RAGGIO = 6.75
const TRE_PUNTI_DAL_BORDO = 0.9 // tratti dritti a 0,9 m dalle linee laterali
const NO_SFONDAMENTO = 1.25

export function disegnaCampo(svg: SVGSVGElement): void {
  const strato = creaSvg('g', { class: 'campo-disegno' })

  // Parquet (tutta l'area visibile) + leggera luce al centro, come nel PDF
  const defs = creaSvg('defs')
  const luce = creaSvg('radialGradient', { id: 'luce-parquet', cx: '50%', cy: '35%', r: '65%' })
  luce.append(
    creaSvg('stop', { offset: '0%', 'stop-color': '#6b563f' }),
    creaSvg('stop', { offset: '100%', 'stop-color': '#3f3226' }),
  )
  defs.append(luce)
  strato.append(
    defs,
    creaSvg('rect', {
      x: VISTA.x,
      y: VISTA.y,
      width: VISTA.larghezza,
      height: VISTA.altezza,
      fill: 'url(#luce-parquet)',
    }),
  )

  const linee = creaSvg('g', {
    fill: 'none',
    stroke: '#d9cbb8',
    'stroke-width': 0.06,
    'stroke-linecap': 'round',
  })

  // Linea di fondo e linee laterali (le laterali continuano nel pezzo extra)
  linee.append(
    creaSvg('path', {
      d: `M0 ${FINE_CAMPO_EXTRA} L0 0 L${LARGHEZZA} 0 L${LARGHEZZA} ${FINE_CAMPO_EXTRA}`,
    }),
  )

  // Metà campo + cerchio centrale (intero, come nel PDF)
  linee.append(
    creaSvg('line', { x1: 0, y1: META_CAMPO, x2: LARGHEZZA, y2: META_CAMPO }),
    creaSvg('circle', { cx: LARGHEZZA / 2, cy: META_CAMPO, r: RAGGIO_CERCHI }),
  )

  // Area dei 3 secondi
  linee.append(
    creaSvg('rect', {
      x: AREA.sinistra,
      y: 0,
      width: AREA.destra - AREA.sinistra,
      height: AREA.profondita,
    }),
  )

  // Lunetta: metà verso il fondo campo piena, metà dentro l'area tratteggiata
  const yLunetta = AREA.profondita
  const sx = LARGHEZZA / 2 - RAGGIO_CERCHI
  const dx = LARGHEZZA / 2 + RAGGIO_CERCHI
  const r = RAGGIO_CERCHI
  linee.append(
    creaSvg('path', { d: `M${sx} ${yLunetta} A${r} ${r} 0 0 0 ${dx} ${yLunetta}` }),
    creaSvg('path', {
      d: `M${sx} ${yLunetta} A${r} ${r} 0 0 1 ${dx} ${yLunetta}`,
      'stroke-dasharray': '0.3 0.25',
    }),
  )

  // Linea da 3 punti: tratti dritti + arco di raggio 6,75 m dal centro del ferro
  const xSx = TRE_PUNTI_DAL_BORDO
  const xDx = LARGHEZZA - TRE_PUNTI_DAL_BORDO
  const dxArco = CANESTRO.x - xSx
  const yInizioArco = CANESTRO.y + Math.sqrt(TRE_PUNTI_RAGGIO ** 2 - dxArco ** 2)
  const R3 = TRE_PUNTI_RAGGIO
  linee.append(
    creaSvg('path', {
      d: `M${xSx} 0 L${xSx} ${yInizioArco} A${R3} ${R3} 0 0 0 ${xDx} ${yInizioArco} L${xDx} 0`,
    }),
  )

  // Semicerchio di non sfondamento
  const rn = NO_SFONDAMENTO
  linee.append(
    creaSvg('path', {
      d:
        `M${CANESTRO.x - rn} ${TABELLONE_Y} L${CANESTRO.x - rn} ${CANESTRO.y} ` +
        `A${rn} ${rn} 0 0 0 ${CANESTRO.x + rn} ${CANESTRO.y} L${CANESTRO.x + rn} ${TABELLONE_Y}`,
      'stroke-width': 0.04,
      opacity: 0.6,
    }),
  )

  // Tabellone e ferro
  linee.append(
    creaSvg('line', {
      x1: CANESTRO.x - 0.9,
      y1: TABELLONE_Y,
      x2: CANESTRO.x + 0.9,
      y2: TABELLONE_Y,
      'stroke-width': 0.1,
    }),
    creaSvg('circle', {
      cx: CANESTRO.x,
      cy: CANESTRO.y,
      r: RAGGIO_FERRO,
      stroke: '#d9783a',
      'stroke-width': 0.06,
    }),
  )

  strato.append(linee)
  svg.append(strato)
}
