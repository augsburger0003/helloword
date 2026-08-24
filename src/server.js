'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');
const store = require('./persistence/store');

const host = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const publicDirectory = path.join(process.cwd(), 'public');

store.ensureDatabase();

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: 'Recurso não encontrado.' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': content.length
    });
    response.end(content);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload muito grande.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok', service: 'helloword' });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/items') {
    sendJson(response, 200, { items: store.listItems() });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/items') {
    try {
      const body = JSON.parse(await readRequestBody(request));
      const name = typeof body.name === 'string' ? body.name.trim() : '';

      if (!name) {
        sendJson(response, 400, { error: 'O campo name é obrigatório.' });
        return;
      }

      sendJson(response, 201, { item: store.addItem(name) });
    } catch (error) {
      sendJson(response, 400, { error: 'Envie um JSON válido.' });
    }
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/') {
    sendFile(response, path.join(publicDirectory, 'index.html'));
    return;
  }

  sendJson(response, 404, { error: 'Rota não encontrada.' });
});

server.listen(port, host, () => {
  console.log(`helloword disponível em http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error('Não foi possível iniciar o servidor:', error);
  process.exitCode = 1;
});