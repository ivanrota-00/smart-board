import './style.css'
import { VISTA } from './coordinate'
import { disegnaCampo } from './campo'
import { montaGiocatori } from './giocatori'
import { durataPasso, statoAlTempo, statoDaSchema } from './motore'
import { triangolo } from './schemi/triangolo'
import { copiaStato } from './stato'
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

const partenza = statoDaSchema(triangolo)
const giocatori = montaGiocatori(svg, copiaStato(partenza))

// --- Prova temporanea della Fase 3: anima il passo 1 del Triangolo ---------
// (Play/pausa, velocità e testi veri arrivano nella Fase 5)
const passo = triangolo.passi[0]

const pannello = document.createElement('aside')
pannello.className = 'pannello'
pannello.innerHTML = `
  <h1>Smart Board 🏀</h1>
  <p class="sottotitolo">${triangolo.nome} — ${passo.titolo}</p>
  <p>${passo.testo}</p>
  <div class="pulsanti">
    <button type="button" id="prova">▶ Prova passo 1</button>
    <button type="button" id="ricomincia">↺ Ricomincia</button>
  </div>
`
app.append(svg, pannello)

const btnProva = pannello.querySelector<HTMLButtonElement>('#prova')!
const btnRicomincia = pannello.querySelector<HTMLButtonElement>('#ricomincia')!
let animazione = 0 // id di requestAnimationFrame (0 = ferma)

function ferma(): void {
  cancelAnimationFrame(animazione)
  animazione = 0
  giocatori.blocca(false)
  btnProva.disabled = false
}

function avvia(): void {
  ferma()
  const durata = durataPasso(passo)
  const t0 = performance.now()
  giocatori.blocca(true)
  btnProva.disabled = true
  const fotogramma = (ora: number) => {
    const t = Math.min((ora - t0) / 1000, durata)
    giocatori.mostra(statoAlTempo(partenza, passo, t))
    if (t < durata) animazione = requestAnimationFrame(fotogramma)
    else ferma()
  }
  animazione = requestAnimationFrame(fotogramma)
}

btnProva.addEventListener('click', avvia)
btnRicomincia.addEventListener('click', () => {
  ferma()
  giocatori.mostra(partenza)
})
