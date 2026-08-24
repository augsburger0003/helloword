# Dashboardia · HelloWord

Dashboardia é um painel operacional executável para acompanhar projetos, tarefas,
ritmo de entrega e atividade do time. A interface é servida pelo backend e a
rota `/` já contém o fluxo completo de acesso e de navegação do workspace.

## Requisitos

- Node.js 18.17 ou superior
- npm

## Inicialização local

```bash
npm install
cp .env.example .env
DASHBOARDIA_DEMO_MODE=true npm start
```

Abra [http://localhost:3000/](http://localhost:3000/). Em Windows, configure as
variáveis de ambiente no terminal equivalente antes de executar `npm start`.

Quando o modo demonstrativo estiver ativo, o bootstrap cria de forma idempotente:

- uma conta administrativa;
- os projetos HelloWord e Operações;
- quatro tarefas em estados diferentes;
- eventos de atividade do workspace.

As credenciais são lidas de `DASHBOARDIA_DEMO_USERNAME`,
`DASHBOARDIA_DEMO_EMAIL` e `DASHBOARDIA_DEMO_PASSWORD`. Os valores padrão
documentados no `.env.example` são `admin`,
`admin@dashboardia.local` e `dashboardia-demo`. O arquivo
`.dashboardia/demo-access.json` é gerado automaticamente com `{"version":1}` e
não é versionado.

> Em produção, defina credenciais próprias e mantenha
> `DASHBOARDIA_DEMO_MODE=false`. O modo demonstrativo é a única condição que
> habilita a criação automática da conta e dos dados iniciais.

## Dados e migrações

O SQLite é criado em `.dashboardia/dashboardia.sqlite` (ou no caminho definido
por `DATABASE_PATH`). A aplicação cria o diretório, abre a conexão com foreign
keys e aplica os arquivos de `src/migrations` antes de subir o servidor.
Migrações já aplicadas são registradas em `schema_migrations`.

Comandos disponíveis:

```bash
npm run migrate
DASHBOARDIA_DEMO_MODE=true npm run seed
```

O seed manual possui a mesma proteção do bootstrap. A execução é idempotente,
preserva as restrições de unicidade e só gera a massa demonstrativa quando o
modo estiver explicitamente habilitado. Datas de auditoria são preenchidas no
momento da escrita; triggers do SQLite mantêm `updated_at` centralizado em
alterações.

## API principal

- `GET /api/health` — verificação do serviço;
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` — sessão
  administrativa com cookie HttpOnly;
- `GET /api/dashboard` — resumo, projetos, tarefas, equipe e atividade;
- `GET /api/projects`, `POST /api/projects` — consulta e criação de projetos;
- `POST /api/tasks`, `PATCH /api/tasks/:id` — criação e atualização de tarefas.

Todas as rotas de workspace exigem uma sessão válida. A sessão expira em oito
horas e tokens são armazenados no banco somente como digest SHA-256.

## Estrutura

```text
server.js                 servidor HTTP e rotas da API
src/config.js             configuração por ambiente
src/db.js                 conexão SQLite e executor de migrações
src/migrations/            schema, índices e auditoria
src/seed.js                bootstrap demonstrativo idempotente
src/security.js            hash de senha e tokens de sessão
public/index.html          aplicação web na rota /
public/styles.css          interface responsiva
public/app.js              navegação e consumo da API
```