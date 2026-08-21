<?php

declare(strict_types=1);

use App\Application;
use App\Http\Response;

require dirname(__DIR__) . '/bootstrap.php';

$application = new Application($database);

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($path === '/health') {
    Response::json($application->health());
}

if ($path === '/api/stats' && $method === 'GET') {
    Response::json([
        'status' => 'ok',
        'data' => $application->stats(),
    ]);
}

if ($path === '/api/ideas') {
    if ($method === 'GET') {
        Response::json([
            'status' => 'ok',
            'data' => $application->ideas(50),
            'stats' => $application->stats(),
        ]);
    }

    if ($method === 'POST') {
        $input = $_POST;
        $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

        if (str_contains($contentType, 'application/json')) {
            try {
                $decoded = json_decode(
                    (string) file_get_contents('php://input'),
                    true,
                    512,
                    JSON_THROW_ON_ERROR
                );
            } catch (\JsonException) {
                Response::json([
                    'status' => 'error',
                    'message' => 'O corpo da requisição precisa ser um JSON válido.',
                ], 400);
            }

            $input = is_array($decoded ?? null) ? $decoded : [];
        }

        try {
            Response::json([
                'status' => 'ok',
                'data' => $application->createIdea($input),
            ], 201);
        } catch (\InvalidArgumentException $exception) {
            Response::json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    header('Allow: GET, POST');
    Response::json([
        'status' => 'error',
        'message' => 'Método não permitido.',
    ], 405);
}

if ($path === '/ideas' && $method === 'POST') {
    try {
        $application->createIdea($_POST);
        header('Location: /?idea=created#ideias', true, 303);
    } catch (\InvalidArgumentException) {
        header('Location: /?idea=invalid#ideias', true, 303);
    }

    exit;
}

if ($path !== '/') {
    Response::json([
        'status' => 'error',
        'message' => 'Rota não encontrada.',
    ], 404);
}

$page = $application->home();
$health = $application->health();
$settings = $page['settings'];
$message = $page['message'];
$ideas = $page['ideas'];
$stats = $page['stats'];
$environment = $page['environment'];
$feedback = $_GET['idea'] ?? '';

$escape = static fn (mixed $value): string => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
$formatDate = static function (mixed $value): string {
    $timestamp = strtotime((string) $value);

    return $timestamp === false ? 'agora' : date('d/m/Y', $timestamp);
};
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?= $escape($settings['tagline']) ?>">
    <title><?= $escape($settings['app_name']) ?> — Olá, mundo!</title>
    <style>
        :root {
            --ink: #152a3a;
            --muted: #637482;
            --blue: #2877d3;
            --blue-dark: #1d5cad;
            --sky: #eaf5ff;
            --line: #dce8ef;
            --paper: #ffffff;
            --yellow: #f8c84e;
            --shadow: 0 22px 60px rgba(25, 66, 93, .12);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            background: var(--sky);
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.5;
        }

        .page {
            min-height: 100vh;
            overflow: hidden;
            position: relative;
        }

        .page::before, .page::after {
            background: rgba(255, 255, 255, .4);
            border-radius: 999px;
            content: "";
            height: 300px;
            position: absolute;
            width: 300px;
            z-index: 0;
        }

        .page::before { left: -170px; top: 110px; }
        .page::after { bottom: -180px; right: -100px; }

        header, main, footer {
            margin: 0 auto;
            max-width: 1160px;
            padding-left: 28px;
            padding-right: 28px;
            position: relative;
            z-index: 1;
        }

        header {
            align-items: center;
            display: flex;
            justify-content: space-between;
            padding-bottom: 26px;
            padding-top: 26px;
        }

        .brand {
            align-items: center;
            color: var(--ink);
            display: inline-flex;
            font-size: 1.04rem;
            font-weight: 800;
            gap: 11px;
            letter-spacing: -.02em;
            text-decoration: none;
        }

        .brand-mark {
            align-items: center;
            background: var(--yellow);
            border-radius: 11px;
            color: #634a00;
            display: inline-flex;
            font-size: .88rem;
            height: 35px;
            justify-content: center;
            transform: rotate(-7deg);
            width: 35px;
        }

        nav { align-items: center; display: flex; gap: 26px; }
        nav a { color: var(--muted); font-size: .9rem; text-decoration: none; }
        nav a:hover { color: var(--blue); }

        .nav-status {
            align-items: center;
            color: #27764e;
            display: inline-flex;
            font-size: .8rem;
            font-weight: 700;
            gap: 7px;
        }

        .dot {
            background: #35b779;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(53, 183, 121, .14);
            height: 7px;
            width: 7px;
        }

        .hero {
            align-items: center;
            display: grid;
            gap: 80px;
            grid-template-columns: minmax(0, 1.05fr) minmax(330px, .95fr);
            min-height: 610px;
            padding-bottom: 74px;
            padding-top: 62px;
        }

        .eyebrow {
            align-items: center;
            color: var(--blue);
            display: flex;
            font-size: .75rem;
            font-weight: 800;
            gap: 10px;
            letter-spacing: .14em;
            margin: 0 0 22px;
            text-transform: uppercase;
        }

        .eyebrow::before {
            background: var(--yellow);
            content: "";
            height: 3px;
            width: 26px;
        }

        h1 {
            font-size: clamp(3.3rem, 7vw, 5.5rem);
            letter-spacing: -.075em;
            line-height: .96;
            margin: 0;
            max-width: 610px;
        }

        h1 em { color: var(--blue); font-style: normal; }

        .lead {
            color: var(--muted);
            font-size: 1.1rem;
            margin: 28px 0 34px;
            max-width: 470px;
        }

        .actions { align-items: center; display: flex; flex-wrap: wrap; gap: 18px; }
        .button {
            background: var(--blue);
            border-radius: 8px;
            box-shadow: 0 10px 22px rgba(40, 119, 211, .22);
            color: #fff;
            display: inline-block;
            font-size: .9rem;
            font-weight: 750;
            padding: 13px 20px;
            text-decoration: none;
            transition: background .2s ease, transform .2s ease;
        }
        .button:hover { background: var(--blue-dark); transform: translateY(-2px); }
        .text-link { color: var(--ink); font-size: .88rem; font-weight: 700; text-decoration: none; }
        .text-link::after { content: "  →"; color: var(--blue); font-size: 1.1rem; }

        .note {
            align-items: center;
            color: #79909e;
            display: flex;
            font-size: .76rem;
            gap: 9px;
            margin-top: 40px;
        }
        .note strong { color: #466171; font-weight: 700; }

        .message-card {
            background: var(--paper);
            border: 1px solid rgba(220, 232, 239, .9);
            border-radius: 20px;
            box-shadow: var(--shadow);
            padding: 31px;
            position: relative;
        }

        .message-card::before {
            color: #cce7fb;
            content: "“";
            font-family: Georgia, serif;
            font-size: 8rem;
            left: 21px;
            line-height: 1;
            position: absolute;
            top: 18px;
        }

        .card-label {
            color: var(--blue);
            font-size: .72rem;
            font-weight: 800;
            letter-spacing: .12em;
            margin: 0 0 67px;
            position: relative;
            text-transform: uppercase;
        }

        blockquote { font-size: 1.7rem; letter-spacing: -.04em; line-height: 1.16; margin: 0 0 23px; position: relative; }
        .card-copy { color: var(--muted); font-size: .92rem; margin: 0 0 26px; }
        .card-footer { align-items: center; border-top: 1px solid var(--line); display: flex; justify-content: space-between; padding-top: 19px; }
        .author { color: var(--muted); font-size: .78rem; }
        .author b { color: var(--ink); display: block; font-size: .82rem; margin-bottom: 2px; }
        .spark { color: var(--yellow); font-size: 1.7rem; letter-spacing: -7px; }

        .features {
            border-top: 1px solid rgba(196, 216, 227, .75);
            display: grid;
            gap: 32px;
            grid-template-columns: repeat(3, 1fr);
            padding-bottom: 66px;
            padding-top: 38px;
        }
        .feature { display: flex; gap: 15px; }
        .feature-icon {
            align-items: center;
            background: #fff;
            border-radius: 10px;
            color: var(--blue);
            display: flex;
            flex: 0 0 38px;
            font-size: 1rem;
            height: 38px;
            justify-content: center;
        }
        .feature h2 { font-size: .88rem; margin: 0 0 4px; }
        .feature p { color: var(--muted); font-size: .77rem; margin: 0; }

        .ideas {
            background: rgba(255, 255, 255, .62);
            border: 1px solid rgba(196, 216, 227, .8);
            border-radius: 20px;
            display: grid;
            gap: 42px;
            grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr);
            margin-bottom: 52px;
            padding: 32px;
        }
        .ideas h2 { font-size: 1.55rem; letter-spacing: -.04em; margin: 0 0 8px; }
        .ideas-intro { color: var(--muted); font-size: .88rem; margin: 0 0 22px; max-width: 380px; }
        .idea-stats { color: var(--muted); display: flex; font-size: .76rem; gap: 20px; margin: 0; }
        .idea-stats strong { color: var(--ink); display: block; font-size: 1.15rem; }
        .idea-form { display: grid; gap: 12px; }
        .idea-form label { color: var(--ink); font-size: .75rem; font-weight: 750; }
        .idea-form input, .idea-form textarea {
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 7px;
            color: var(--ink);
            font: inherit;
            font-size: .84rem;
            padding: 10px 12px;
            width: 100%;
        }
        .idea-form textarea { min-height: 86px; resize: vertical; }
        .idea-form input:focus, .idea-form textarea:focus { border-color: var(--blue); outline: 3px solid rgba(40, 119, 211, .14); }
        .idea-form small { color: var(--muted); font-size: .7rem; margin-top: -4px; }
        .idea-form .button { border: 0; cursor: pointer; justify-self: start; }
        .feedback { border-radius: 7px; font-size: .78rem; margin: 0 0 16px; padding: 10px 12px; }
        .feedback.success { background: #e6f7ee; color: #27764e; }
        .feedback.error { background: #fff0ed; color: #9c3d2d; }
        .idea-list { display: grid; gap: 12px; grid-column: 1 / -1; }
        .idea-list h3 { font-size: .76rem; letter-spacing: .1em; margin: 0 0 2px; text-transform: uppercase; }
        .idea {
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 14px 16px;
        }
        .idea p { color: var(--muted); font-size: .82rem; margin: 5px 0 0; }
        .idea-meta { align-items: center; display: flex; font-size: .74rem; justify-content: space-between; }
        .idea-meta strong { color: var(--ink); }
        .idea-meta time { color: #91a1aa; }
        .empty-ideas { color: var(--muted); font-size: .82rem; margin: 8px 0 0; }

        footer { color: #8396a2; display: flex; font-size: .75rem; justify-content: space-between; padding-bottom: 26px; }
        footer span:last-child { color: #a6b5bd; }

        @media (max-width: 760px) {
            header, main, footer { padding-left: 20px; padding-right: 20px; }
            nav a { display: none; }
            .hero { gap: 45px; grid-template-columns: 1fr; min-height: auto; padding-bottom: 64px; padding-top: 42px; }
            h1 { font-size: clamp(3.2rem, 16vw, 5rem); }
            .features { grid-template-columns: 1fr; }
            .ideas { gap: 28px; grid-template-columns: 1fr; padding: 22px; }
            footer { gap: 12px; flex-direction: column; }
        }
    </style>
</head>
<body>
<div class="page">
    <header>
        <a class="brand" href="/" aria-label="Página inicial Helloword">
            <span class="brand-mark">hw</span>
            <span><?= $escape($settings['app_name']) ?></span>
        </a>
        <nav aria-label="Navegação principal">
            <a href="#sobre">Sobre o projeto</a>
            <span class="nav-status"><span class="dot"></span> online</span>
        </nav>
    </header>

    <main>
        <section class="hero" id="sobre">
            <div>
                <p class="eyebrow">Projeto PHP · <?= $escape($environment) ?></p>
                <h1>Comece com um <em>olá.</em></h1>
                <p class="lead"><?= $escape($settings['tagline']) ?></p>
                <div class="actions">
                    <a class="button" href="#mensagem">Ver a mensagem</a>
                    <a class="text-link" href="https://www.php.net/" target="_blank" rel="noreferrer">Conheça o PHP</a>
                </div>
                <p class="note"><span>✦</span> <strong>Feito para evoluir.</strong> Base limpa, pronta para você.</p>
            </div>

            <article class="message-card" id="mensagem">
                <p class="card-label">Mensagem inicial</p>
                <blockquote><?= $escape($message['title']) ?></blockquote>
                <p class="card-copy"><?= $escape($message['body']) ?></p>
                <div class="card-footer">
                    <div class="author">
                        <b><?= $escape($message['author']) ?></b>
                        Conteúdo demonstrativo
                    </div>
                    <span class="spark">✦✦✦</span>
                </div>
            </article>
        </section>

        <section class="features" aria-label="Características do projeto">
            <article class="feature">
                <span class="feature-icon">⌘</span>
                <div><h2>Simples por padrão</h2><p>PHP sem dependências desnecessárias.</p></div>
            </article>
            <article class="feature">
                <span class="feature-icon">↗</span>
                <div><h2>Pronto para crescer</h2><p>Estrutura organizada desde o primeiro commit.</p></div>
            </article>
            <article class="feature">
                <span class="feature-icon">✓</span>
                <div><h2>Persistência local</h2><p>SQLite inicializado automaticamente.</p></div>
            </article>
        </section>

        <section class="ideas" id="ideias" aria-labelledby="ideas-title">
            <div>
                <p class="eyebrow">Colaboração</p>
                <h2 id="ideas-title">Deixe uma ideia</h2>
                <p class="ideas-intro">
                    Uma funcionalidade real para demonstrar entrada de dados,
                    validação e persistência no SQLite.
                </p>
                <p class="idea-stats">
                    <span><strong><?= $escape($stats['total']) ?></strong> ideias publicadas</span>
                    <span><strong><?= $escape($stats['today']) ?></strong> hoje</span>
                </p>
            </div>

            <div>
                <?php if ($feedback === 'created'): ?>
                    <p class="feedback success" role="status">Ideia publicada. Obrigado por participar!</p>
                <?php elseif ($feedback === 'invalid'): ?>
                    <p class="feedback error" role="alert">Revise os campos e tente novamente.</p>
                <?php endif; ?>

                <form class="idea-form" action="/ideas" method="post">
                    <div>
                        <label for="idea-name">Seu nome</label>
                        <input id="idea-name" name="name" type="text" required minlength="2" maxlength="80" autocomplete="name">
                    </div>
                    <div>
                        <label for="idea-email">E-mail <small>(opcional)</small></label>
                        <input id="idea-email" name="email" type="email" maxlength="160" autocomplete="email">
                    </div>
                    <div>
                        <label for="idea-content">Sua ideia</label>
                        <textarea id="idea-content" name="content" required minlength="5" maxlength="500"></textarea>
                        <small>Conte em até 500 caracteres o que você gostaria de ver por aqui.</small>
                    </div>
                    <button class="button" type="submit">Publicar ideia</button>
                </form>
            </div>

            <div class="idea-list">
                <h3>Contribuições recentes</h3>
                <?php if ($ideas === []): ?>
                    <p class="empty-ideas">Ainda não há contribuições. Seja o primeiro!</p>
                <?php else: ?>
                    <?php foreach ($ideas as $idea): ?>
                        <article class="idea">
                            <div class="idea-meta">
                                <strong><?= $escape($idea['name']) ?></strong>
                                <time datetime="<?= $escape($idea['created_at']) ?>"><?= $escape($formatDate($idea['created_at'])) ?></time>
                            </div>
                            <p><?= nl2br($escape($idea['content'])) ?></p>
                        </article>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>
    </main>

    <footer>
        <span>© <?= date('Y') ?> <?= $escape($settings['app_name']) ?></span>
        <span>SQLite conectado · <?= $escape($health['migrations']) ?> migrações aplicadas</span>
    </footer>
</div>
</body>
</html>