// Esportare un file JSON. Sull'iPad prova il menu "Condividi" (salva in File, WhatsApp…);
// se non è disponibile (es. sito non https) scarica il file in modo normale.

export type EsitoEsporta = 'condiviso' | 'scaricato' | 'annullato'

export async function esportaJson(nomeFile: string, dati: unknown): Promise<EsitoEsporta> {
  const testo = JSON.stringify(dati, null, 2)
  const file = new File([testo], nomeFile, { type: 'application/json' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nomeFile })
      return 'condiviso'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'annullato'
      // altri errori: si prova a scaricare
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'scaricato'
}

/** Nome file sicuro: "Triangolo B" → "triangolo-b.json" */
export function nomeFile(base: string): string {
  const pulito = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${pulito || 'schema'}.json`
}
