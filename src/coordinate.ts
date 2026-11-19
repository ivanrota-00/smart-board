// UNICO posto dove si decide la conversione metri <-> schermo.
// L'SVG usa un viewBox in METRI: 1 unità SVG = 1 metro.
// Mezzo campo FIBA: x 0–15 (larghezza), y 0–14 (dalla linea di fondo alla metà campo).
// Il canestro è in alto (y = 0 è la linea di fondo), come nel PDF.

/** Area visibile in metri: piccolo bordo fuori campo + ~2 m oltre la metà campo. */
export const VISTA = { x: -1, y: -1, larghezza: 17, altezza: 17.5 } as const

/** Fine del "pezzo in più" disegnato sotto la metà campo. */
export const FINE_CAMPO_EXTRA = 16

export interface Punto {
  x: number
  y: number
}

/** Converte un punto dello schermo (es. il dito) in metri sul campo. */
export function schermoAMetri(svg: SVGSVGElement, clientX: number, clientY: number): Punto {
  const matrice = svg.getScreenCTM()
  if (!matrice) return { x: 0, y: 0 }
  const p = new DOMPoint(clientX, clientY).matrixTransform(matrice.inverse())
  return { x: p.x, y: p.y }
}

/** Tiene un punto dentro l'area visibile, lasciando spazio per il raggio dell'oggetto. */
export function limitaAllaVista(p: Punto, raggio: number): Punto {
  const minX = VISTA.x + raggio
  const maxX = VISTA.x + VISTA.larghezza - raggio
  const minY = VISTA.y + raggio
  const maxY = VISTA.y + VISTA.altezza - raggio
  return {
    x: Math.min(maxX, Math.max(minX, p.x)),
    y: Math.min(maxY, Math.max(minY, p.y)),
  }
}
