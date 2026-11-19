# Smart Board — istruzioni per Claude Code

- **A inizio sessione:** leggi `README.md` (piano, modello dati, decisioni) e `TODO.md`.
- **A fine sessione:** aggiorna `README.md` (stato, decisioni, changelog, prossimi passi) e `TODO.md`.
- **Una fase alla volta.** Prima di iniziare una fase, proponi il piano in poche righe e aspetta l'OK di Ivan.
- **Commit:** piccoli commit a ogni passo che funziona + un commit che chiude la fase.
- **Spiega in italiano semplice**, a passi brevi, senza muri di testo.
- **Distingui sempre** "✅ verificato (l'ho testato)" da "🟡 ipotesi".
- **Vincoli:** costo zero, Mac 8 GB (niente Docker/Electron/tool pesanti), Vite + TypeScript, SVG a mano, `requestAnimationFrame`, Vitest solo sulla logica.
- **iPad touch-first:** pointer events, `touch-action: none` sul campo, tocchi ≥ 44 px, niente hover/tasto destro, coordinate in metri (x 0–15, y 0–14).
- **Avvio:** `npm run dev` (Mac) · `npm run dev -- --host` (iPad, stessa Wi-Fi).
