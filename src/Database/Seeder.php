<?php

declare(strict_types=1);

namespace App\Database;

use App\Support\Clock;
use App\Support\Env;

final class Seeder
{
    public function __construct(private readonly Connection $connection)
    {
    }

    public function run(): void
    {
        $now = Clock::now();
        $pdo = $this->connection->pdo();

        $pdo->beginTransaction();

        try {
            $settings = $pdo->prepare(
                'INSERT OR IGNORE INTO app_settings
                    (id, app_name, tagline, created_at, updated_at)
                 VALUES (1, :app_name, :tagline, :created_at, :updated_at)'
            );
            $settings->execute([
                'app_name' => Env::get('APP_NAME') ?: 'Helloword',
                'tagline' => 'Um começo pequeno para ideias que vão longe.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $message = $pdo->prepare(
                'INSERT OR IGNORE INTO welcome_messages
                    (slug, title, body, author, created_at, updated_at)
                 VALUES (:slug, :title, :body, :author, :created_at, :updated_at)'
            );
            $message->execute([
                'slug' => 'hello-world',
                'title' => 'Olá, mundo!',
                'body' => 'A aplicação está pronta para receber a sua próxima ideia.',
                'author' => 'Helloword',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        }
    }
}