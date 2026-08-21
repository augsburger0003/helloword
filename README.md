# Helloword

Projeto PHP enxuto, executável sem framework e com uma página inicial em `/`.
O bootstrap cria o banco SQLite, aplica as migrações e carrega a mensagem
demonstrativa de forma idempotente.

## Requisitos

- PHP 8.1 ou superior
- Extensões `pdo` e `pdo_sqlite`
- Composer (opcional; útil para os scripts do projeto)

## Inicialização local

```bash
cp .env.example .env
php -S 127.0.0.1:8000 -t public
```

Abra <http://127.0.0.1:8000/> no navegador. O banco será criado em
`storage/helloword.sqlite` na primeira requisição. Também é possível iniciar o
servidor a partir da raiz com `php -S 127.0.0.1:8000`, graças ao entry point de
compatibilidade `index.php`.

Com Composer:

```bash
composer install
composer serve
```

## Banco e dados demonstrativos

As migrações ficam em `database/migrations` e são aplicadas automaticamente
durante o bootstrap. Para executá-las explicitamente:

```bash
php bin/migrate.php
# ou
composer migrate
```

O seed inicial usa `INSERT OR IGNORE`, portanto pode ser executado em todos os
boots sem duplicar dados. O caminho do banco pode ser substituído por
`DB_DATABASE` no ambiente. Não há autenticação nesta aplicação; por isso não
existe credencial administrativa ou arquivo de acesso de demonstração.

## Estrutura

```text
public/                 document root e rota /
src/Application.php     dados usados pela página inicial
src/Database/           conexão, migrações e seed
database/migrations/    esquema versionado do SQLite
storage/                dados locais gerados em runtime
bootstrap.php           configuração e inicialização da aplicação
```