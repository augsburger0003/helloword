# Helloword

Um projeto PHP pequeno, funcional e sem dependências externas para servir uma
primeira página de **Hello World**. A aplicação possui um front controller,
roteamento, páginas internas, formulário com validação no servidor, endpoint
JSON, configuração separada e uma interface responsiva.

## Requisitos

- PHP 8.1 ou superior
- Composer (opcional; habilita o autoload PSR-4 e o script `serve`)

## Inicialização

A aplicação usa o servidor embutido do PHP e não exige banco de dados ou
instalação de dependências para funcionar:

```bash
php -S 127.0.0.1:8000 -t public
```

Depois, abra <http://127.0.0.1:8000/>.

Com Composer, o mesmo fluxo pode ser iniciado por:

```bash
composer serve
```

O Composer não é obrigatório: o front controller possui um fallback para o
autoload manual da classe de aplicação, permitindo iniciar o projeto em um
ambiente limpo sem instalar dependências.

## Estrutura

```text
composer.json         Manifest, autoload PSR-4 e script de desenvolvimento
config/app.php       Configuração da aplicação
public/index.php     Ponto de entrada HTTP
public/assets/       Folha de estilos da interface
src/Application.php  Rotas, validações e dados dinâmicos da aplicação
templates/           Templates PHP das páginas HTML
```

O horário, a versão do PHP e o ambiente exibidos na página são produzidos no
servidor por `Application`, confirmando que a tela é renderizada pela
aplicação PHP e não é apenas um arquivo estático.

Os templates são separados por responsabilidade: `home.php` apresenta a
entrada, `about.php` documenta a base dentro da própria aplicação,
`contact.php` trata a interação do formulário e `not-found.php` cobre rotas
inválidas.

## Rotas

- `GET /` — página inicial Helloword
- `GET /sobre` — visão geral da arquitetura e do ambiente de execução
- `GET /contato` — formulário de contato
- `POST /contato` — valida nome, e-mail e mensagem no servidor e exibe o resultado
- `GET /api/status` — status da aplicação em JSON, útil para integrações e health checks
- qualquer outro caminho — página 404

O formulário de contato é uma demonstração sem persistência: os dados não são
gravados em banco ou em arquivos. Isso mantém o projeto executável sem
configuração adicional e deixa explícito o ponto onde uma integração real pode
ser adicionada.

Exemplo de resposta da API:

```json
{
  "name": "Helloword",
  "status": "ok",
  "environment": "development",
  "php": "8.1.0",
  "serverTime": "2024-01-01T12:00:00+00:00",
  "routes": ["/", "/sobre", "/contato", "/api/status"]
}
```