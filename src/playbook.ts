// Playbook della squadra: tutti i file .json nella cartella src/schemi/ fanno parte dell'app.
// Per aggiungere uno schema basta mettere lì il file (es. esportato dalla Libreria) e pubblicare.
import type { Schema } from './schema'
import { validaSchema } from './valida'

const file = import.meta.glob<unknown>('./schemi/*.json', { eager: true, import: 'default' })

/** Controlla i file del playbook: schemi validi + elenco dei problemi (usato dai test). */
export function caricaPlaybook(elenco: Record<string, unknown>): { schemi: Schema[]; errori: string[] } {
  const schemi: Schema[] = []
  const errori: string[] = []
  for (const [percorso, dati] of Object.entries(elenco).sort(([a], [b]) => a.localeCompare(b))) {
    const nome = percorso.split('/').pop()
    const r = validaSchema(dati)
    if (!r.ok) {
      errori.push(...r.errori.map((e) => `${nome}: ${e}`))
    } else if (schemi.some((s) => s.id === r.schema.id)) {
      errori.push(`${nome}: l'id "${r.schema.id}" è già usato da un altro schema del playbook.`)
    } else {
      schemi.push(r.schema)
    }
  }
  return { schemi, errori }
}

const caricato = caricaPlaybook(file)
if (caricato.errori.length) console.error('Problemi nel playbook:', caricato.errori)

/** Schemi del playbook, in ordine di nome file. */
export const playbook: Schema[] = caricato.schemi
