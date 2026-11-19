import './style.css'
import { VISTA } from './coordinate'
import { disegnaCampo } from './campo'
import { creaSvg } from './svg'

// Safari su iPad ignora "user-scalable=no": blocchiamo lo zoom con due dita a mano.
document.addEventListener('gesturestart', (e) => e.preventDefault())

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Manca #app')

const svg = creaSvg('svg', {
  class: 'campo',
  viewBox: `${VISTA.x} ${VISTA.y} ${VISTA.larghezza} ${VISTA.altezza}`,
  'aria-label': 'Mezzo campo da basket',
})
disegnaCampo(svg)

const pannello = document.createElement('aside')
pannello.className = 'pannello'
pannello.innerHTML = `
  <h1>Smart Board 🏀</h1>
  <p>Fase 2 — trascina i giocatori e la palla col dito.</p>
`

app.append(svg, pannello)
