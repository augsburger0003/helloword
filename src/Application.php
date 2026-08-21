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
     * Resolve uma URL e prepara os dados consumidos pelas páginas.
     *
     * @param array<string, mixed> $input
     * @return array{status: int, page: string, format: string, data: array<string, mixed>}
     */
    public function handle(string $path, string $method = 'GET', array $input = []): array
    {
        $path = $this->normalizePath($path);
        $method = strtoupper($method);

        if ($path === '/') {
            return [
                'status' => 200,
                'page' => 'home',
                'format' => 'html',
                'data' => $this->homeData(),
            ];
        }

        if ($path === '/sobre' && $method === 'GET') {
            return [
                'status' => 200,
                'page' => 'about',
                'format' => 'html',
                'data' => $this->aboutData(),
            ];
        }

        if ($path === '/contato') {
            return [
                'status' => 200,
                'page' => 'contact',
                'format' => 'html',
                'data' => $this->contactData($method === 'POST' ? $input : []),
            ];
        }

        if ($path === '/api/status' && $method === 'GET') {
            return [
                'status' => 200,
                'page' => 'status',
                'format' => 'json',
                'data' => [
                    'name' => $this->config['name'],
                    'status' => 'ok',
                    'environment' => $this->config['environment'],
                    'php' => PHP_VERSION,
                    'serverTime' => date(DATE_ATOM),
                    'routes' => ['/', '/sobre', '/contato', '/api/status'],
                ],
            ];
        }

        return [
            'status' => 404,
            'page' => 'not-found',
            'format' => 'html',
            'data' => [
                'appName' => $this->config['name'],
                'path' => $path,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function homeData(): array
    {
        return [
            'appName' => $this->config['name'],
            'tagline' => $this->config['tagline'],
            'environment' => $this->config['environment'],
            'phpVersion' => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
            'serverTime' => date('H:i'),
            'year' => date('Y'),
            'routes' => [
                ['path' => '/sobre', 'label' => 'Sobre o projeto', 'description' => 'Entenda as escolhas e a estrutura desta base.'],
                ['path' => '/contato', 'label' => 'Enviar uma mensagem', 'description' => 'Um formulário PHP com validação no servidor.'],
                ['path' => '/api/status', 'label' => 'Status da aplicação', 'description' => 'Uma resposta JSON pronta para integrações.'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function aboutData(): array
    {
        return [
            'appName' => $this->config['name'],
            'environment' => $this->config['environment'],
            'phpVersion' => PHP_VERSION,
            'year' => date('Y'),
            'principles' => [
                ['title' => 'Front controller', 'text' => 'Todas as páginas passam por public/index.php, mantendo entrada e headers em um único lugar.'],
                ['title' => 'Código legível', 'text' => 'O roteamento fica em uma classe pequena e os templates cuidam apenas da apresentação.'],
                ['title' => 'Evolução segura', 'text' => 'Composer é opcional e a aplicação continua iniciando em um ambiente limpo.'],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function contactData(array $input): array
    {
        $name = $this->inputString($input, 'name');
        $email = $this->inputString($input, 'email');
        $message = $this->inputString($input, 'message');
        $errors = [];
        $submitted = $input !== [];
        $success = false;

        if ($submitted) {
            if ($name === '' || strlen($name) < 2) {
                $errors['name'] = 'Informe seu nome (pelo menos 2 caracteres).';
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Informe um e-mail válido.';
            }
            if ($message === '' || strlen($message) < 10) {
                $errors['message'] = 'Escreva uma mensagem com pelo menos 10 caracteres.';
            }
            if (strlen($message) > 2000) {
                $errors['message'] = 'A mensagem deve ter no máximo 2.000 caracteres.';
            }
            $success = $errors === [];
        }

        return [
            'appName' => $this->config['name'],
            'year' => date('Y'),
            'name' => $name,
            'email' => $email,
            'message' => $message,
            'errors' => $errors,
            'submitted' => $submitted,
            'success' => $success,
        ];
    }

    /**
     * Ignore structured values submitted for scalar form fields.
     *
     * @param array<string, mixed> $input
     */
    private function inputString(array $input, string $key): string
    {
        $value = $input[$key] ?? '';

        return is_string($value) ? trim($value) : '';
    }

    private function normalizePath(string $path): string
    {
        $parsedPath = parse_url($path, PHP_URL_PATH);
        $path = is_string($parsedPath) && $parsedPath !== '' ? $parsedPath : '/';

        return $path === '/' ? '/' : '/' . trim($path, '/');
    }
}