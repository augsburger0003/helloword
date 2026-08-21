<?php

declare(strict_types=1);

namespace App;

use App\Database\Connection;

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
            'environment' => \App\Support\Env::get('APP_ENV', 'local') ?? 'local',
        ];
    }
}