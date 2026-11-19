const NS = 'http://www.w3.org/2000/svg'

/** Crea un elemento SVG con i suoi attributi. */
export function creaSvg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributi: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag)
  for (const [nome, valore] of Object.entries(attributi)) {
    el.setAttribute(nome, String(valore))
  }
  return el
}
