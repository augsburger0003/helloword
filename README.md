# Helloword

Projeto PHP enxuto, executável sem framework e com uma página inicial em `/`.
Além da apresentação, o projeto possui um mural de ideias funcional: visitantes
podem publicar contribuições, consultar as mais recentes e acompanhar
indicadores básicos. O bootstrap cria o banco SQLite, aplica as migrações e
carrega dados demonstrativos de forma idempotente.

## Requisitos

- PHP 8.1 ou superior
- Extensões `pdo` e `pdo_sqlite`
- Composer (opcional; oferece os scripts do projeto)

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

Sem Composer, o mesmo servidor pode ser iniciado diretamente:

```bash
php -S 127.0.0.1:8000 -t public
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
`DB_DATABASE` no ambiente. O endpoint `/health` retorna JSON com o estado da
aplicação, do SQLite e a quantidade de migrações aplicadas. A migração
`003_create_ideas.sql` cria o mural e inclui três ideias demonstrativas.

## Funcionalidades e API

- `GET /` exibe a página visual, a mensagem inicial, estatísticas e o mural.
- `POST /ideas` valida e publica uma ideia enviada pelo formulário, retornando
  à página com uma mensagem de sucesso ou erro.
- `GET /api/ideas` retorna até 50 ideias publicadas e seus indicadores em JSON.
- `POST /api/ideas` aceita formulário ou JSON com `name`, `email` (opcional) e
  `content`; responde `201` quando a ideia é criada e `422` para dados
  inválidos.
- `GET /api/stats` retorna as contagens total e do dia.
- `GET /health` verifica a conexão e as migrações.

Os textos apresentados pelos visitantes são escapados antes da renderização.
As validações de tamanho e e-mail acontecem no servidor, e os campos
`created_at` e `updated_at` são preenchidos centralmente com UTC no momento da
criação.

Esta versão não possui autenticação nem área administrativa; por isso não há
credenciais ou arquivo de acesso de demonstração.

## Estrutura

```text
public/                 document root e rota /
composer.json           manifest, autoload PSR-4 e scripts locais
src/Application.php     casos de uso da página e do mural de ideias
src/Http/Response.php   resposta JSON para endpoints operacionais
src/Database/           conexão, migrações e seed
database/migrations/    esquema versionado do SQLite, incluindo o mural
storage/                dados locais gerados em runtime
bootstrap.php           configuração e inicialização da aplicação
```