import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <div class="benvenuto">
      <h1>Smart Board 🏀</h1>
      <p>Fase 1 OK — il progetto si avvia.</p>
    </div>
  `
}
