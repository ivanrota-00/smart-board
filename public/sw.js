// Service worker: salva l'app nell'iPad così funziona anche senza rete (palestra).
// - Pagina principale: prima prova la rete (così arrivano gli aggiornamenti), se manca usa la copia salvata.
// - File dell'app (js, css, icone): usa la copia salvata, altrimenti li scarica e li salva.
const CACHE = 'smart-board-v2'

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Scarica la pagina e tutti i file che usa (nomi con codice, es. assets/index-AB12.js)
      const risposta = await fetch('./', { cache: 'reload' })
      const html = await risposta.clone().text()
      await cache.put('./', risposta)
      const file = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
      // Senza doppioni: se l'elenco ne contiene, addAll fallisce tutto (errore della v1)
      const elenco = new Set(['./manifest.webmanifest', './icona-180.png', './icona-192.png', ...file])
      await cache.addAll([...elenco])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) if (nome !== CACHE) await caches.delete(nome)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request
  if (richiesta.method !== 'GET' || new URL(richiesta.url).origin !== self.location.origin) return

  if (richiesta.mode === 'navigate') {
    evento.respondWith(
      (async () => {
        try {
          const risposta = await fetch(richiesta)
          if (risposta.ok) (await caches.open(CACHE)).put('./', risposta.clone())
          return risposta
        } catch {
          return (await caches.match('./')) ?? Response.error()
        }
      })(),
    )
    return
  }

  evento.respondWith(
    (async () => {
      const salvata = await caches.match(richiesta)
      if (salvata) return salvata
      const risposta = await fetch(richiesta)
      if (risposta.ok) (await caches.open(CACHE)).put(richiesta, risposta.clone())
      return risposta
    })(),
  )
})
