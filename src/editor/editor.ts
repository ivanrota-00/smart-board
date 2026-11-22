// Pannello dell'editor (solo schermi grandi): nome, passi, testi, posizioni iniziali (10a)
// + disegno delle azioni a tocchi, maniglie per correggere, tempi automatici (10b).
import type { Archivio } from '../archivio'
import { limitaAllaVista, schermoAMetri, type Punto } from '../coordinate'
import type { ModalitaDito, Tocco } from '../giocatori'
import { eMovimento, type AzioneMovimento, type AzionePalla, type Passo, type Schema } from '../schema'
import type { StatoCampo } from '../stato'
import { creaSvg } from '../svg'
import {
  aggiungiMovimento,
  aggiungiPassaggio,
  descriviAzione,
  eInsieme,
  eliminaAzione,
  impostaInsieme,
  inizioNuova,
  pallaAl,
  posizioneAl,
  spostaPunto,
  type EsitoAzione,
} from './azioni'
import {
  aggiungiPasso,
  duplicaPasso,
  eliminaPasso,
  impostaPalla,
  modificaPasso,
  ordinePassi,
  rinominaSchema,
  spostaGiocatore,
  statoInizioDi,
  type Esito,
} from './modello'
import {
  aggiungiOpzione,
  aggiungiScelta,
  eliminaScelta,
  modificaDomanda,
  modificaScelta,
  ramiDeiPassi,
  specchiaSchema,
  togliScelta,
} from './scelte'
import { Storia } from './storia'

export interface DipendenzeEditor {
  archivio: Archivio
  svg: SVGSVGElement
  /** Disegna sul campo lo stato e le frecce del passo. */
  disegnaCampo(stato: StatoCampo, passo: Passo): void
  modalitaGiocatori(m: ModalitaDito): void
  evidenziaGiocatore(id: string | null): void
  trovaFreccia(p: Punto): number | null
  evidenziaFreccia(indice: number | null): void
  /** L'utente ha toccato "Fine". */
  esci(schema: Schema): void
}

export interface ControlliEditor {
  readonly attivo: boolean
  apri(schema: Schema): void
  /** Il dito ha lasciato un giocatore o la palla dopo averli spostati. */
  quandoLasci(stato: StatoCampo): void
  /** Il dito ha toccato un giocatore o la palla (senza spostarli). */
  quandoTocchi(cosa: Tocco): void
}

type Strumento =
  | { tipo: 'niente' }
  | { tipo: 'giocatore'; id: string }
  | { tipo: 'percorso'; id: string; azione: AzioneMovimento['tipo']; punti: Punto[] }
  | { tipo: 'ricevitore'; id: string; azione: AzionePalla['tipo'] }
  | { tipo: 'azione'; indice: number }

const NOMI_AZIONE: Record<AzioneMovimento['tipo'] | AzionePalla['tipo'], string> = {
  taglio: 'Taglio',
  palleggio: 'Palleggio',
  blocco: 'Blocco',
  spostamento: 'Spostamento',
  passaggio: 'Passaggio',
  'hand-off': 'Hand-off',
}

const SOGLIA_TOCCO = 0.3 // metri: oltre questo spostamento non è un tocco
const RAGGIO_MANIGLIA = 0.45

export function montaEditor(contenitore: HTMLElement, dip: DipendenzeEditor): ControlliEditor {
  const box = document.createElement('aside')
  box.className = 'pannello pannello-editor'
  box.hidden = true
  box.innerHTML = `
    <div class="ed-testa">
      <button type="button" class="ed-fine">✓ Fine</button>
      <button type="button" class="ed-annulla" aria-label="Annulla">↶ Annulla</button>
      <button type="button" class="ed-ripeti" aria-label="Ripeti">↷ Ripeti</button>
      <button type="button" class="ed-specchia">⇆ Specchia</button>
    </div>
    <label class="ed-campo">Nome dello schema
      <input type="text" class="ed-nome" autocomplete="off" />
    </label>
    <p class="ed-sezione">Passi</p>
    <ol class="ed-passi"></ol>
    <div class="ed-passo">
      <label class="ed-campo">Titolo del passo
        <input type="text" class="ed-titolo" autocomplete="off" />
      </label>
      <label class="ed-campo">Testo (spiegazione)
        <textarea class="ed-testo" rows="2"></textarea>
      </label>
      <div class="ed-bottoni">
        <button type="button" class="ed-aggiungi">➕ Passo dopo</button>
        <button type="button" class="ed-duplica">⧉ Duplica</button>
        <button type="button" class="ed-elimina pericolo">🗑 Elimina</button>
      </div>
      <div class="ed-scelta"></div>
    </div>
    <p class="ed-sezione">Azioni del passo</p>
    <div class="ed-azioni"></div>
    <p class="ed-aiuto"></p>
  `
  contenitore.append(box)

  const q = <T extends Element>(s: string) => box.querySelector<T>(s)!
  const el = {
    fine: q<HTMLButtonElement>('.ed-fine'),
    annulla: q<HTMLButtonElement>('.ed-annulla'),
    ripeti: q<HTMLButtonElement>('.ed-ripeti'),
    nome: q<HTMLInputElement>('.ed-nome'),
    passi: q<HTMLOListElement>('.ed-passi'),
    titolo: q<HTMLInputElement>('.ed-titolo'),
    testo: q<HTMLTextAreaElement>('.ed-testo'),
    aggiungi: q<HTMLButtonElement>('.ed-aggiungi'),
    duplica: q<HTMLButtonElement>('.ed-duplica'),
    elimina: q<HTMLButtonElement>('.ed-elimina'),
    specchia: q<HTMLButtonElement>('.ed-specchia'),
    scelta: q<HTMLDivElement>('.ed-scelta'),
    azioni: q<HTMLDivElement>('.ed-azioni'),
    aiuto: q<HTMLParagraphElement>('.ed-aiuto'),
  }

  // Strato sul campo per anteprima del percorso e maniglie (sopra a tutto)
  const strato = creaSvg('g', { class: 'strato-editor' })

  let schema: Schema | null = null
  let selezionato = ''
  let strumento: Strumento = { tipo: 'niente' }
  let insieme = false // per la prossima azione nuova
  const storia = new Storia<Schema>()

  const passoSel = (): Passo => schema!.passi.find((p) => p.id === selezionato) ?? schema!.passi[0]
  const ePrimo = () => schema!.passi[0].id === selezionato
  const giocatore = (id: string) => schema!.giocatori.find((g) => g.id === id)
  const nome = (id: string) => giocatore(id)?.label ?? id

  function salva(): void {
    if (schema && !dip.archivio.salva(schema)) {
      el.aiuto.textContent = '⚠️ Non riesco a salvare (memoria del browser non disponibile).'
    }
  }

  /** Applica una modifica che si può annullare. */
  function applica(nuovo: Schema, nuovoSelezionato?: string): void {
    storia.registra(schema!)
    schema = nuovo
    if (nuovoSelezionato && nuovoSelezionato !== selezionato) {
      selezionato = nuovoSelezionato
      strumento = { tipo: 'niente' }
    }
    salva()
    disegna()
  }

  function applicaEsito(e: Esito): void {
    if (e.ok) applica(e.schema, e.id)
    else alert(e.motivo)
  }

  function applicaAzione(e: EsitoAzione): void {
    if (!e.ok) {
      alert(e.motivo)
      return
    }
    strumento = { tipo: 'niente' }
    insieme = false
    applica(e.schema)
  }

  // --- Pannello ------------------------------------------------------------------

  const bottone = (testo: string, azione: () => void, classe = ''): HTMLButtonElement => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = testo
    if (classe) b.className = classe
    b.addEventListener('click', azione)
    return b
  }

  const riga = (...figli: HTMLElement[]) => {
    const d = document.createElement('div')
    d.className = 'ed-bottoni'
    d.append(...figli)
    return d
  }

  const testoP = (t: string, classe = 'ed-istruzione') => {
    const p = document.createElement('p')
    p.className = classe
    p.textContent = t
    return p
  }

  /**
   * Quando parte l'azione: due bottoni grandi "Dopo le altre" / "Insieme all'ultima".
   * Sulla prima azione del passo non c'è scelta: parte subito (lo diciamo invece di disattivare).
   */
  const quando = (insiemeOra: boolean, primaAzione: boolean, cambia: (v: boolean) => void): HTMLElement => {
    if (primaAzione) return testoP('È la prima azione del passo: parte subito.', 'ed-vuoto')
    const d = document.createElement('div')
    d.className = 'ed-quando'
    const scelta = (testo: string, valore: boolean) => {
      const b = bottone(testo, () => {
        if (valore !== insiemeOra) cambia(valore)
      }, valore === insiemeOra ? 'attivo' : '')
      b.setAttribute('aria-pressed', String(valore === insiemeOra))
      return b
    }
    d.append(scelta('Dopo le altre', false), scelta('Insieme all’ultima', true))
    return d
  }

  function disegnaAzioni(): void {
    const p = passoSel()
    const figli: HTMLElement[] = []
    switch (strumento.tipo) {
      case 'niente': {
        figli.push(testoP('Tocca un giocatore per aggiungere un’azione, oppure una freccia (o una riga qui sotto) per modificarla.'))
        if (p.azioni.length) {
          const ol = document.createElement('ol')
          ol.className = 'ed-elenco-azioni'
          p.azioni.forEach((a, i) => {
            const li = document.createElement('li')
            li.append(
              bottone(`${descriviAzione(schema!, a)}${eInsieme(p, i) ? ' · insieme' : ''}`, () => {
                strumento = { tipo: 'azione', indice: i }
                disegna()
              }),
            )
            ol.append(li)
          })
          figli.push(ol)
        } else {
          figli.push(testoP('Nessuna azione in questo passo.', 'ed-vuoto'))
        }
        break
      }
      case 'giocatore': {
        const g = giocatore(strumento.id)!
        const id = strumento.id
        const t = inizioNuova(p, insieme)
        const haPalla = pallaAl(schema!, p, t) === id
        figli.push(testoP(g.squadra === 'att' ? `Azione per il ${g.label}:` : `Azione per ${g.label}:`, 'ed-titoletto'))
        const tipi: (AzioneMovimento['tipo'] | AzionePalla['tipo'])[] =
          g.squadra === 'att' ? ['taglio', 'palleggio', 'blocco', 'passaggio', 'hand-off', 'spostamento'] : ['spostamento']
        const griglia = document.createElement('div')
        griglia.className = 'ed-griglia'
        for (const tipo of tipi) {
          const serveP = tipo === 'palleggio' || tipo === 'passaggio' || tipo === 'hand-off'
          const b = bottone(NOMI_AZIONE[tipo], () => {
            strumento =
              tipo === 'passaggio' || tipo === 'hand-off'
                ? { tipo: 'ricevitore', id, azione: tipo }
                : { tipo: 'percorso', id, azione: tipo, punti: [] }
            disegna()
          })
          b.disabled = serveP && !haPalla
          griglia.append(b)
        }
        figli.push(griglia)
        if (!haPalla && g.squadra === 'att') figli.push(testoP('Palleggio, passaggio e hand-off solo per chi ha la palla in quel momento.', 'ed-vuoto'))
        figli.push(testoP('Quando parte?', 'ed-vuoto'))
        figli.push(
          quando(insieme, p.azioni.length === 0, (v) => {
            insieme = v
            disegna()
          }),
        )
        figli.push(riga(bottone('✕ Annulla', annullaStrumento)))
        break
      }
      case 'percorso': {
        const s = strumento
        figli.push(
          testoP(`${NOMI_AZIONE[s.azione]} del ${nome(s.id)}: tocca sul campo i punti del percorso, uno dopo l’altro (la linea si curva da sola).`, 'ed-titoletto'),
        )
        const fatto = bottone('✓ Fine percorso', () =>
          applicaAzione(aggiungiMovimento(schema!, p.id, s.azione, s.id, s.punti, insieme)),
          'ed-principale',
        )
        fatto.disabled = s.punti.length === 0
        const togli = bottone('↩ Togli punto', () => {
          s.punti.pop()
          disegna()
        })
        togli.disabled = s.punti.length === 0
        figli.push(riga(fatto, togli, bottone('✕ Annulla', annullaStrumento)))
        break
      }
      case 'ricevitore': {
        figli.push(testoP(`${NOMI_AZIONE[strumento.azione]} del ${nome(strumento.id)}: tocca il compagno che riceve.`, 'ed-titoletto'))
        figli.push(riga(bottone('✕ Annulla', annullaStrumento)))
        break
      }
      case 'azione': {
        const i = strumento.indice
        const a = p.azioni[i]
        if (!a) {
          strumento = { tipo: 'niente' }
          return disegnaAzioni()
        }
        figli.push(testoP(descriviAzione(schema!, a), 'ed-titoletto'))
        if (eMovimento(a)) figli.push(testoP('Trascina i cerchi gialli sul campo per correggere il percorso.', 'ed-vuoto'))
        figli.push(testoP('Quando parte?', 'ed-vuoto'))
        figli.push(quando(eInsieme(p, i), i === 0, (v) => applica(impostaInsieme(schema!, p.id, i, v))))
        figli.push(
          riga(
            bottone('🗑 Elimina azione', () => {
              strumento = { tipo: 'niente' }
              applica(eliminaAzione(schema!, p.id, i))
            }, 'pericolo'),
            bottone('Chiudi', annullaStrumento),
          ),
        )
        break
      }
    }
    el.azioni.replaceChildren(...figli)
  }

  function annullaStrumento(): void {
    strumento = { tipo: 'niente' }
    disegna()
  }

  /** Riquadro della scelta alla fine del passo: domanda, opzioni, rami. */
  function disegnaScelta(): void {
    const p = passoSel()
    const figli: HTMLElement[] = []
    if (!p.scelte?.length) {
      figli.push(bottone('🔀 Aggiungi una scelta (A/B) alla fine del passo', () => applicaEsito(aggiungiScelta(schema!, p.id))))
    } else {
      figli.push(testoP('Scelta alla fine del passo', 'ed-titoletto'))
      const domanda = document.createElement('textarea')
      domanda.rows = 2
      domanda.value = p.domanda ?? ''
      domanda.placeholder = 'Domanda (es. Decisione 1: passare al 5 o all’1?)'
      domanda.addEventListener('focus', () => storia.registra(schema!))
      domanda.addEventListener('input', () => {
        schema = modificaDomanda(schema!, p.id, domanda.value)
        salva()
      })
      const etDomanda = document.createElement('label')
      etDomanda.className = 'ed-campo'
      etDomanda.append('Domanda', domanda)
      figli.push(etDomanda)
      p.scelte.forEach((sc, i) => {
        const riga = document.createElement('div')
        riga.className = 'ed-opzione'
        const input = document.createElement('input')
        input.type = 'text'
        input.value = sc.etichetta
        input.setAttribute('aria-label', `Opzione ${i + 1}`)
        input.addEventListener('focus', () => storia.registra(schema!))
        input.addEventListener('input', () => {
          schema = modificaScelta(schema!, p.id, i, input.value)
          salva()
          disegnaElenco()
        })
        riga.append(
          input,
          bottone('Vai al ramo →', () => {
            selezionato = sc.vaiA
            strumento = { tipo: 'niente' }
            disegna()
          }),
          bottone('🗑', () => {
            if (!confirm(`Eliminare l’opzione "${sc.etichetta}" e tutti i passi del suo ramo?`)) return
            applicaEsito(eliminaScelta(schema!, p.id, i))
          }, 'pericolo'),
        )
        figli.push(riga)
      })
      const piu = bottone('➕ Opzione', () => applicaEsito(aggiungiOpzione(schema!, p.id)))
      piu.disabled = p.scelte.length >= 4
      figli.push(
        riga(
          piu,
          bottone('Togli la scelta', () => {
            if (!confirm('Togliere la scelta e TUTTI i passi dei suoi rami?')) return
            applicaEsito(togliScelta(schema!, p.id))
          }, 'pericolo'),
        ),
      )
    }
    el.scelta.replaceChildren(...figli)
  }

  function disegnaElenco(): void {
    const ordine = ordinePassi(schema!)
    const rami = ramiDeiPassi(schema!)
    el.passi.replaceChildren(
      ...ordine.map((p, i) => {
        const li = document.createElement('li')
        const ramo = rami.get(p.id)
        li.append(
          bottone(
            `${ramo ? `[${ramo}] ` : ''}${i + 1}. ${p.titolo || '(senza titolo)'}${p.scelte?.length ? ' · 🔀 scelta' : ''}`,
            () => {
              selezionato = p.id
              strumento = { tipo: 'niente' }
              disegna()
            },
            p.id === selezionato ? 'selezionato' : '',
          ),
        )
        return li
      }),
    )
  }

  // --- Campo: anteprima percorso e maniglie --------------------------------------

  const fmt = (pts: Punto[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')

  function disegnaStrato(): void {
    const p = passoSel()
    strato.replaceChildren()
    if (strumento.tipo === 'percorso') {
      const partenza = posizioneAl(schema!, p, strumento.id, inizioNuova(p, insieme))
      const pts = [partenza, ...strumento.punti]
      strato.append(
        creaSvg('path', {
          d: fmt(pts),
          fill: 'none',
          stroke: '#ffd400',
          'stroke-width': 0.09,
          'stroke-dasharray': '0.3 0.2',
          'stroke-linejoin': 'round',
        }),
      )
      for (const pt of strumento.punti)
        strato.append(creaSvg('circle', { cx: pt.x, cy: pt.y, r: 0.22, fill: '#ffd400' }))
    }
    if (strumento.tipo === 'azione') {
      const a = p.azioni[strumento.indice]
      if (a && eMovimento(a)) {
        a.percorso.forEach(([x, y], iPunto) => {
          const m = creaSvg('circle', {
            class: 'maniglia',
            cx: x,
            cy: y,
            r: RAGGIO_MANIGLIA,
            fill: 'rgba(255, 212, 0, 0.3)',
            stroke: '#ffd400',
            'stroke-width': 0.08,
          })
          m.addEventListener('pointerdown', (e) => iniziaManiglia(e, m, iPunto))
          strato.append(m)
        })
      }
    }
    dip.svg.append(strato) // sempre in cima
  }

  function disegna(): void {
    if (!schema) return
    const p = passoSel()
    selezionato = p.id
    if (document.activeElement !== el.nome) el.nome.value = schema.nome
    if (document.activeElement !== el.titolo) el.titolo.value = p.titolo
    if (document.activeElement !== el.testo) el.testo.value = p.testo
    disegnaElenco()
    disegnaScelta()
    disegnaAzioni()
    el.annulla.disabled = !storia.puoAnnullare
    el.ripeti.disabled = !storia.puoRipetere
    el.aiuto.textContent = ePrimo()
      ? 'Primo passo: puoi anche trascinare giocatori e palla per la situazione iniziale.'
      : 'Le posizioni di partenza si cambiano nel primo passo.'
    dip.disegnaCampo(statoInizioDi(schema, p.id), p)
    dip.evidenziaFreccia(strumento.tipo === 'azione' ? strumento.indice : null)
    dip.evidenziaGiocatore(
      strumento.tipo === 'giocatore' || strumento.tipo === 'percorso' || strumento.tipo === 'ricevitore' ? strumento.id : null,
    )
    dip.modalitaGiocatori(ePrimo() && strumento.tipo === 'niente' ? 'trascina' : 'tocco')
    disegnaStrato()
  }

  // --- Tocchi sul campo (fuori dai giocatori) ------------------------------------

  let toccoCampo: { id: number; p: Punto } | null = null
  let maniglia: { id: number; m: SVGCircleElement; iPunto: number; p: Punto } | null = null

  function iniziaManiglia(e: PointerEvent, m: SVGCircleElement, iPunto: number): void {
    e.preventDefault()
    e.stopPropagation()
    dip.svg.setPointerCapture(e.pointerId)
    maniglia = { id: e.pointerId, m, iPunto, p: schermoAMetri(dip.svg, e.clientX, e.clientY) }
  }

  dip.svg.addEventListener('pointerdown', (e) => {
    if (!schema) return
    toccoCampo = { id: e.pointerId, p: schermoAMetri(dip.svg, e.clientX, e.clientY) }
  })

  dip.svg.addEventListener('pointermove', (e) => {
    if (!maniglia || e.pointerId !== maniglia.id) return
    const p = limitaAllaVista(schermoAMetri(dip.svg, e.clientX, e.clientY), 0.3)
    maniglia.p = p
    maniglia.m.setAttribute('cx', String(p.x))
    maniglia.m.setAttribute('cy', String(p.y))
  })

  dip.svg.addEventListener('pointerup', (e) => {
    if (!schema) return
    if (maniglia && e.pointerId === maniglia.id) {
      const { iPunto, p } = maniglia
      maniglia = null
      if (strumento.tipo === 'azione') applica(spostaPunto(schema, passoSel().id, strumento.indice, iPunto, p))
      return
    }
    if (!toccoCampo || e.pointerId !== toccoCampo.id) return
    const inizio = toccoCampo.p
    toccoCampo = null
    const p = schermoAMetri(dip.svg, e.clientX, e.clientY)
    if (Math.hypot(p.x - inizio.x, p.y - inizio.y) > SOGLIA_TOCCO) return
    toccoSulCampo(limitaAllaVista(p, 0.3))
  })

  dip.svg.addEventListener('pointercancel', () => {
    toccoCampo = null
    maniglia = null
  })

  function toccoSulCampo(p: Punto): void {
    if (strumento.tipo === 'percorso') {
      strumento.punti.push(p)
      disegna()
      return
    }
    if (strumento.tipo === 'ricevitore') return // serve un compagno, non un punto
    const freccia = dip.trovaFreccia(p)
    strumento = freccia !== null ? { tipo: 'azione', indice: freccia } : { tipo: 'niente' }
    disegna()
  }

  // --- Campi di testo e bottoni --------------------------------------------------

  // Un punto di "annulla" quando entri nel campo, poi aggiornamento a ogni lettera
  const campoTesto = (input: HTMLInputElement | HTMLTextAreaElement, aggiorna: (v: string) => Schema) => {
    input.addEventListener('focus', () => schema && storia.registra(schema))
    input.addEventListener('input', () => {
      if (!schema) return
      schema = aggiorna(input.value)
      salva()
      disegnaElenco()
      el.annulla.disabled = false
    })
  }
  campoTesto(el.nome, (v) => rinominaSchema(schema!, v.trim() || 'Senza nome'))
  campoTesto(el.titolo, (v) => modificaPasso(schema!, selezionato, { titolo: v }))
  campoTesto(el.testo, (v) => modificaPasso(schema!, selezionato, { testo: v }))

  el.aggiungi.addEventListener('click', () => applicaEsito(aggiungiPasso(schema!, selezionato)))
  el.duplica.addEventListener('click', () => applicaEsito(duplicaPasso(schema!, selezionato)))
  el.elimina.addEventListener('click', () => {
    if (!confirm(`Eliminare il passo "${passoSel().titolo}"?`)) return
    applicaEsito(eliminaPasso(schema!, selezionato))
  })
  const cambiaVersione = (v: Schema | null) => {
    if (!v) return
    schema = v
    strumento = { tipo: 'niente' }
    salva()
    disegna()
  }
  el.specchia.addEventListener('click', () => {
    if (!confirm('Specchiare tutto lo schema (destra ↔ sinistra)? I testi non cambiano.')) return
    applica(specchiaSchema(schema!))
  })
  el.annulla.addEventListener('click', () => cambiaVersione(storia.annulla(schema!)))
  el.ripeti.addEventListener('click', () => cambiaVersione(storia.ripeti(schema!)))
  el.fine.addEventListener('click', () => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    const finito = schema!
    box.hidden = true
    schema = null
    strumento = { tipo: 'niente' }
    strato.remove()
    dip.evidenziaGiocatore(null)
    dip.evidenziaFreccia(null)
    dip.modalitaGiocatori('bloccato')
    dip.esci(finito)
  })

  return {
    get attivo() {
      return schema !== null
    },
    apri(s: Schema) {
      schema = JSON.parse(JSON.stringify(s)) as Schema
      selezionato = schema.passi[0].id
      strumento = { tipo: 'niente' }
      insieme = false
      storia.svuota()
      box.hidden = false
      disegna()
    },
    quandoLasci(stato: StatoCampo) {
      if (!schema || !ePrimo()) return
      let nuovo = schema
      for (const g of stato.giocatori) {
        const prima = schema.giocatori.find((x) => x.id === g.id)
        if (prima && (prima.x !== g.x || prima.y !== g.y)) nuovo = spostaGiocatore(nuovo, g.id, g)
      }
      // palla: si salva solo se è in mano a qualcuno (lasciata lontano torna dov'era)
      if (stato.palla.inMano && stato.palla.inMano !== schema.palla.inMano) {
        nuovo = impostaPalla(nuovo, stato.palla.inMano)
      }
      if (nuovo !== schema) applica(nuovo)
      else disegna()
    },
    quandoTocchi(cosa: Tocco) {
      if (!schema) return
      const p = passoSel()
      // la palla conta come chi la tiene in quel momento
      const id = cosa.tipo === 'giocatore' ? cosa.id : pallaAl(schema, p, inizioNuova(p, insieme))
      if (!id) return
      switch (strumento.tipo) {
        case 'percorso': {
          // toccare un giocatore mentre disegni = punto del percorso lì (es. blocco su un compagno)
          const pos = statoInizioDi(schema, p.id).giocatori.find((g) => g.id === id)
          if (pos) strumento.punti.push({ x: pos.x, y: pos.y })
          break
        }
        case 'ricevitore':
          if (id !== strumento.id) {
            applicaAzione(aggiungiPassaggio(schema, p.id, strumento.azione, strumento.id, id, insieme))
            return
          }
          break
        default:
          strumento = strumento.tipo === 'giocatore' && strumento.id === id ? { tipo: 'niente' } : { tipo: 'giocatore', id }
      }
      disegna()
    },
  }
}
