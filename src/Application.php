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

    /**
     * @return array{
     *     settings: array<string, mixed>,
     *     message: array<string, mixed>,
     *     ideas: list<array<string, mixed>>,
     *     stats: array<string, int>,
     *     environment: string
     * }
     */
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
            'ideas' => $this->ideas(4),
            'stats' => $this->stats(),
            'environment' => Env::get('APP_ENV') ?: 'local',
        ];
    }

    /** @return list<array<string, mixed>> */
    public function ideas(int $limit = 10): array
    {
        $limit = max(1, min($limit, 50));

        return $this->connection->all(
            'SELECT id, name, content, created_at
             FROM ideas
             WHERE status = :status
             ORDER BY created_at DESC, id DESC
             LIMIT ' . $limit,
            ['status' => 'published']
        );
    }

    /** @return array{total: int, today: int} */
    public function stats(): array
    {
        $row = $this->connection->one(
            "SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today
             FROM ideas
             WHERE status = :status",
            ['status' => 'published']
        );

        return [
            'total' => (int) ($row['total'] ?? 0),
            'today' => (int) ($row['today'] ?? 0),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function createIdea(array $input): array
    {
        $nameInput = $input['name'] ?? '';
        $emailInput = $input['email'] ?? '';
        $contentInput = $input['content'] ?? '';
        $name = is_scalar($nameInput)
            ? preg_replace('/\s+/', ' ', trim((string) $nameInput))
            : '';
        $email = is_scalar($emailInput) ? trim((string) $emailInput) : '';
        $content = is_scalar($contentInput) ? trim((string) $contentInput) : '';

        if ($name === null || strlen($name) < 2 || strlen($name) > 80) {
            throw new \InvalidArgumentException('Informe seu nome (entre 2 e 80 caracteres).');
        }

        if ($email !== '' && (strlen($email) > 160 || filter_var($email, FILTER_VALIDATE_EMAIL) === false)) {
            throw new \InvalidArgumentException('Informe um e-mail válido ou deixe o campo em branco.');
        }

        if (strlen($content) < 5 || strlen($content) > 500) {
            throw new \InvalidArgumentException('A ideia precisa ter entre 5 e 500 caracteres.');
        }

        // A camada de aplicação é o ponto único de escrita e preenche os
        // campos de auditoria com o mesmo instante UTC.
        $now = Clock::now();
        $statement = $this->connection->pdo()->prepare(
            'INSERT INTO ideas
                (name, email, content, status, created_at, updated_at)
             VALUES (:name, :email, :content, :status, :created_at, :updated_at)'
        );
        $statement->execute([
            'name' => $name,
            'email' => $email === '' ? null : $email,
            'content' => $content,
            'status' => 'published',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $id = (int) $this->connection->pdo()->lastInsertId();

        return $this->connection->one(
            'SELECT id, name, content, created_at FROM ideas WHERE id = :id',
            ['id' => $id]
        ) ?? [];
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