<?php

declare(strict_types=1);

namespace App\Database;

use PDO;

final class Connection
{
    private PDO $pdo;

    public function __construct(string $databasePath)
    {
        $path = $this->resolvePath($databasePath);
        $directory = dirname($path);

        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $this->pdo = new PDO('sqlite:' . $path);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->pdo->exec('PRAGMA foreign_keys = ON');
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    /** @return array<string, mixed>|null */
    public function one(string $query, array $parameters = []): ?array
    {
        $statement = $this->pdo->prepare($query);
        $statement->execute($parameters);
        $result = $statement->fetch();

        return $result === false ? null : $result;
    }

    /** @return list<array<string, mixed>> */
    public function all(string $query, array $parameters = []): array
    {
        $statement = $this->pdo->prepare($query);
        $statement->execute($parameters);

        return $statement->fetchAll();
    }

    private function resolvePath(string $databasePath): string
    {
        if ($databasePath === ':memory:' || str_starts_with($databasePath, '/')) {
            return $databasePath;
        }

        return dirname(__DIR__, 2) . '/' . ltrim($databasePath, '/');
    }
}