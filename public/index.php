<?php

declare(strict_types=1);

use Helloword\Application;

require dirname(__DIR__) . '/src/Application.php';

/** @var array<string, string> $config */
$config = require dirname(__DIR__) . '/config/app.php';
$application = new Application($config);
$result = $application->handle(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

http_response_code($result['status']);
$data = $result['data'];

if ($result['page'] === 'not-found') {
    require dirname(__DIR__) . '/templates/not-found.php';
    exit;
}

require dirname(__DIR__) . '/templates/home.php';