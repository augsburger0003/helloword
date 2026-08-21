<?php

declare(strict_types=1);

namespace App;

use App\Database\Connection;
use App\Support\Clock;
use App\Support\Env;

final class Application
{
    public function __construct(private readonly Connection $connection)
    {
    }

    /** @return array{settings: array<string, mixed>, message: array<string, mixed>, environment: string} */
    public function home(): array
    {
        $settings = $this->connection->one(
            'SELECT app_name, tagline FROM app_settings WHERE id = 1'
        );
        $message = $this->connection->one(
            'SELECT title, body, author FROM welcome_messages WHERE slug = :slug',
            ['slug' => 'hello-world']
        );

        return [
            'settings' => $settings ?? [
                'app_name' => 'Helloword',
                'tagline' => 'Um começo pequeno para ideias que vão longe.',
            ],
            'message' => $message ?? [
                'title' => 'Olá, mundo!',
                'body' => 'A aplicação está pronta.',
                'author' => 'Helloword',
            ],
            'environment' => Env::get('APP_ENV') ?: 'local',
        ];
    }

    /** @return array{status: string, application: string, database: string, migrations: int, checked_at: string} */
    public function health(): array
    {
        $this->connection->one('SELECT 1 AS ready');
        $migrationRow = $this->connection->one('SELECT COUNT(*) AS total FROM migrations');

        return [
            'status' => 'ok',
            'application' => Env::get('APP_NAME') ?: 'Helloword',
            'database' => 'sqlite',
            'migrations' => (int) ($migrationRow['total'] ?? 0),
            'checked_at' => Clock::now(),
        ];
    }
}