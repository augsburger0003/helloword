import React from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Check, Menu, Sparkles, X } from 'lucide-react'
import './styles.css'

const highlights = [
  {
    number: '01',
    title: 'Comece com clareza',
    text: 'Tire a ideia da cabeça e dê a ela um próximo passo simples.'
  },
  {
    number: '02',
    title: 'Construa no seu ritmo',
    text: 'Um espaço leve para transformar intenção em movimento todos os dias.'
  },
  {
    number: '03',
    title: 'Compartilhe o que importa',
    text: 'Mostre seu trabalho, convide pessoas e celebre cada pequena conquista.'
  }
]

function App() {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="HelloWord início">
          <span className="brand-mark">H</span>
          <span>Hello<span className="brand-accent">Word</span></span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Navegação principal">
          <a href="#proposta" onClick={() => setMenuOpen(false)}>A proposta</a>
          <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a>
          <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
          <a className="nav-action" href="#comece" onClick={() => setMenuOpen(false)}>Começar agora <ArrowRight size={16} /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="proposta">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Um novo começo</div>
            <h1>Suas melhores ideias merecem <em>espaço.</em></h1>
            <p className="hero-text">
              HelloWord é o lugar para organizar pensamentos, iniciar projetos
              e fazer acontecer — uma palavra por vez.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#comece">Dar o primeiro passo <ArrowRight size={18} /></a>
              <a className="text-link" href="#como-funciona">Descobrir mais <span>↗</span></a>
            </div>
            <div className="trust-note"><span className="avatar-stack"><i /><i /><i /></span> Feito para pessoas que criam</div>
          </div>

          <div className="hero-art" aria-label="Ilustração abstrata de uma ideia em crescimento">
            <div className="sun-glow" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="plant">
              <span className="stem" />
              <span className="leaf leaf-left" />
              <span className="leaf leaf-right" />
              <span className="leaf leaf-top" />
              <span className="pot-top" />
              <span className="pot-body" />
            </div>
            <span className="spark spark-one">✦</span>
            <span className="spark spark-two">·</span>
            <span className="spark spark-three">✦</span>
          </div>
        </section>

        <section className="intro" id="como-funciona">
          <div className="section-kicker">A ideia é simples</div>
          <h2>Todo grande projeto começa<br className="desktop-break" /> com um <span>primeiro passo.</span></h2>
          <p>Não precisa estar tudo pronto. Você só precisa começar.</p>
        </section>

        <section className="highlights">
          {highlights.map((highlight) => (
            <article className="highlight-card" key={highlight.number}>
              <span className="card-number">{highlight.number}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.text}</p>
              <Check className="card-check" size={19} />
            </article>
          ))}
        </section>

        <section className="closing" id="comece">
          <div>
            <div className="section-kicker light">A partir de hoje</div>
            <h2>Vamos dar vida<br /> ao que você imagina?</h2>
          </div>
          <a className="light-button" href="#contato">Quero começar <ArrowRight size={18} /></a>
        </section>
      </main>

      <footer id="contato">
        <a className="brand footer-brand" href="/" aria-label="HelloWord início">
          <span className="brand-mark">H</span>
          <span>Hello<span className="brand-accent">Word</span></span>
        </a>
        <span>Feito com intenção.</span>
        <span>© 2025 HelloWord</span>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)