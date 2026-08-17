import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const client = join(root, 'dist', 'client');
const server = join(root, 'dist', 'server', 'index.js');

await access(server);
const workerUrl = pathToFileURL(server);
workerUrl.searchParams.set('test', String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png'
};

const env = {
  ASSETS: {
    async fetch(request) {
      try {
        const url = new URL(request.url);
        const path = url.pathname.replace(/^\/+/, '');
        const data = await readFile(join(client, path));
        return new Response(data, { status: 200, headers: { 'content-type': types[extname(path)] || 'application/octet-stream' } });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    }
  }
};

const home = await worker.fetch(new Request('https://pressao.example/', { headers: { accept: 'text/html' } }), env);
assert.equal(home.status, 200);
assert.match(home.headers.get('content-type') || '', /^text\/html/);
assert.match(await home.text(), /Pressão — acompanhamento arterial/);

const manifest = await worker.fetch(new Request('https://pressao.example/manifest.webmanifest'), env);
assert.equal(manifest.status, 200);
assert.equal((await manifest.json()).display, 'standalone');

const fallback = await worker.fetch(new Request('https://pressao.example/qualquer-rota', { headers: { accept: 'text/html' } }), env);
assert.equal(fallback.status, 200);

console.log('Pacote de hospedagem validado.');

