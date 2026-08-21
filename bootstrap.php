<?php

declare(strict_types=1);

use App\Database\Connection;
use App\Database\Migrator;
use App\Database\Seeder;

require_once __DIR__ . '/src/Support/Env.php';

App\Support\Env::load(__DIR__ . '/.env');

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = __DIR__ . '/src/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($file)) {
        require_once $file;
    }
});

$databasePath = App\Support\Env::get('DB_DATABASE');

if ($databasePath === null || trim($databasePath) === '') {
    $databasePath = 'storage/helloword.sqlite';
}

$database = new Connection($databasePath);
(new Migrator($database, __DIR__ . '/database/migrations'))->run();
(new Seeder($database))->run();