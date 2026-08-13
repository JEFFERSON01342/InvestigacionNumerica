// Servidor local para ejecutar GeoMath con un origen HTTP.
// Desmos no puede inicializarse correctamente si se abre el HTML con file://.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8080;
const types = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, requested);
  if(path.relative(root, file).startsWith('..')){
    response.writeHead(403); response.end('Acceso denegado'); return;
  }
  fs.stat(file, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (readError, data) => {
      if(readError){ response.writeHead(404); response.end('Archivo no encontrado'); return; }
      response.writeHead(200, { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream' });
      response.end(data);
    });
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`GeoMath disponible en http://localhost:${port}/`);
  console.log('Abre: http://localhost:8080/pages/programacion-lineal/');
});
