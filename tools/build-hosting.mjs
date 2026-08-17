import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const client = join(dist, 'client');
const server = join(dist, 'server');

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });

for (const file of ['index.html', 'manifest.webmanifest', 'pwa.js', 'service-worker.js', 'social-preview.png']) {
  await cp(join(root, file), join(client, file));
}
await cp(join(root, 'icons'), join(client, 'icons'), { recursive: true });
await cp(join(root, 'assets'), join(client, 'assets'), { recursive: true });

const worker = await readFile(join(root, 'worker', 'index.js'), 'utf8');
await writeFile(join(server, 'index.js'), worker, 'utf8');

console.log('Pacote de hospedagem preparado.');
