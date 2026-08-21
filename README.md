# Helloword

Um projeto PHP pequeno, funcional e sem dependências externas para servir uma
primeira página de **Hello World**. A aplicação possui um front controller,
roteamento mínimo, configuração separada e uma interface responsiva em
`/`.

## Requisitos

- PHP 8.1 ou superior
- Composer (opcional; útil apenas para os scripts e o autoload do projeto)

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

## Estrutura

```text
config/app.php       Configuração da aplicação
public/index.php     Ponto de entrada HTTP
public/assets/       Folha de estilos da interface
src/Application.php  Roteamento e dados dinâmicos da aplicação
templates/           Templates PHP da página inicial e 404
```

O horário, a versão do PHP e o ambiente exibidos na página são produzidos no
servidor por `Application`, confirmando que a tela é renderizada pela
aplicação PHP e não é apenas um arquivo estático.

## Rotas

- `GET /` — página inicial Helloword
- qualquer outro caminho — página 404