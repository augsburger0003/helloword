<?php

declare(strict_types=1);

/**
 * @var array<string, mixed> $data
 */
$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Conheça a estrutura do projeto <?= $escape($data['appName']) ?>.">
    <title>Sobre · <?= $escape($data['appName']) ?></title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="page-shell">
        <header class="site-header">
            <a class="brand" href="/" aria-label="Voltar para o início">
                <span class="brand-mark" aria-hidden="true">&lt;/&gt;</span>
                <span><?= $escape($data['appName']) ?></span>
            </a>
            <nav class="main-nav" aria-label="Navegação principal">
                <a class="active" href="/sobre">Sobre</a>
                <a href="/contato">Contato</a>
                <a href="/api/status">API <span aria-hidden="true">↗</span></a>
            </nav>
            <div class="header-meta">
                <span class="status-dot" aria-hidden="true"></span>
                <span>online</span>
            </div>
        </header>

        <main class="inner-page">
            <section class="inner-hero" aria-labelledby="page-title">
                <p class="eyebrow"><span>01</span> sobre a base</p>
                <h1 id="page-title">Feito para<br><em>evoluir.</em></h1>
                <p class="inner-lead">Uma aplicação PHP pequena, mas com os caminhos essenciais para virar um produto real: páginas, validação no servidor e uma API simples.</p>
            </section>

            <section class="principles" aria-labelledby="principles-title">
                <div class="section-heading">
                    <p class="eyebrow"><span>02</span> como funciona</p>
                    <h2 id="principles-title">Clareza em<br><em>cada camada.</em></h2>
                </div>
                <div class="principle-list">
                    <?php foreach ($data['principles'] as $index => $principle): ?>
                        <article class="principle">
                            <span class="feature-number"><?= $escape(sprintf('%02d', $index + 1)) ?></span>
                            <div>
                                <h3><?= $escape($principle['title']) ?></h3>
                                <p><?= $escape($principle['text']) ?></p>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            </section>

            <section class="runtime-panel" aria-label="Informações do ambiente">
                <div>
                    <span class="panel-label">ambiente atual</span>
                    <strong><?= $escape(ucfirst($data['environment'])) ?></strong>
                </div>
                <div>
                    <span class="panel-label">runtime</span>
                    <strong>PHP <?= $escape($data['phpVersion']) ?></strong>
                </div>
                <a class="button button-primary" href="/contato">Começar uma conversa <span aria-hidden="true">→</span></a>
            </section>
        </main>

        <footer class="site-footer">
            <span><?= $escape($data['appName']) ?> <span class="footer-slash">/</span> <?= $escape($data['year']) ?></span>
            <a href="/">voltar ao início</a>
        </footer>
    </div>
</body>
</html>