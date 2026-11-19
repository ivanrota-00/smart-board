import './style.css'
import { VISTA } from './coordinate'
import { disegnaCampo } from './campo'
import { montaFrecce } from './frecce'
import { montaGiocatori } from './giocatori'
import { Player, VELOCITA } from './player'
import { triangolo } from './schemi/triangolo'
import type { Passo } from './schema'
import { creaSvg } from './svg'

// Safari su iPad ignora "user-scalable=no": blocchiamo lo zoom con due dita a mano.
document.addEventListener('gesturestart', (e) => e.preventDefault())

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Manca #app')

// --- Campo -------------------------------------------------------------------
const svg = creaSvg('svg', {
  class: 'campo',
  viewBox: `${VISTA.x} ${VISTA.y} ${VISTA.larghezza} ${VISTA.altezza}`,
  'aria-label': 'Mezzo campo da basket',
})
disegnaCampo(svg)
const stratoFrecce = creaSvg('g', { class: 'strato-frecce' }) // sotto i giocatori
svg.append(stratoFrecce)

const schema = triangolo
const player = new Player(schema)
const frecce = montaFrecce(stratoFrecce)
const giocatori = montaGiocatori(svg, player.statoCampo())
giocatori.blocca(true) // nel player non si trascina (tornerà con l'editor, Fase 9)

// --- Pannello a destra ---------------------------------------------------------
const pannello = document.createElement('aside')
pannello.className = 'pannello'
pannello.innerHTML = `
  <h1 id="nome"></h1>
  <p class="premessa" id="premessa"></p>
  <div class="passo">
    <p class="numero" id="numero"></p>
    <h2 id="titolo"></h2>
    <p id="testo"></p>
  </div>
  <div class="decisione" id="decisione" hidden>
    <p id="domanda"></p>
    <div class="bottoni-scelta" id="bottoni-scelta"></div>
  </div>
  <div class="comandi">
    <div class="barra"><div class="barra-piena" id="barra"></div></div>
    <div class="riga">
      <button type="button" id="indietro" aria-label="Indietro">⏮&#xFE0E;</button>
      <button type="button" id="play" class="principale" aria-label="Play">▶&#xFE0E;</button>
      <button type="button" id="avanti" aria-label="Avanti">⏭&#xFE0E;</button>
    </div>
    <div class="riga velocita" id="velocita"></div>
    <button type="button" id="ricomincia" class="largo">↺ Dall'inizio</button>
  </div>
`
app.append(svg, pannello)

const $ = <T extends HTMLElement>(id: string) => pannello.querySelector<T>(`#${id}`)!
const el = {
  nome: $('nome'),
  premessa: $('premessa'),
  numero: $('numero'),
  titolo: $('titolo'),
  testo: $('testo'),
  barra: $('barra'),
  play: $<HTMLButtonElement>('play'),
  indietro: $<HTMLButtonElement>('indietro'),
  avanti: $<HTMLButtonElement>('avanti'),
  ricomincia: $<HTMLButtonElement>('ricomincia'),
  velocita: $('velocita'),
  decisione: $('decisione'),
  domanda: $('domanda'),
  bottoniScelta: $('bottoni-scelta'),
}

el.nome.textContent = schema.nome
el.premessa.textContent = schema.premessa ?? ''

const bottoniVelocita = VELOCITA.map((v) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = `${String(v).replace('.', ',')}×`
  b.addEventListener('click', () => {
    player.velocita = v
    disegna()
  })
  el.velocita.append(b)
  return { v, b }
})

// --- Disegno dello stato del player ----------------------------------------------
let passoMostrato: Passo | null = null
let inizioMostrato: unknown = null

function disegna(): void {
  // Le frecce si ricalcolano solo quando cambia il passo
  if (player.passo !== passoMostrato || player.statoInizioPasso !== inizioMostrato) {
    passoMostrato = player.passo
    inizioMostrato = player.statoInizioPasso
    frecce.mostraPasso(player.statoInizioPasso, player.passo)
    const { totale, poiScelta } = player.percorso
    el.numero.textContent =
      totale === player.numero && poiScelta
        ? `Passo ${player.numero} · poi scelta`
        : `Passo ${player.numero} di ${totale}${poiScelta ? ' · poi scelta' : ''}`
    el.titolo.textContent = player.passo.titolo
    el.testo.textContent = player.passo.testo

    // Bottoni delle scelte (preparati qui, mostrati solo alla decisione)
    el.domanda.textContent = player.passo.domanda ?? 'Scegli come continuare:'
    el.bottoniScelta.replaceChildren(
      ...(player.passo.scelte ?? []).map((sc, i) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = sc.etichetta
        b.addEventListener('click', () => {
          player.scegli(i)
          disegna()
        })
        return b
      }),
    )
  }
  el.decisione.hidden = !player.inDecisione
  frecce.aggiorna(player.t)
  giocatori.mostra(player.statoCampo())

  const durata = player.durata
  el.barra.style.width = `${durata > 0 ? (player.t / durata) * 100 : 0}%`
  el.play.textContent = (player.inRiproduzione ? '⏸' : '▶') + '\uFE0E' // simbolo, non emoji
  el.play.setAttribute('aria-label', player.inRiproduzione ? 'Pausa' : 'Play')
  el.indietro.disabled = player.numero === 1 && player.t === 0
  el.avanti.disabled = player.finito || player.inDecisione
  el.play.disabled = player.inDecisione
  for (const { v, b } of bottoniVelocita) b.classList.toggle('attivo', v === player.velocita)
}

// --- Animazione (requestAnimationFrame) -------------------------------------------
let ultimo = 0
let animazione = 0

function fotogramma(ora: number): void {
  const dt = Math.min((ora - ultimo) / 1000, 0.1) // max 0,1 s: evita salti se la pagina era in pausa
  ultimo = ora
  player.avanza(dt)
  disegna()
  animazione = player.inRiproduzione ? requestAnimationFrame(fotogramma) : 0
}

function avviaCiclo(): void {
  if (animazione) return
  ultimo = performance.now()
  animazione = requestAnimationFrame(fotogramma)
}

el.play.addEventListener('click', () => {
  if (player.inRiproduzione) player.pausa()
  else {
    player.play()
    avviaCiclo()
  }
  disegna()
})
el.indietro.addEventListener('click', () => {
  player.indietro()
  disegna()
})
el.avanti.addEventListener('click', () => {
  player.avanti()
  disegna()
})
el.ricomincia.addEventListener('click', () => {
  player.ricomincia()
  disegna()
})

disegna()
