import './style.css';

const root = document.querySelector('#root');

root.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="HelloWord início">
      <span class="brand-mark" aria-hidden="true">h</span>
      <span>Hello<span class="brand-accent">Word</span></span>
    </a>
    <nav class="nav-links" aria-label="Navegação principal">
      <a href="#sobre">Sobre</a>
      <a href="#recursos">Recursos</a>
      <a class="nav-cta" href="#comecar">Começar agora <span aria-hidden="true">↗</span></a>
    </nav>
    <button class="menu-button" type="button" aria-label="Abrir menu" aria-expanded="false">
      <span></span><span></span>
    </button>
  </header>

  <main>
    <section class="hero" id="sobre">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> Seu próximo capítulo começa aqui</p>
        <h1>Ideias que<br /><em>ganham vida.</em></h1>
        <p class="hero-description">
          Um espaço calmo para pensar, criar e compartilhar o que realmente importa.
          Coloque suas palavras no mundo, do seu jeito.
        </p>
        <div class="hero-actions" id="comecar">
          <a class="button button-primary" href="#recursos">Começar a criar <span aria-hidden="true">→</span></a>
          <a class="text-link" href="#manifesto">Conheça a ideia <span aria-hidden="true">↓</span></a>
        </div>
        <div class="social-proof">
          <div class="avatar-stack" aria-hidden="true">
            <span class="avatar avatar-one">M</span><span class="avatar avatar-two">L</span>
            <span class="avatar avatar-three">A</span><span class="avatar avatar-four">+</span>
          </div>
          <span>Junte-se a <strong>2.400+</strong> pessoas criativas</span>
        </div>
      </div>
      <div class="hero-art" aria-label="Ilustração abstrata de uma ideia tomando forma" role="img">
        <div class="sun"></div>
        <div class="orbit orbit-large"></div>
        <div class="orbit orbit-small"></div>
        <div class="paper">
          <span class="paper-line paper-line-short"></span>
          <span class="paper-line"></span>
          <span class="paper-line paper-line-medium"></span>
          <span class="paper-line paper-line-short"></span>
          <span class="paper-line paper-line-tiny"></span>
        </div>
        <span class="spark spark-one">✦</span>
        <span class="spark spark-two">✦</span>
        <span class="spark spark-three">✦</span>
        <span class="art-caption">A sua voz<br /><strong>tem espaço.</strong></span>
      </div>
    </section>

    <section class="manifesto" id="manifesto">
      <p class="section-label">Por que HelloWord?</p>
      <h2>Porque toda grande história<br /><em>começa com uma palavra.</em></h2>
      <p>Sem distrações. Sem fórmulas prontas. Apenas as ferramentas certas para você encontrar clareza e fazer acontecer.</p>
    </section>

    <section class="features" id="recursos">
      <article class="feature-card">
        <span class="feature-number">01</span>
        <h3>Comece de onde estiver</h3>
        <p>Um ambiente feito para acolher ideias, mesmo aquelas que ainda estão descobrindo seu caminho.</p>
      </article>
      <article class="feature-card feature-card-highlight">
        <span class="feature-number">02</span>
        <h3>Crie com intenção</h3>
        <p>Organize pensamentos, dê ritmo ao processo e transforme inspiração em algo real.</p>
      </article>
      <article class="feature-card">
        <span class="feature-number">03</span>
        <h3>Compartilhe sua voz</h3>
        <p>Quando estiver pronto, encontre pessoas que querem ouvir exatamente o que você tem a dizer.</p>
      </article>
    </section>
  </main>

  <footer class="footer">
    <a class="brand" href="/" aria-label="HelloWord início"><span class="brand-mark" aria-hidden="true">h</span><span>Hello<span class="brand-accent">Word</span></span></a>
    <span>Feito para ideias que merecem existir.</span>
    <span>© 2024 HelloWord</span>
  </footer>
`;

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});