<?php

declare(strict_types=1);

/**
 * @var array<string, mixed> $data
 */
$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
$errors = $data['errors'];
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Entre em contato com <?= $escape($data['appName']) ?>.">
    <title>Contato · <?= $escape($data['appName']) ?></title>
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
                <a href="/sobre">Sobre</a>
                <a class="active" href="/contato">Contato</a>
                <a href="/api/status">API <span aria-hidden="true">↗</span></a>
            </nav>
            <div class="header-meta">
                <span class="status-dot" aria-hidden="true"></span>
                <span>fale conosco</span>
            </div>
        </header>

        <main class="inner-page">
            <section class="contact-layout" aria-labelledby="page-title">
                <div class="contact-copy">
                    <p class="eyebrow"><span>01</span> contato</p>
                    <h1 id="page-title">Vamos tirar<br><em>a ideia do papel.</em></h1>
                    <p class="inner-lead">Conte o que você quer construir. Este formulário demonstra uma entrada real processada e validada pelo PHP no servidor.</p>
                    <p class="form-note">Nenhuma mensagem é armazenada nesta demonstração.</p>
                </div>

                <form class="contact-form" method="post" action="/contato">
                    <?php if ($data['success']): ?>
                        <div class="form-success" role="status">
                            <strong>Mensagem recebida.</strong>
                            <span>Obrigado, <?= $escape($data['name']) ?>. O próximo passo começa aqui.</span>
                        </div>
                    <?php elseif ($data['submitted']): ?>
                        <div class="form-alert" role="alert">Confira os campos destacados e tente novamente.</div>
                    <?php endif; ?>

                    <div class="field">
                        <label for="name">Seu nome</label>
                        <input id="name" name="name" type="text" value="<?= $escape($data['name']) ?>" autocomplete="name" required>
                        <?php if (isset($errors['name'])): ?><small class="field-error"><?= $escape($errors['name']) ?></small><?php endif; ?>
                    </div>
                    <div class="field">
                        <label for="email">Seu e-mail</label>
                        <input id="email" name="email" type="email" value="<?= $escape($data['email']) ?>" autocomplete="email" required>
                        <?php if (isset($errors['email'])): ?><small class="field-error"><?= $escape($errors['email']) ?></small><?php endif; ?>
                    </div>
                    <div class="field">
                        <label for="message">Mensagem</label>
                        <textarea id="message" name="message" rows="5" required><?= $escape($data['message']) ?></textarea>
                        <?php if (isset($errors['message'])): ?><small class="field-error"><?= $escape($errors['message']) ?></small><?php endif; ?>
                    </div>
                    <button class="button button-primary form-submit" type="submit">Enviar mensagem <span aria-hidden="true">→</span></button>
                </form>
            </section>
        </main>

        <footer class="site-footer">
            <span><?= $escape($data['appName']) ?> <span class="footer-slash">/</span> <?= $escape($data['year']) ?></span>
            <a href="/">voltar ao início</a>
        </footer>
    </div>
</body>
</html>