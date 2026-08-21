<?php

declare(strict_types=1);

namespace App\Database;

use App\Support\Clock;
use RuntimeException;

final class Migrator
{
    public function __construct(
        private readonly Connection $connection,
        private readonly string $migrationsPath
    ) {
    }

    public function run(): void
    {
        $pdo = $this->connection->pdo();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration TEXT NOT NULL UNIQUE,
                applied_at TEXT NOT NULL
            )'
        );

        $files = glob($this->migrationsPath . '/*.sql');

        if ($files === false) {
            throw new RuntimeException('Não foi possível localizar as migrações.');
        }

        sort($files);
        $applied = $this->connection->all('SELECT migration FROM migrations');
        $appliedNames = array_column($applied, 'migration');

        foreach ($files as $file) {
            $name = basename($file);

            if (in_array($name, $appliedNames, true)) {
                continue;
            }

            $sql = file_get_contents($file);

            if ($sql === false) {
                throw new RuntimeException("Não foi possível ler a migração {$name}.");
            }

            $pdo->beginTransaction();

            try {
                $pdo->exec($sql);
                $statement = $pdo->prepare(
                    'INSERT INTO migrations (migration, applied_at) VALUES (:migration, :applied_at)'
                );
                $statement->execute([
                    'migration' => $name,
                    'applied_at' => Clock::now(),
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
}