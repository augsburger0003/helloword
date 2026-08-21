<?php

declare(strict_types=1);

/**
 * @var array<string, string> $data
 */
$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?= $escape($data['appName']) ?> — um projeto PHP pronto para começar.">
    <title><?= $escape($data['appName']) ?> · Hello World</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="page-shell">
        <header class="site-header">
            <a class="brand" href="/" aria-label="Voltar para o início">
                <span class="brand-mark" aria-hidden="true">&lt;/&gt;</span>
                <span><?= $escape($data['appName']) ?></span>
            </a>
            <div class="header-meta">
                <span class="status-dot" aria-hidden="true"></span>
                <span>PHP starter</span>
            </div>
        </header>

        <main>
            <section class="hero" aria-labelledby="page-title">
                <div class="hero-copy">
                    <p class="eyebrow"><span>01</span> primeiro passo</p>
                    <h1 id="page-title">Olá, <em>mundo.</em></h1>
                    <p class="hero-text"><?= $escape($data['tagline']) ?></p>
                    <div class="hero-actions">
                        <a class="button button-primary" href="#sobre">Conheça a base <span aria-hidden="true">↓</span></a>
                        <span class="runtime-label">Executando agora em PHP <?= $escape($data['phpVersion']) ?></span>
                    </div>
                </div>

                <div class="code-card" aria-label="Exemplo de código PHP">
                    <div class="window-bar">
                        <span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span>index.php</span>
                        <span class="window-lock" aria-hidden="true">●</span>
                    </div>
                    <pre><code><span class="code-muted">&lt;?</span><span class="code-keyword">php</span>

<span class="code-keyword">echo</span> <span class="code-string">'Hello, world!'</span>;

<span class="code-comment">// e o próximo passo é seu</span></code></pre>
                    <div class="code-footer">
                        <span><span class="live-dot"></span> aplicação online</span>
                        <span>UTF-8</span>
                    </div>
                </div>
            </section>

            <section class="intro-grid" id="sobre" aria-label="Sobre o projeto">
                <div class="section-heading">
                    <p class="eyebrow"><span>02</span> uma base pronta</p>
                    <h2>Pequeno no tamanho.<br><em>Claro na intenção.</em></h2>
                </div>
                <div class="section-copy">
                    <p>Helloword é um ponto de partida PHP sem excesso. A estrutura é direta para que você possa trocar o exemplo por uma ideia real sem lutar contra o projeto.</p>
                    <div class="stats" aria-label="Informações da aplicação">
                        <div class="stat">
                            <strong><?= $escape($data['serverTime']) ?></strong>
                            <span>hora do servidor</span>
                        </div>
                        <div class="stat">
                            <strong><?= $escape(ucfirst($data['environment'])) ?></strong>
                            <span>ambiente</span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="feature-grid" aria-label="Características">
                <article class="feature-card feature-card-accent">
                    <span class="feature-number">01</span>
                    <div class="feature-icon" aria-hidden="true">✦</div>
                    <h3>Direto ao ponto</h3>
                    <p>Um front controller e uma classe de aplicação para manter o fluxo fácil de entender.</p>
                </article>
                <article class="feature-card">
                    <span class="feature-number">02</span>
                    <div class="feature-icon" aria-hidden="true">↗</div>
                    <h3>Pronto para crescer</h3>
                    <p>Composer, autoload PSR-4 e configuração separada deixam o próximo passo organizado.</p>
                </article>
                <article class="feature-card">
                    <span class="feature-number">03</span>
                    <div class="feature-icon" aria-hidden="true">⌘</div>
                    <h3>Sem dependências</h3>
                    <p>Funciona com o servidor embutido do PHP, sem instalação adicional para ver a primeira tela.</p>
                </article>
            </section>
        </main>

        <footer class="site-footer">
            <span><?= $escape($data['appName']) ?> <span class="footer-slash">/</span> <?= $escape($data['year']) ?></span>
            <span>feito para começar</span>
        </footer>
    </div>
</body>
</html>