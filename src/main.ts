import './style.css'
import { Archivio } from './archivio'
import { VISTA } from './coordinate'
import { disegnaCampo } from './campo'
import { montaFrecce } from './frecce'
import { montaGiocatori, type Tocco } from './giocatori'
import { copiaSchema, idDaNome } from './editor/modello'
import { montaEditor } from './editor/editor'
import { montaLibreria } from './libreria'
import { Player, VELOCITA } from './player'
import { playbook } from './playbook'
import type { Passo, Schema } from './schema'
import type { StatoCampo } from './stato'
import { creaSvg } from './svg'

// App installabile e offline: il service worker si attiva solo nella versione pubblicata
// (in sviluppo darebbe fastidio salvando copie vecchie dei file).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* senza service worker l'app funziona lo stesso, solo non offline */
    })
  })
}

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

// Salvataggio locale: schemi importati, ultimo schema aperto, velocità
const memoria = (() => {
  try {
    return window.localStorage
  } catch {
    return null
  }
})()
const archivio = new Archivio(memoria, playbook)

let schema: Schema = (archivio.ultimo && archivio.trova(archivio.ultimo)) || playbook[0]
let player = new Player(schema)
player.velocita = archivio.velocita ?? 1
const frecce = montaFrecce(stratoFrecce)
// Quando il dito lascia un giocatore: lo gestisce l'editor (nel player il trascinamento è bloccato)
const quandoLasci = (s: StatoCampo) => editor.quandoLasci(s)
const quandoTocchi = (t: Tocco) => editor.quandoTocchi(t)
let giocatori = montaGiocatori(svg, player.statoCampo(), quandoLasci, quandoTocchi)
giocatori.blocca(true) // nel player non si trascina; si trascina solo nell'editor

// --- Pannello a destra ---------------------------------------------------------
const pannello = document.createElement('aside')
pannello.className = 'pannello'
pannello.innerHTML = `
  <div class="intestazione">
    <div class="bottoni-testa">
      <button type="button" id="apri-libreria" class="apri-libreria">📚 Libreria</button>
      <button type="button" id="modifica" class="apri-libreria solo-grande">✏️ Modifica</button>
    </div>
    <h1 id="nome"></h1>
  </div>
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
    <div class="riga tasti">
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

function mostraIntestazione(): void {
  el.nome.textContent = schema.nome
  el.premessa.textContent = schema.premessa ?? ''
}
mostraIntestazione()

const bottoniVelocita = VELOCITA.map((v) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = `${String(v).replace('.', ',')}×`
  b.addEventListener('click', () => {
    player.velocita = v
    archivio.velocita = v
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
  const eraInDecisione = !el.decisione.hidden
  el.decisione.hidden = !player.inDecisione
  pannello.classList.toggle('in-decisione', player.inDecisione)
  // appena compare la decisione, assicuriamoci che si veda (schermi piccoli)
  if (player.inDecisione && !eraInDecisione) el.decisione.scrollIntoView({ block: 'nearest' })
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

// --- Avviso "come installare" (solo nel browser del telefono/tablet, non nell'app installata) ---
function mostraAvvisoInstalla(): void {
  const installata =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (installata) return
  try {
    if (localStorage.getItem('smartboard.avvisoInstalla') === 'chiuso') return
  } catch {
    /* senza memoria lo mostriamo comunque */
  }
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const android = /Android/.test(ua)
  if (!ios && !android) return

  const avviso = document.createElement('div')
  avviso.className = 'avviso-installa'
  const testo = document.createElement('p')
  testo.textContent = ios
    ? 'Per usarla come app, anche offline: in Safari tocca Condividi (o ⋯ → Condividi) e poi "Aggiungi alla schermata Home".'
    : 'Per usarla come app, anche offline: nel menu ⋮ di Chrome tocca "Installa app" (o "Aggiungi a schermata Home"). Se l’hai aperta da WhatsApp, prima scegli "Apri in Chrome".'
  const chiudi = document.createElement('button')
  chiudi.type = 'button'
  chiudi.textContent = '✕'
  chiudi.setAttribute('aria-label', 'Chiudi avviso')
  chiudi.addEventListener('click', () => {
    avviso.remove()
    try {
      localStorage.setItem('smartboard.avvisoInstalla', 'chiuso')
    } catch {
      /* niente */
    }
  })
  avviso.append(testo, chiudi)
  document.body.append(avviso)
}
mostraAvvisoInstalla()

// --- Libreria ---------------------------------------------------------------------
function apriSchema(nuovo: Schema): void {
  const velocita = player.velocita
  schema = nuovo
  player = new Player(schema)
  player.velocita = velocita
  archivio.ultimo = schema.id
  // giocatori nuovi (lo schema può averne di diversi)
  giocatori.distruggi()
  giocatori = montaGiocatori(svg, player.statoCampo(), quandoLasci, quandoTocchi)
  giocatori.blocca(true)
  passoMostrato = null
  mostraIntestazione()
  disegna()
}

// --- Editor (solo schermi grandi) ----------------------------------------------------
const editor = montaEditor(app, {
  archivio,
  svg,
  disegnaCampo(stato, passo) {
    frecce.mostraPasso(stato, passo)
    frecce.aggiorna(0)
    giocatori.mostra(stato)
    passoMostrato = null // al ritorno nel player si ridisegna tutto
  },
  modalitaGiocatori(m) {
    giocatori.modalita(m)
  },
  evidenziaGiocatore(id) {
    giocatori.evidenzia(id)
  },
  trovaFreccia(p) {
    return frecce.trova(p)
  },
  evidenziaFreccia(i) {
    frecce.evidenzia(i)
  },
  esci(modificato) {
    pannello.hidden = false
    apriSchema(modificato)
  },
})

function avviaModifica(s: Schema): void {
  player.pausa()
  cancelAnimationFrame(animazione)
  animazione = 0
  let daModificare = s
  if (archivio.ePredefinito(s.id)) {
    const domanda = `"${s.nome}" fa parte del playbook della squadra.\nCreo una tua copia da modificare? (L'originale resta com'è.)`
    if (!confirm(domanda)) return
    daModificare = copiaSchema(s, idDaNome(`${s.nome} copia`, (id) => !!archivio.trova(id)), `${s.nome} (copia)`)
    archivio.salva(daModificare)
    apriSchema(daModificare)
  }
  pannello.hidden = true
  editor.apri(daModificare)
}

$<HTMLButtonElement>('modifica').addEventListener('click', () => avviaModifica(schema))

const libreria = montaLibreria(app, archivio, apriSchema, (nuovo) => {
  apriSchema(nuovo)
  avviaModifica(nuovo)
})
$<HTMLButtonElement>('apri-libreria').addEventListener('click', () => {
  player.pausa()
  disegna()
  libreria.apri()
})

disegna()
