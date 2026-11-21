// Schermata "Libreria": elenco schemi, apri, importa, esporta, elimina, backup.
import { giorniFa, type Archivio } from './archivio'
import { idDaNome, nuovoSchema } from './editor/modello'
import { esportaJson, nomeFile } from './esporta'
import { VERSIONE_SCHEMA, type Schema } from './schema'
import { leggiImport, type FileBackup } from './valida'

export interface ControlliLibreria {
  apri(): void
}

export function montaLibreria(
  contenitore: HTMLElement,
  archivio: Archivio,
  quandoApri: (schema: Schema) => void,
  /** Schema nuovo creato dalla Libreria (da aprire nell'editor). */
  quandoNuovo?: (schema: Schema) => void,
): ControlliLibreria {
  const fondo = document.createElement('div')
  fondo.className = 'libreria-fondo'
  fondo.hidden = true
  fondo.innerHTML = `
    <section class="libreria" role="dialog" aria-label="Libreria">
      <header>
        <h2>📚 Libreria</h2>
        <button type="button" class="chiudi" aria-label="Chiudi">✕</button>
      </header>
      <ul class="elenco"></ul>
      <div class="azioni-libreria">
        <button type="button" class="nuovo solo-grande">➕ Nuovo schema</button>
        <button type="button" class="importa">⬇︎ Importa file JSON</button>
        <button type="button" class="backup">⬆︎ Esporta tutto (backup)</button>
        <p class="nota-backup"></p>
        <p class="nota-backup versione"></p>
      </div>
      <input type="file" accept=".json,application/json" hidden />
    </section>
  `
  contenitore.append(fondo)

  const q = <T extends Element>(s: string) => fondo.querySelector<T>(s)!
  const elenco = q<HTMLUListElement>('.elenco')
  const input = q<HTMLInputElement>('input[type=file]')
  const notaBackup = q<HTMLParagraphElement>('.nota-backup')
  q<HTMLParagraphElement>('.versione').textContent = `Versione app: ${new Date(__DATA_BUILD__).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`

  function chiudi(): void {
    fondo.hidden = true
  }

  function gruppo(testo: string, classe = 'gruppo'): HTMLLIElement {
    const li = document.createElement('li')
    li.className = classe
    li.textContent = testo
    return li
  }

  function disegnaElenco(): void {
    const voci = archivio.tutti()
    const squadra = voci.filter((v) => v.predefinito)
    const miei = voci.filter((v) => !v.predefinito)
    const righe = (lista: typeof voci) =>
      lista.map(({ schema, predefinito }) => {
        const li = document.createElement('li')
        const apri = document.createElement('button')
        apri.type = 'button'
        apri.className = 'apri'
        const titolo = document.createElement('strong')
        titolo.textContent = schema.nome
        const info = document.createElement('span')
        info.textContent = `${schema.passi.length} passi`
        apri.append(titolo, info)
        apri.addEventListener('click', () => {
          chiudi()
          quandoApri(schema)
        })

        const esporta = document.createElement('button')
        esporta.type = 'button'
        esporta.className = 'piccolo'
        esporta.textContent = 'Esporta'
        esporta.addEventListener('click', () => void esportaJson(nomeFile(schema.nome), schema))

        li.append(apri, esporta)
        if (!predefinito) {
          const elimina = document.createElement('button')
          elimina.type = 'button'
          elimina.className = 'piccolo pericolo'
          elimina.textContent = 'Elimina'
          elimina.addEventListener('click', () => {
            if (!confirm(`Eliminare "${schema.nome}" da questo iPad?\n(Se non hai un backup, è perso.)`)) return
            archivio.elimina(schema.id)
            disegnaElenco()
          })
          li.append(elimina)
        }
        return li
      })
    elenco.replaceChildren(
      gruppo('Playbook della squadra'),
      ...righe(squadra),
      gruppo('I miei schemi'),
      ...(miei.length ? righe(miei) : [gruppo('Nessuno: usa "Importa file JSON" qui sotto.', 'vuoto')]),
    )
    const nUtente = archivio.schemiUtente().length
    notaBackup.textContent =
      nUtente === 0
        ? 'Nessuno schema tuo da salvare (il playbook è già nell’app).'
        : `Ultimo backup: ${giorniFa(archivio.ultimoBackup)}`
  }

  async function importa(file: File): Promise<void> {
    let dati: unknown
    try {
      dati = JSON.parse(await file.text())
    } catch {
      alert(`"${file.name}" non è un file JSON valido.`)
      return
    }
    const { schemi, errori } = leggiImport(dati)
    let importati = 0
    for (const s of schemi) {
      if (archivio.ePredefinito(s.id)) {
        // uguale al predefinito → niente da fare; diverso → si salva come copia
        if (JSON.stringify(s) === JSON.stringify(archivio.trova(s.id))) continue
        s.id = `${s.id}-importato`
        s.nome = `${s.nome} (importato)`
      }
      if (archivio.eUtente(s.id) && !confirm(`Esiste già "${s.nome}". Sostituirlo con quello del file?`)) continue
      if (archivio.salva(s)) importati++
      else errori.push(`Non riesco a salvare "${s.nome}" (memoria del browser non disponibile).`)
    }
    disegnaElenco()
    const righe = [`Schemi importati: ${importati}.`]
    if (errori.length) righe.push('', 'Problemi trovati:', ...errori.map((e) => `• ${e}`))
    alert(righe.join('\n'))
  }

  async function backup(): Promise<void> {
    const dati: FileBackup = {
      tipo: 'smart-board-backup',
      versione: VERSIONE_SCHEMA,
      data: new Date().toISOString(),
      schemi: archivio.schemiUtente(),
    }
    const oggi = dati.data.slice(0, 10)
    const esito = await esportaJson(`smart-board-backup-${oggi}.json`, dati)
    if (esito !== 'annullato') {
      archivio.segnaBackup()
      disegnaElenco()
    }
  }

  q('.chiudi').addEventListener('click', chiudi)
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo) chiudi() // tocco fuori dal riquadro
  })
  q('.importa').addEventListener('click', () => input.click())
  q('.nuovo').addEventListener('click', () => {
    const nome = prompt('Nome del nuovo schema:')?.trim()
    if (!nome) return
    const s = nuovoSchema(idDaNome(nome, (id) => !!archivio.trova(id)), nome)
    if (!archivio.salva(s)) {
      alert('Non riesco a salvare (memoria del browser non disponibile).')
      return
    }
    chiudi()
    quandoNuovo?.(s)
  })
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    input.value = '' // così si può reimportare lo stesso file
    if (file) void importa(file)
  })
  q('.backup').addEventListener('click', () => void backup())

  return {
    apri() {
      disegnaElenco()
      fondo.hidden = false
    },
  }
}
