import { defineConfig } from 'vite'

// base './' = percorsi relativi: l'app funziona sia in locale sia su
// GitHub Pages (https://<utente>.github.io/smart-board/).
export default defineConfig({
  base: './',
  define: {
    // data e ora della costruzione: mostrata in Libreria ("Versione app")
    __DATA_BUILD__: JSON.stringify(new Date().toISOString()),
  },
})
