// Pannello dell'editor (solo schermi grandi): nome, elenco passi, titolo/testo, aggiungi/duplica/elimina,
// annulla/ripeti, trascinamento dei giocatori nella situazione iniziale. Salvataggio automatico.
import type { Archivio } from '../archivio'
import type { Passo, Schema } from '../schema'
import type { StatoCampo } from '../stato'
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
import { Storia } from './storia'

export interface DipendenzeEditor {
  archivio: Archivio
  /** Disegna sul campo lo stato e le frecce del passo. */
  disegnaCampo(stato: StatoCampo, passo: Passo): void
  /** true = il dito può trascinare giocatori e palla. */
  trascinamento(attivo: boolean): void
  /** L'utente ha toccato "Fine". */
  esci(schema: Schema): void
}

export interface ControlliEditor {
  readonly attivo: boolean
  apri(schema: Schema): void
  /** Il dito ha lasciato un giocatore o la palla sul campo. */
  quandoLasci(stato: StatoCampo): void
}

export function montaEditor(contenitore: HTMLElement, dip: DipendenzeEditor): ControlliEditor {
  const box = document.createElement('aside')
  box.className = 'pannello pannello-editor'
  box.hidden = true
  box.innerHTML = `
    <div class="ed-testa">
      <button type="button" class="ed-fine">✓ Fine</button>
      <button type="button" class="ed-annulla" aria-label="Annulla">↶ Annulla</button>
      <button type="button" class="ed-ripeti" aria-label="Ripeti">↷ Ripeti</button>
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
        <textarea class="ed-testo" rows="3"></textarea>
      </label>
      <div class="ed-bottoni">
        <button type="button" class="ed-aggiungi">➕ Passo dopo</button>
        <button type="button" class="ed-duplica">⧉ Duplica</button>
        <button type="button" class="ed-elimina pericolo">🗑 Elimina</button>
      </div>
    </div>
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
    aiuto: q<HTMLParagraphElement>('.ed-aiuto'),
  }

  let schema: Schema | null = null
  let selezionato = ''
  const storia = new Storia<Schema>()

  const passoSel = (): Passo => schema!.passi.find((p) => p.id === selezionato) ?? schema!.passi[0]
  const ePrimo = () => schema!.passi[0].id === selezionato

  function salva(): void {
    if (schema && !dip.archivio.salva(schema)) {
      el.aiuto.textContent = '⚠️ Non riesco a salvare (memoria del browser non disponibile).'
    }
  }

  /** Applica una modifica che si può annullare. */
  function applica(nuovo: Schema, nuovoSelezionato?: string): void {
    storia.registra(schema!)
    schema = nuovo
    if (nuovoSelezionato) selezionato = nuovoSelezionato
    salva()
    disegna()
  }

  function applicaEsito(e: Esito): void {
    if (e.ok) applica(e.schema, e.id)
    else alert(e.motivo)
  }

  function disegnaElenco(): void {
    const ordine = ordinePassi(schema!)
    el.passi.replaceChildren(
      ...ordine.map((p, i) => {
        const li = document.createElement('li')
        const b = document.createElement('button')
        b.type = 'button'
        b.className = p.id === selezionato ? 'selezionato' : ''
        b.textContent = `${i + 1}. ${p.titolo || '(senza titolo)'}${p.scelte?.length ? ' · scelta' : ''}`
        b.addEventListener('click', () => {
          selezionato = p.id
          disegna()
        })
        li.append(b)
        return li
      }),
    )
  }

  function disegna(): void {
    if (!schema) return
    const p = passoSel()
    selezionato = p.id
    if (document.activeElement !== el.nome) el.nome.value = schema.nome
    if (document.activeElement !== el.titolo) el.titolo.value = p.titolo
    if (document.activeElement !== el.testo) el.testo.value = p.testo
    disegnaElenco()
    el.annulla.disabled = !storia.puoAnnullare
    el.ripeti.disabled = !storia.puoRipetere
    el.aiuto.textContent = ePrimo()
      ? 'Trascina giocatori e palla per la situazione iniziale. Lascia la palla vicino a un attaccante per dargliela.'
      : 'Qui vedi le posizioni all’inizio di questo passo. Le posizioni di partenza si cambiano nel primo passo; le azioni si disegneranno nella parte 10b.'
    dip.disegnaCampo(statoInizioDi(schema, p.id), p)
    dip.trascinamento(ePrimo())
  }

  // Campi di testo: un punto di "annulla" quando entri nel campo, poi aggiornamento a ogni lettera
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
  el.annulla.addEventListener('click', () => {
    const prima = storia.annulla(schema!)
    if (prima) {
      schema = prima
      salva()
      disegna()
    }
  })
  el.ripeti.addEventListener('click', () => {
    const dopo = storia.ripeti(schema!)
    if (dopo) {
      schema = dopo
      salva()
      disegna()
    }
  })
  el.fine.addEventListener('click', () => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    const finito = schema!
    box.hidden = true
    schema = null
    dip.trascinamento(false)
    dip.esci(finito)
  })

  return {
    get attivo() {
      return schema !== null
    },
    apri(s: Schema) {
      schema = JSON.parse(JSON.stringify(s)) as Schema
      selezionato = schema.passi[0].id
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
  }
}
