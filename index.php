<?php

declare(strict_types=1);

/*
 * Compatibility entry point for `php -S localhost:8000` started at the
 * project root. Production and the documented command use /public as the
 * document root.
 */
require __DIR__ . '/public/index.php';