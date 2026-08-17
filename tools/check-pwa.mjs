import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  'index.html', 'manifest.webmanifest', 'service-worker.js', 'pwa.js',
  'social-preview.png',
  'icons/icon-48.png', 'icons/icon-72.png', 'icons/icon-96.png',
  'icons/icon-128.png', 'icons/icon-144.png', 'icons/icon-152.png',
  'icons/icon-192.png', 'icons/icon-384.png', 'icons/icon-512.png', 'icons/pressao.ico'
];

await Promise.all(required.map((file) => access(join(root, file))));

const manifest = JSON.parse(await readFile(join(root, 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('Manifesto sem modo standalone.');
if (!manifest.icons.some((icon) => icon.sizes === '192x192')) throw new Error('Ícone 192 ausente.');
if (!manifest.icons.some((icon) => icon.sizes === '512x512')) throw new Error('Ícone 512 ausente.');

const html = await readFile(join(root, 'index.html'), 'utf8');
for (const text of [
  'manifest.webmanifest', 'pwa.js', 'Editar medição',
  'Salvar alterações', 'falecomodaniek@gmail.com', 'Instalar aplicativo',
  'Escolher foto', 'Detalhes da medição', 'Acompanhe sua saúde com tranquilidade',
  'Leitura automática dos registros', 'Registros detalhados',
  'Diretriz Brasileira de Hipertensão Arterial 2025',
  'social-preview.png'
]) {
  if (!html.includes(text)) throw new Error(`Recurso ausente no app: ${text}`);
}

if (html.includes('value="{{ detalhesAbertos }}"')) {
  throw new Error('Os detalhes da nova medição devem permanecer sempre visíveis.');
}

const pwaScript = await readFile(join(root, 'pwa.js'), 'utf8');
if (!pwaScript.includes("register('./service-worker.js')")) {
  throw new Error('Registro do service worker ausente.');
}

const emailCount = html.split('falecomodaniek@gmail.com').length - 1;
if (emailCount !== 2) {
  throw new Error(`O e-mail deve aparecer uma vez no template (duas ocorrências no JSON escapado); encontrado: ${emailCount}`);
}

const match = html.match(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/);
if (!match) throw new Error('Template empacotado ausente.');
const template = JSON.parse(match[1]);
const component = template.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
if (!component) throw new Error('Lógica do aplicativo ausente.');
new vm.Script(component[1]);

new vm.Script(await readFile(join(root, 'pwa.js'), 'utf8'));
new vm.Script(await readFile(join(root, 'service-worker.js'), 'utf8'));

console.log('Verificação estrutural concluída.');
