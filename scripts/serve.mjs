import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.cwd());
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.sql': 'text/plain; charset=utf-8' };
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/') pathname = '/index.html';
    if (pathname !== '/index.html' && !pathname.startsWith('/src/')) { response.writeHead(404).end('Not found'); return; }
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    response.end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log(`FORMA: http://127.0.0.1:${server.address().port}`));
