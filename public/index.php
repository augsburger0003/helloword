<?php

declare(strict_types=1);

use Helloword\Application;

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';

if (is_file($autoload)) {
    require $autoload;
} else {
    // O projeto continua executável sem Composer, inclusive em previews limpos.
    require $root . '/src/Application.php';
}

/** @var array<string, string> $config */
$config = require $root . '/config/app.php';
$application = new Application($config);
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$result = $application->handle(
    is_string($requestPath) ? $requestPath : '/',
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    $_POST
);

http_response_code($result['status']);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if ($result['format'] === 'json') {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($result['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
$data = $result['data'];

$template = match ($result['page']) {
    'about' => '/templates/about.php',
    'contact' => '/templates/contact.php',
    'not-found' => '/templates/not-found.php',
    default => '/templates/home.php',
};

require $root . $template;