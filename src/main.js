import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Helloword, página inicial">
        <span class="brand-mark" aria-hidden="true">H</span>
        <span>helloword</span>
      </a>
      <nav class="topnav" aria-label="Navegação principal">
        <a class="nav-link active" href="#inicio">Início</a>
        <a class="nav-link" href="#sobre">Sobre</a>
        <button class="avatar-button" type="button" aria-label="Abrir perfil de Helena">HL</button>
      </nav>
    </header>

    <main>
      <section class="hero" id="inicio">
        <div class="hero-copy">
          <p class="eyebrow"><span class="eyebrow-dot"></span> seu espaço de ideias</p>
          <h1>Olá, Helena.<br /><em>Vamos começar?</em></h1>
          <p class="hero-description">
            Um lugar leve para colocar as ideias em ordem, encontrar foco e transformar
            pequenos passos em grandes movimentos.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="#primeiro-passo">
              Dar o primeiro passo
              <span aria-hidden="true">→</span>
            </a>
            <a class="text-action" href="#sobre">Conhecer o helloword <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div class="hero-art" aria-label="Ilustração de uma janela ensolarada" role="img">
          <div class="sun"></div>
          <div class="cloud cloud-one"></div>
          <div class="cloud cloud-two"></div>
          <div class="hill hill-back"></div>
          <div class="hill hill-front"></div>
          <div class="window-frame">
            <div class="window-pane pane-left"></div>
            <div class="window-pane pane-right"></div>
            <div class="window-sill"></div>
            <div class="plant">
              <div class="leaf leaf-a"></div>
              <div class="leaf leaf-b"></div>
              <div class="leaf leaf-c"></div>
              <div class="plant-pot"></div>
            </div>
          </div>
          <span class="art-label">um dia de cada vez</span>
        </div>
      </section>

      <section class="welcome-card" id="primeiro-passo">
        <div class="card-intro">
          <span class="card-number">01</span>
          <div>
            <h2>O que está na sua cabeça?</h2>
            <p>Comece registrando uma intenção para hoje. Não precisa ser perfeita.</p>
          </div>
        </div>
        <form class="intention-form">
          <label class="sr-only" for="intention">Sua intenção para hoje</label>
          <input id="intention" name="intention" type="text" placeholder="Hoje eu quero..." autocomplete="off" />
          <button class="send-button" type="submit" aria-label="Salvar intenção">→</button>
        </form>
        <p class="form-message" role="status" aria-live="polite"></p>
      </section>

      <section class="principles" id="sobre">
        <div class="section-heading">
          <p class="eyebrow">feito para você</p>
          <h2>Clareza começa<br /><em>com presença.</em></h2>
        </div>
        <div class="principle-list">
          <article class="principle">
            <span class="principle-icon icon-spark" aria-hidden="true">✦</span>
            <div><h3>Menos ruído</h3><p>Um espaço calmo para dar atenção ao que importa.</p></div>
          </article>
          <article class="principle">
            <span class="principle-icon icon-circle" aria-hidden="true">◌</span>
            <div><h3>Mais intenção</h3><p>Pequenos registros que ajudam a perceber o seu caminho.</p></div>
          </article>
          <article class="principle">
            <span class="principle-icon icon-arrow" aria-hidden="true">↗</span>
            <div><h3>Seu ritmo</h3><p>Uma experiência construída para acompanhar os seus dias.</p></div>
          </article>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>helloword <span class="footer-dot">·</span> feito para começar</span>
      <span>© 2024</span>
    </footer>
  </div>
`;

const form = document.querySelector('.intention-form');
const input = document.querySelector('#intention');
const message = document.querySelector('.form-message');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    message.textContent = 'Escreva uma intenção para continuar.';
    message.classList.add('is-error');
    input.focus();
    return;
  }

  message.textContent = 'Intenção salva. Que seja um bom começo.';
  message.classList.remove('is-error');
  input.value = '';
});