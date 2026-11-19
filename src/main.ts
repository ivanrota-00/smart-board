import './style.css'
import { VISTA } from './coordinate'
import { disegnaCampo } from './campo'
import { montaFrecce } from './frecce'
import { montaGiocatori } from './giocatori'
import { durataPasso, statoAlTempo, statoDaSchema } from './motore'
import { passoProvaFrecce } from './schemi/prova-frecce'
import { triangolo } from './schemi/triangolo'
import type { Passo } from './schema'
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
const stratoFrecce = creaSvg('g', { class: 'strato-frecce' }) // sotto i giocatori
svg.append(stratoFrecce)

const partenza = statoDaSchema(triangolo)
const frecce = montaFrecce(stratoFrecce)
const giocatori = montaGiocatori(svg, copiaStato(partenza))

// --- Prove temporanee (Fasi 3–4): passo 1 del Triangolo e passo "Prova frecce" ---
// (Play/pausa, velocità e testi veri arrivano nella Fase 5)
let passo: Passo = triangolo.passi[0]

const pannello = document.createElement('aside')
pannello.className = 'pannello'
pannello.innerHTML = `
  <h1>Smart Board 🏀</h1>
  <p class="sottotitolo" id="titolo"></p>
  <p id="testo"></p>
  <div class="pulsanti">
    <button type="button" id="prova">▶ Prova passo 1</button>
    <button type="button" id="prova-frecce">▶ Prova frecce</button>
    <button type="button" id="ricomincia">↺ Ricomincia</button>
  </div>
`
app.append(svg, pannello)

const btnProva = pannello.querySelector<HTMLButtonElement>('#prova')!
const btnProvaFrecce = pannello.querySelector<HTMLButtonElement>('#prova-frecce')!
const titolo = pannello.querySelector<HTMLParagraphElement>('#titolo')!
const testo = pannello.querySelector<HTMLParagraphElement>('#testo')!
const btnRicomincia = pannello.querySelector<HTMLButtonElement>('#ricomincia')!
let animazione = 0 // id di requestAnimationFrame (0 = ferma)

function ferma(): void {
  cancelAnimationFrame(animazione)
  animazione = 0
  giocatori.blocca(false)
  btnProva.disabled = false
  btnProvaFrecce.disabled = false
}

/** Torna all'inizio del passo scelto: posizioni di partenza + tutte le sue frecce. */
function preparaPasso(nuovo: Passo): void {
  ferma()
  passo = nuovo
  titolo.textContent = `${triangolo.nome} — ${passo.titolo}`
  testo.textContent = passo.testo
  giocatori.mostra(partenza)
  frecce.mostraPasso(partenza, passo)
  frecce.aggiorna(0)
}

function avvia(nuovo: Passo): void {
  preparaPasso(nuovo)
  const durata = durataPasso(passo)
  const t0 = performance.now()
  giocatori.blocca(true)
  btnProva.disabled = true
  btnProvaFrecce.disabled = true
  const fotogramma = (ora: number) => {
    const t = Math.min((ora - t0) / 1000, durata)
    giocatori.mostra(statoAlTempo(partenza, passo, t))
    frecce.aggiorna(t)
    if (t < durata) animazione = requestAnimationFrame(fotogramma)
    else ferma()
  }
  animazione = requestAnimationFrame(fotogramma)
}

btnProva.addEventListener('click', () => avvia(triangolo.passi[0]))
btnProvaFrecce.addEventListener('click', () => avvia(passoProvaFrecce))
btnRicomincia.addEventListener('click', () => preparaPasso(passo))
preparaPasso(passo)
