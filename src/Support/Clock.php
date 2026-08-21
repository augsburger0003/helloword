<?php

declare(strict_types=1);

namespace App\Support;

final class Clock
{
    public static function now(): string
    {
        return gmdate('c');
    }
}