<?php

declare(strict_types=1);

namespace App\Http;

use JsonException;

final class Response
{
    /** @param array<string, mixed> $payload */
    public static function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        try {
            echo json_encode(
                $payload,
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            );
        } catch (JsonException) {
            http_response_code(500);
            echo '{"status":"error","message":"Não foi possível serializar a resposta."}';
        }

        exit;
    }
}