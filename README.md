# Helloword · Mercado Livre

Uma experiência de marketplace inspirada no Mercado Livre para explorar
ofertas, buscar produtos, filtrar por categoria e concluir um carrinho de
compras. A aplicação roda com Node.js puro, sem servidor de banco externo ou
dependências adicionais além das ferramentas de desenvolvimento já listadas.

## Requisitos e inicialização

- Node.js 18 ou superior
- Não é necessário instalar ou configurar um banco de dados

```bash
npm start
```

Abra [http://127.0.0.1:3000/](http://127.0.0.1:3000/). O servidor serve a
interface na rota `/`, inicializa `data/database.json` e executa as migrações
pendentes antes de aceitar requisições. Para desenvolvimento, use
`npm run dev`, que reinicia o servidor quando os arquivos mudam.

As variáveis `PORT`, `HOST` e `DATA_DIR` podem ser informadas no ambiente.
`npm run build` gera também o bundle estático do frontend via Vite.

## O que funciona

- Busca por nome, seleção de categorias e ordenação por relevância, preço ou
  avaliação.
- Catálogo inicial com produtos, preços, parcelamento, avaliações, estoque e
  imagens demonstrativas.
- Favoritos na interface, filtro de localização/condição e feedbacks de
  localização, ajuda e cadastro.
- Carrinho persistido com inclusão, remoção, alteração de quantidade e
  subtotal.
- Checkout demonstrativo: cria um pedido, baixa o estoque e limpa o carrinho.
- Modal de acesso e endpoint de autenticação com hash de senha.
- Layout responsivo para desktop e telas menores.

## Dados demonstrativos e acesso administrativo

O catálogo público é criado idempotentemente no primeiro bootstrap de um banco
limpo. O acesso administrativo e a massa associada à autenticação são
**opt-in** e só são habilitados com `DASHBOARDIA_DEMO_MODE=true`:

```bash
DASHBOARDIA_DEMO_MODE=true \
DASHBOARDIA_DEMO_USERNAME=admin \
DASHBOARDIA_DEMO_EMAIL=admin@example.com \
DASHBOARDIA_DEMO_PASSWORD='use-a-local-password' \
npm start
```

O bootstrap lê as três credenciais acima, cria ou atualiza a conta admin com
senha derivada por `scrypt` e grava `.dashboardia/demo-access.json` com
`"version": 1`. O arquivo e a senha não devem ser versionados; ambos ficam em
diretórios ignorados pelo git. O bootstrap é idempotente e seguro para
reinicializações.

## API principal

- `GET /api/health` — status do processo e versão do schema.
- `GET /api/catalog?q=&category=&sort=` — categorias e produtos disponíveis.
- `GET /api/cart` — carrinho atual com itens, quantidade e subtotal.
- `POST /api/cart` — adiciona `{ "productId": "...", "quantity": 1 }`.
- `PATCH /api/cart/:id` — altera a quantidade de um item.
- `DELETE /api/cart/:id` — remove um item.
- `POST /api/orders` — cria o pedido demonstrativo e atualiza estoque.
- `POST /api/auth/login` — autentica `{ "login": "...", "password": "..." }`.

## Persistência

`src/persistence/migrations/001-initial.js` mantém as coleções legadas e
`002-marketplace.js` adiciona categorias, produtos, carrinho e pedidos sem
apagar dados existentes. `src/persistence/database.js` grava primeiro em um
arquivo temporário e renomeia atomicamente. Inserções e atualizações passam
por auditoria centralizada, garantindo `createdAt` e `updatedAt`; seeds também
usam esse caminho e respeitam unicidade de usuário/e-mail e estoque.