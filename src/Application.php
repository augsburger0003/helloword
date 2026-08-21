<?php

declare(strict_types=1);

namespace Helloword;

final class Application
{
    /**
     * @param array<string, string> $config
     */
    public function __construct(private readonly array $config)
    {
    }

    /**
     * Resolve a URL e prepara os dados consumidos pelas páginas.
     *
     * @return array{status: int, page: string, data: array<string, string>}
     */
    public function handle(string $path): array
    {
        $path = rtrim($path, '/') ?: '/';

        if ($path === '/') {
            return [
                'status' => 200,
                'page' => 'home',
                'data' => $this->homeData(),
            ];
        }

        return [
            'status' => 404,
            'page' => 'not-found',
            'data' => [
                'appName' => $this->config['name'],
                'path' => $path,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function homeData(): array
    {
        return [
            'appName' => $this->config['name'],
            'tagline' => $this->config['tagline'],
            'environment' => $this->config['environment'],
            'phpVersion' => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
            'serverTime' => date('H:i'),
        ];
    }
}