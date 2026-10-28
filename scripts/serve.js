const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", process.argv[2] || ".");
const port = Number(process.argv[3]) || 4173;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webmanifest": "application/manifest+json", ".png": "image/png", ".gif": "image/gif", ".ttf": "font/ttf", ".svg": "image/svg+xml" };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = path.resolve(root, `.${pathname.endsWith("/") ? pathname + "index.html" : pathname}`);
    if (!file.startsWith(root + path.sep) || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(403); response.end(); return;
    }
    const content = await fs.promises.readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}`));
