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
$result = $application->handle(is_string($requestPath) ? $requestPath : '/');

http_response_code($result['status']);
header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
$data = $result['data'];

if ($result['page'] === 'not-found') {
    require $root . '/templates/not-found.php';
    exit;
}

require $root . '/templates/home.php';