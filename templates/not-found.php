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
    <title>404 · <?= $escape($data['appName']) ?></title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="page-shell page-shell-not-found">
        <header class="site-header">
            <a class="brand" href="/">
                <span class="brand-mark" aria-hidden="true">&lt;/&gt;</span>
                <span><?= $escape($data['appName']) ?></span>
            </a>
        </header>
        <main class="not-found">
            <p class="eyebrow"><span>404</span> caminho não encontrado</p>
            <h1>Ops, essa página<br><em>não existe.</em></h1>
            <p>Não encontramos <strong><?= $escape($data['path']) ?></strong>.</p>
            <a class="button button-primary" href="/">Voltar ao início <span aria-hidden="true">→</span></a>
        </main>
    </div>
</body>
</html>