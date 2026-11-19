# 🏀 Smart Board — Lavagnetta tattica digitale animata

> **Nome: Smart Board** (scelto da Ivan il 19/11/2026). File vivo: va aggiornato a fine di ogni sessione (chat o Claude Code).
> Ultimo aggiornamento: 19/11/2026 — Sessione 1 (Fasi 1–5 completate, Fase 6 in prova su iPad)

---

## 0. Come usare questo README (cross-chatting)

**Regola semplice:**
1. **A inizio di ogni nuova chat** → incolla questo README e scrivi cosa vuoi fare oggi.
2. **A fine sessione** → chiedi: *"Aggiorna il README: stato, decisioni, changelog, prossimi passi"* e sostituisci il file con la nuova versione.
3. In **Claude Code** → il file `CLAUDE.md` (nella cartella del progetto) rimanda a questo README, così lo legge da solo.

**Chi fa cosa:**

| Dove | Cosa si fa |
|---|---|
| Chat Claude | Design, scelte, modellare gli schemi in JSON, rivedere idee, scrivere prompt |
| Claude Code | Scrivere/modificare il codice, test, commit |

**Legenda:** ✅ verificato · 🟡 ipotesi da verificare · ⬜ da fare · ✔️ fatto

---

## 1. Richiesta

Trasformare la lavagnetta tattica del basket in uno strumento **digitale e animato** per mostrare gli schemi ai giocatori.

Due modalità:
- **Libreria di schemi predefiniti** — schemi già pronti, da riprodurre in animazione (Play / Pausa / passo-passo).
- **Creazione e animazione dal vivo** — l'allenatore muove i giocatori e disegna sul campo, e l'app lo anima.

**Esempio di riferimento:** PDF "Triangolo" (5 pagine). Cosa contiene (✅ letto dal PDF):
- Mezzo campo con **5 attaccanti** (1-5) e **5 difensori** (X1-X5), palla in mano a un giocatore.
- **Frecce con significato diverso:**
  - bianca piena = movimento/taglio
  - verde tratteggiata = passaggio
  - blu ondulata = palleggio
  - frecce con tacca finale = blocco (stagger, blocco sul 3)
- **Passi numerati** (Situazione iniziale → Step 1 → Step 2 → Step 3), ognuno con un testo che lo spiega.
- **Decisioni con ramificazione:** "Scelta A: passa al 5" / "Scelta B: passa al 1", ognuna con i suoi step.
- Premessa/note testuali ("il 4 parte in posizione di play").

👉 **Punto chiave:** il vero valore non è solo animare, ma **gestire le scelte (A/B)** — è lo schema "a lettura". Molte app fanno solo sequenze lineari.

---

## 2. Fattibilità

**Verdetto: ✅ fattibile. Difficoltà media.** Non servono server, API a pagamento né librerie pesanti.

| Parte | Difficoltà | Note |
|---|---|---|
| Campo da basket (SVG) | Bassa | Hai già fatto un campo SVG nell'app statistiche |
| Giocatori trascinabili | Bassa | Pointer events (funzionano con dito e mouse) |
| Animazione tra passi | Media | Interpolazione delle posizioni lungo un percorso |
| Frecce (taglio, passaggio, palleggio, blocco) | Media | Linee/curve SVG con stili diversi |
| Ramificazione A/B | Media | Ogni passo può avere più "scelte" che portano a passi diversi |
| Modalità "dal vivo" (registra il movimento) | Media-alta | Si registra il trascinamento e lo si riproduce |
| Esportare video/GIF da condividere | Media-alta | 🟡 Su iPhone/Safari dipende dal formato supportato: da testare |
| Uso comodo da tablet/telefono | Media | È la parte che richiede più rifinitura |

**Rischi principali:**
1. **Usabilità su touch** (dita grandi, campo piccolo): la parte più difficile non è tecnica ma di design.
2. **Scope creep**: la lista di idee è infinita → si parte da un MVP piccolo.
3. **Salvataggio dati nel browser**: 🟡 Safari può cancellare dati di siti non usati da tempo → serve sempre l'**export JSON** come backup.

**Esistono già app simili** (✅ cercato su App Store): Basketball Play Designer, Elite Hoops, Coach Tactic Board, The Hoops Geek, TacticalPad e altre. Quasi tutte sono **iPad/iPhone, spesso con acquisti in-app**, in inglese.
→ **Differenziatori possibili**: gratuita, in italiano, **web (funziona ovunque, senza installare)**, **schemi a scelta A/B** come nel tuo PDF, integrabile con la tua app statistiche.

---

## 3. Claude Code: sì o no?

**Sì, per costruire. Chat per progettare.**

- Progetto con più file, da far girare e testare nel browser → è il caso tipico per Claude Code.
- Lavoro a piccoli passi con commit → recuperi facilmente se qualcosa si rompe.
- **Costo:** incluso nel tuo abbonamento attuale. Nessuna API a pagamento, nessun servizio extra. ✅
- **RAM (Mac 8 GB):** stack leggero (Vite + TypeScript + browser). Evitare Docker, emulatori, Electron e tool di test pesanti (Playwright con più browser). ✅ compatibile.
- **Fare in chat (qui):** modello dati, scelta delle funzioni, trascrivere gli schemi in JSON, rivedere il lavoro.

---

## 4. Stack proposto

| Scelta | Perché | Costo |
|---|---|---|
| **Vite + TypeScript** | Leggero, veloce, il codice si controlla meglio che con JS puro | 0 € |
| **SVG** per campo e giocatori | Nitido a ogni zoom, ogni elemento è trascinabile | 0 € |
| **Animazione fatta a mano** (`requestAnimationFrame`) | Basta, niente librerie | 0 € |
| **Salvataggio locale** (IndexedDB/localStorage) + **import/export JSON** | Niente server, i dati restano tuoi | 0 € |
| **PWA** (installabile su iPad/telefono) | Si apre come un'app, anche offline in palestra | 0 € |
| **Vitest** (solo per la logica di animazione) | Test leggeri | 0 € |
| **Hosting statico** (GitHub Pages, Cloudflare Pages o Netlify) | Link da mandare ai giocatori | 0 € |

🟡 Alternativa se l'SVG diventa lento: Canvas 2D. Si decide solo se serve.

**Perché non React?** Non serve per l'MVP; meno dipendenze = meno RAM e meno complessità. Rivalutare più avanti.

---

## 5. Modello dati (bozza)

Il cuore del progetto. Un **Schema** è un grafo di **Passi**.

**Coordinate:** in metri su mezzo campo FIBA (**x 0–15, y 0–14**), non in pixel → l'app funziona su qualsiasi schermo.

```json
{
  "id": "triangolo",
  "nome": "Triangolo",
  "tag": ["attacco", "mezzo-campo"],
  "campo": "mezzo",
  "premessa": "Il 4 parte in posizione di play (palleggio o hand off).",
  "giocatori": [
    { "id": "A1", "squadra": "att", "label": "1", "x": 3.0, "y": 7.5 },
    { "id": "D1", "squadra": "dif", "label": "X1", "x": 3.5, "y": 7.0 }
  ],
  "palla": { "inMano": "A4" },
  "passi": [
    {
      "id": "p1",
      "titolo": "Situazione iniziale",
      "testo": "4 passa a 2 e va in angolo. 1 e 3 rimpiazzano le posizioni.",
      "azioni": [
        { "tipo": "passaggio", "da": "A4", "a": "A2", "inizio": 0, "durata": 0.6 },
        { "tipo": "taglio", "giocatore": "A4", "percorso": [[7.5,4],[12,1]], "inizio": 0.6, "durata": 1.2 },
        { "tipo": "blocco", "giocatore": "A2", "percorso": [[10,6]], "inizio": 0, "durata": 1.0 },
        { "tipo": "palleggio", "giocatore": "A1", "percorso": [[5,6]], "inizio": 0, "durata": 1.0 }
      ],
      "scelte": [
        { "etichetta": "A: passa al 5", "vaiA": "pA1" },
        { "etichetta": "B: passa al 1", "vaiA": "pB1" }
      ]
    }
  ]
}
```

**Regole di base (da non rompere):**
- Posizione di un giocatore a fine passo = punto di partenza del passo dopo (si calcola, non si salva due volte).
- La palla ha uno stato: *in mano a X* oppure *in volo*. Il passaggio cambia chi la ha.
- Tipi di azione: `taglio`, `passaggio`, `palleggio`, `blocco`, `hand-off` (estendibile).
- Un passo senza `scelte` va al successivo; con `scelte` l'app si ferma e mostra i bottoni.
- Aggiungere un campo `versione` allo schema → i file vecchi si possono migrare.

---

## 6. Funzioni per fasi

### MVP (v0.1) — "Posso mostrare il Triangolo"
- Mezzo campo FIBA in SVG
- 5 attaccanti + 5 difensori + palla, trascinabili
- Passi con frecce (taglio, passaggio, palleggio, blocco)
- Play / Pausa / Passo avanti-indietro / velocità
- Testo spiegazione per ogni passo
- Scelte A/B con bottoni
- Libreria locale + import/export JSON
- Lo schema **Triangolo** come primo schema precaricato

### v0.2 — Creare
- Editor: aggiungi passo, disegna percorso trascinando, scegli tipo di freccia
- Annulla / Ripeti
- Duplica passo, specchia schema (destra ↔ sinistra)
- Mostra/nascondi difesa

### v0.3 — Dal vivo
- Modalità "registra": muovi i giocatori col dito e l'app registra i movimenti, poi li ripete
- Lavagnetta libera (disegno a mano sopra il campo)

### v0.4 — Condividere (⬜ opzionale: serve solo se i giocatori useranno l'app)
- PWA installabile
- Link/file da mandare ai giocatori (WhatsApp)
- Esporta PDF stile quello di esempio (passi + testo)
- 🟡 Esporta GIF/video (da testare su iPhone)

### Idee future (⬜ non ora)
- Difese a zona predefinite (2-3, 3-2, ecc.)
- Collegamento con l'app statistiche / i nomi reali dei giocatori
- Modalità "quiz": il giocatore sceglie la lettura giusta
- Cloud e account (solo se diventa un prodotto)

---

## 7. Piano esecutivo

| Fase | Obiettivo | Fatto quando… | Stato |
|---|---|---|---|
| 0 | Analisi e piano (questo file) | README e prompt pronti | ✔️ |
| 1 | Setup progetto: cartella, Vite+TS, git, `CLAUDE.md`, PDF di esempio in `docs/esempi/` | `npm run dev` mostra una pagina | ✔️ |
| 2 | Campo SVG + 10 giocatori + palla, trascinabili | Si muovono con mouse e dito | ✔️ |
| 3 | Modello dati + motore di animazione (con test) | Un passo si anima da A a B | ✔️ |
| 4 | Frecce e tipi di azione | Le 4 frecce del PDF si vedono bene | ✔️ |
| 5 | Player: play/pausa/passi/velocità + testo | Il Triangolo parte e si ferma | ✔️ |
| 6 | Scelte A/B | Si arriva a B1/B2 e A1/A2/A3 come nel PDF | 🟡 codice pronto, da provare su iPad |
| 7 | Libreria + salvataggio + import/export JSON | Ricarichi la pagina e lo schema c'è | ⬜ |
| 8 | **Test con la tua squadra** (iPad/telefono) | Un allenamento reale, feedback scritto | ⬜ |
| 9 | Editor (v0.2) | Crei uno schema nuovo da zero | ⬜ |
| 10 | Modalità dal vivo (v0.3) | Registri e riproduci | ⬜ |
| 11 | PWA installata su iPad (offline) + condivisione opzionale (v0.4) | Installato sull'iPad, funziona senza Wi-Fi in palestra | ⬜ |

**Stima indicativa 🟡:** fasi 1–7 in circa 4–8 sessioni di lavoro; l'editor e la modalità dal vivo sono la parte più lunga. È una stima, non un impegno.

**Regole di lavoro:**
- Una fase alla volta. Si chiude con un commit.
- Prima di partire con una fase: Claude Code propone il piano e aspetta il tuo OK.
- Il test vero è in palestra, non sul Mac (fase 8 prima di costruire l'editor).

---

## 8. Prompt iniziale per Claude Code

> Incolla questo nella prima sessione, dentro la cartella vuota del progetto. Metti prima il PDF in `docs/esempi/Triangolo.pdf`.

```
Sono Ivan. Voglio costruire "Smart Board": una lavagnetta tattica digitale animata per il basket (web app, mezzo campo), per mostrare gli schemi ai giocatori della mia squadra.

CONTESTO
- Leggi docs/esempi/Triangolo.pdf: è lo schema di riferimento. Ha 5 attaccanti (1-5) e 5 difensori (X1-X5), palla, frecce di tipo diverso (taglio = bianca piena, passaggio = verde tratteggiata, palleggio = blu ondulata, blocco = freccia con tacca), passi numerati con testo, e scelte A/B che portano a passi diversi.
- Leggi README.md: contiene modello dati, fasi e regole. Se qualcosa nel README e nel mio messaggio non coincide, dimmelo prima di procedere.

VINCOLI (importanti)
- Costo zero: nessuna API a pagamento, nessun servizio con abbonamento.
- Il mio Mac ha 8 GB di RAM: niente Docker, niente Electron, niente tool pesanti. Se una scelta pesa troppo, proponi un'alternativa più leggera.
- Stack: Vite + TypeScript, SVG fatto a mano (no framework UI), animazione con requestAnimationFrame, nessuna libreria di animazione. Salvataggio locale + import/export JSON. Test solo con Vitest sulla logica (motore di animazione).
- Coordinate in metri sul mezzo campo FIBA (x 0-15, y 0-14), non in pixel.
- Dispositivo principale: iPad in orizzontale (Safari, poi installato come PWA). Solo mezzo campo.
- Touch-first: pointer events, `touch-action: none` sul campo, elementi toccabili grandi (almeno 44 px), niente hover, nessuna azione solo con tasto destro. Solo dito (nessuna Apple Pencil): il dito copre il punto che si tocca, quindi i percorsi si disegnano con tocchi successivi sui punti (non a mano libera) e il giocatore trascinato va mostrato leggermente sopra il dito.
- Il campo deve riempire l'altezza dello schermo (usa unità `dvh`, rispetta le aree sicure di iPad).
- Per provare dall'iPad usa `npm run dev -- --host` (stessa rete Wi-Fi del Mac).

COME LAVORARE
1. Per ora fai SOLO la Fase 1 del README: setup del progetto, git, CLAUDE.md, una pagina che si avvia con `npm run dev`.
2. Crea un CLAUDE.md breve che dica: leggi README.md a inizio sessione, aggiornalo a fine sessione (stato, decisioni, changelog, prossimi passi), un commit per fase, spiega le scelte in modo semplice, distingui sempre "verificato" da "ipotesi".
3. Prima di scrivere codice, mostrami in poche righe cosa farai e aspetta il mio OK.
4. Alla fine: dimmi come avviare il progetto, cosa hai verificato davvero (es. "ho avviato e visto la pagina") e cosa no.
5. Risposte semplici e chiare, senza muri di testo.

Non passare alla Fase 2 finché non te lo dico.
```

---

## 9. Suggerimenti e buone pratiche

**Prodotto**
- **Parti dal Triangolo**: è il tuo test di realtà. Se l'app lo riproduce bene, il resto segue.
- **Scelte A/B = tuo punto di forza**: le app concorrenti sono per lo più lineari. Cura bene questa parte.
- **Testa con i giocatori prima dell'editor.** Meglio scoprire presto cosa capiscono e cosa no.
- **Velocità regolabile e passo-passo**: i giocatori capiscono meglio rallentando.
- **Colori leggibili anche da lontano** (palestra, TV, telefono piccolo): frecce spesse, numeri grandi.
- **Specchia schema**: lo stesso schema a destra e a sinistra, gratis.
- **Difesa opzionale**: si insegna prima l'attacco "pulito", poi con la difesa.

**Codice**
- **Dati separati dalla grafica:** lo schema è solo JSON; il disegno lo legge. Così puoi cambiare grafica senza perdere gli schemi.
- **Un solo posto per le coordinate** (metri → pixel): evita bug di scala.
- **Annulla/Ripeti dall'inizio** del dev dell'editor (più difficile aggiungerlo dopo).
- **Backup:** pulsante "Esporta tutto" ben visibile + promemoria ogni tanto.
- **Commit piccoli e frequenti**, un messaggio chiaro per ognuno.
- **Accessibilità:** non usare solo il colore per distinguere le frecce (anche tratteggio/forma, come già nel PDF).

**Sicurezza e dati**
- I dati restano sul dispositivo (nessun server) → niente privacy da gestire nell'MVP.
- Se un giorno aggiungi account/cloud o nomi reali dei ragazzi (anche minorenni): cambia tutto (GDPR) → riguardare allora.
- Se pubblichi online: usa la skill di controllo sicurezza prima.

**Prodotto futuro**
- Se funziona bene, può diventare parte dell'app statistiche (stessa utenza: allenatori/dirigenti di squadre dilettantistiche). Decisione **da rimandare** dopo la fase 8.

---

## 10. Stato attuale

- ✅ PDF di riferimento letto e analizzato
- ✅ Fattibilità valutata: alta
- ✅ Stack e modello dati proposti (bozza, **non ancora approvati da Ivan**)
- ✔️ **Fase 1 fatta:** cartella, git, Vite 8 + TypeScript 7, `CLAUDE.md`, `TODO.md`, pagina base
  - ✅ verificato: `npm run build` senza errori; `npm run dev` risponde e serve la pagina "Smart Board — Fase 1 OK"
  - ✅ verificato da Ivan: la pagina si vede sul Mac e sull'iPad (Safari, via `npm run dev -- --host`)
- ✔️ **Fase 2 fatta:** campo FIBA in SVG + pezzo oltre la metà campo, 10 giocatori e palla trascinabili
  - ✅ verificato: build senza errori; anteprima del disegno controllata (campo e posizioni = pagina 1 del PDF)
  - ✅ verificato da Ivan su iPad: trascinamento col dito, più dita insieme, palla che passa a un attaccante, niente zoom/scroll
  - Il giocatore trascinato si alza di ~0,9 m sopra il dito dopo un piccolo movimento (sotto 0,2 m è un semplice tocco)
  - Nessun salvataggio: ricaricando la pagina si torna alle posizioni del PDF (salvataggio in Fase 7)

- ✔️ **Fase 3 fatta:** tipi dello schema (`src/schema.ts`), motore di animazione (`src/motore.ts`), passo 1 del Triangolo (`src/schemi/triangolo.ts`), pulsanti temporanei "Prova passo 1" / "Ricomincia"
  - ✅ verificato: 14 test Vitest passano (`npm test`); build senza errori; fotogrammi a metà e a fine passo controllati (fine = pagina 3 del PDF)
  - ✅ verificato da Ivan su iPad: l'animazione del passo 1 funziona
  - Percorsi per ora a tratti dritti (curve con le frecce in Fase 4)

- ✔️ **Fase 4 fatta:** percorsi curvi (`src/geometria.ts`), frecce (`src/frecce.ts`), pulsante temporaneo "Prova frecce" (`src/schemi/prova-frecce.ts`)
  - ✅ verificato: 22 test passano; build senza errori; immagini delle frecce controllate (passo 1 + prova frecce)
  - ✅ verificato da Ivan su iPad: frecce leggibili, animazione lungo le curve ok
  - Nota: nel passo 1 la punta della freccia dell'1 finisce sotto il 4 (l'1 va dove sta il 4 all'inizio, come da PDF)

- ✔️ **Fase 5 fatta:** player (`src/player.ts`) con ⏮ ▶/⏸ ⏭, ↺ dall'inizio, velocità 0,5×/1×/1,5×, barra di avanzamento, "Passo N di M", titolo, testo e premessa. Triangolo: situazione iniziale + Scelta A (Step 1–3). Tolti i pulsanti di prova
  - ✅ verificato: 31 test passano (9 nuovi sul player); build senza errori; immagini dei passi A1–A3 controllate rispetto al PDF
  - ✅ verificato da Ivan su iPad: comandi, testi e simboli ok
  - Trascinamento dei giocatori disattivato nel player (torna con l'editor, Fase 9)

- 🟡 **Fase 6 (codice pronto):** alla fine della Situazione iniziale il player si ferma sulla Decisione 1 con domanda e bottoni "A: passa al 5" / "B: passa al 1"; ⏮ dal primo passo di un ramo torna alla decisione. Triangolo completo: A1–A3, B1, B2 (in due parti)
  - ✅ verificato: 37 test passano (7 nuovi sulle scelte); build senza errori; immagini dei passi B controllate rispetto al PDF
  - 🟡 da verificare da Ivan su iPad: bottoni delle scelte, ritorno alla decisione
  - 🟡 da confermare con Ivan: in B1 il passaggio 1 → 3 sul back door non è animato (solo nel testo), perché nel PDF B2 riparte con la palla all'1

**Come avviare:** `npm install` (solo la prima volta) → `npm run dev` → apri http://localhost:5173. Dall'iPad: `npm run dev -- --host` e apri l'indirizzo "Network" mostrato nel terminale.

## 11. Decisioni prese

| Data | Decisione |
|---|---|
| 19/11/2026 | Progetto = web app, mezzo campo, con schemi predefiniti + creazione/animazione |
| 19/11/2026 | Costruzione con Claude Code, progettazione in chat |
| 19/11/2026 | Primo schema precaricato: Triangolo |
| 19/11/2026 | **Dispositivo principale: iPad** (iPad 10ª generazione, Safari + PWA, solo dito, senza Apple Pencil) |
| 19/11/2026 | **Nome: Smart Board.** Gli schemi li inserisce solo Ivan |
| 19/11/2026 | **Solo uso di Ivan in palestra** (niente telefono/condivisione per ora) |
| 19/11/2026 | **Solo mezzo campo** (il campo intero esce dalle idee future) |
| 19/11/2026 | Commit piccoli a ogni passo che funziona + commit di chiusura fase |
| 19/11/2026 | `TODO.md` separato per i compiti pratici; il README resta il documento principale |
| 19/11/2026 | Vitest si installa solo in Fase 3 (quando serve) |
| 19/11/2026 | Campo: si mostra anche ~2 m oltre la metà campo (come nel PDF); area visibile x −1…16, y −1…16,5 m |
| 19/11/2026 | Nuovo tipo di azione `spostamento`: movimento senza freccia (es. difensori). Tempi delle azioni in secondi |
| 19/11/2026 | Palla in volo: va dalla mano di chi passa (a inizio passaggio) a quella di chi riceve (all'arrivo), in linea retta. Movimenti con partenza/arrivo morbidi |
| 19/11/2026 | Frecce: taglio bianca piena, passaggio verde tratteggiata, palleggio blu ondulata, blocco con stanghetta finale (simbolo standard, 🟡 nel PDF non si vede bene), hand-off con due stanghette a metà. Spostamento = nessuna freccia |
| 19/11/2026 | Percorsi: curva morbida che passa per tutti i punti (Catmull-Rom); il giocatore segue la stessa curva disegnata |
| 19/11/2026 | Le frecce di un passo si vedono tutte prima di partire; ognuna sparisce (0,4 s) quando la sua azione finisce |
| 19/11/2026 | Nuovo campo `prossimo` nel passo: dice qual è il passo dopo (con i rami A/B l'ordine della lista non basta). Senza `prossimo` e senza scelte lo schema finisce |
| 19/11/2026 | Play riproduce UN passo e si ferma sull'inizio del passo dopo (l'allenatore spiega, poi ▶). Play a fine schema ricomincia |
| 19/11/2026 | Nel player il trascinamento è disattivato |
| 19/11/2026 | Difensori: ognuno resta sul suo uomo (X3 sul 3, ecc.). Nel PDF le etichette X2/X3 si scambiano tra le pagine; posizioni 🟡 approssimate |
| 19/11/2026 | Scelte: a fine passo il player si ferma sulla decisione (▶ spento) finché non si tocca A o B; ⏮ dal primo passo del ramo torna alla decisione. Nuovo campo facoltativo `domanda` |
| 19/11/2026 | Step B2 del PDF diviso in due passi (due disegni nel PDF) |
| 19/11/2026 | Palla: segue chi la ha; trascinata e lasciata entro 1 m da un attaccante passa a lui, altrimenti resta libera |

### Conseguenze della scelta iPad (🟡 = da verificare su iPad vero)
- **Orientamento:** pensato per iPad in orizzontale; il campo occupa tutta l'altezza dello schermo.
- **Niente "hover" e niente tasto destro:** ogni azione si fa con tocco, trascinamento o pulsanti visibili.
- **Elementi toccabili grandi** (almeno circa 44 px): giocatori e pulsanti.
- **Bloccare scroll/zoom della pagina durante il trascinamento** (`touch-action: none` sul campo), altrimenti Safari muove la pagina invece del giocatore.
- **Senza Apple Pencil (solo dito):** niente disegno a mano libera preciso. I percorsi si creano toccando i punti uno dopo l'altro (la linea si curva da sola), con maniglie grandi per correggerli. Il disegno libero sul campo (v0.3) resta opzionale e meno preciso.
- **Installazione:** da Safari → Condividi → "Aggiungi a schermata Home" → si apre a tutto schermo come un'app. 🟡 Funzionamento offline da verificare.
- **Salvataggio:** 🟡 Safari può cancellare i dati di un sito non usato da tempo → export JSON/backup obbligatorio (già previsto).
- **Mostrare in palestra:** AirPlay verso TV/proiettore, se disponibile.
- **Sviluppo e test:** il server di sviluppo sul Mac si apre anche dall'iPad se sono sulla stessa rete Wi-Fi (`npm run dev -- --host`), senza pubblicare nulla. 🟡 Da provare.

## 12. Domande aperte

1. ~~Per chi è~~ → **per ora solo Ivan in palestra, su iPad** ✔️ (niente layout da telefono né condivisione ai giocatori nell'MVP; rivalutabile dopo la fase 8)
2. ~~Dispositivo principale~~ → **iPad** ✔️
3. ~~Campo intero o mezzo~~ → **solo mezzo campo** ✔️
4. ~~Chi inserisce gli schemi~~ → **tu** ✔️ (niente account/ruoli: un solo autore)
5. ~~Nome~~ → **Smart Board** ✔️ (🟡 "SMART Board" è anche il nome commerciale di lavagne interattive: va bene per uso personale, da rivedere se diventa un prodotto pubblico)
6. ~~iPad e Pencil~~ → **iPad 10ª generazione, senza Apple Pencil** ✔️

## 13. Changelog

- **19/11/2026 — Sessione 1 (sexies):** Fase 6 — scelte A/B con bottoni, Scelta B trascritta (B1, B2a, B2b). Triangolo completo. 37 test.
- **19/11/2026 — Sessione 1 (quinquies):** Fase 5 — player con comandi, velocità e testi; Scelta A del Triangolo trascritta; tolte le prove temporanee. 31 test.
- **19/11/2026 — Sessione 1 (quater):** Fase 4 — percorsi curvi, 5 tipi di freccia, prova frecce. 22 test.
- **19/11/2026 — Sessione 1 (ter):** Fase 3 — modello dati, motore di animazione + 14 test, prova animata del passo 1 del Triangolo.
- **19/11/2026 — Sessione 1 (bis):** Fase 2 — campo FIBA in SVG, giocatori e palla trascinabili (multi-tocco). Provata da Ivan su iPad: tutto funziona.
- **19/11/2026 — Sessione 1:** Fase 1 completata (Vite + TS, git, CLAUDE.md, TODO.md, pagina base touch-first: `100dvh`, aree sicure, niente scroll/zoom).
- **19/11/2026 — Sessione 0:** analisi del PDF, fattibilità, stack, modello dati, piano a fasi, prompt iniziale. Nessun codice.
- **19/11/2026 — Sessione 0 (quater):** uso solo di Ivan in palestra → v0.4 "Condividere" declassata a opzionale; tutte le domande aperte chiuse.
- **19/11/2026 — Sessione 0 (ter):** nome Smart Board, schemi inseriti solo da Ivan, iPad 10 senza Apple Pencil → percorsi a tocchi, non a mano libera.
- **19/11/2026 — Sessione 0 (bis):** decisi iPad come dispositivo e solo mezzo campo; aggiunte note iPad, vincoli nel prompt per Claude Code, domande aperte aggiornate.

## 14. Prossimi passi

1. Ivan prova le scelte A/B sull'iPad e conferma la scelta su B1 (passaggio back door solo nel testo).
2. Chiudere la Fase 6 → Fase 7: libreria + salvataggio + import/export JSON, solo dopo l'OK.
