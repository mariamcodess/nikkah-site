import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4174);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

async function handleApi(request, response) {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const file = join(root, `${pathname}.js`);

  if (!existsSync(file)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const mod = await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
  await mod.default(request, response);
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const file = join(root, normalized);

  if (!file.startsWith(root) || !existsSync(file)) {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  response.setHeader("Content-Type", mimeTypes[extname(file)] || "application/octet-stream");
  createReadStream(file).pipe(response);
}

createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname.startsWith("/api/")) {
    handleApi(request, response).catch((error) => {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error: error.message }));
    });
    return;
  }

  serveStatic(request, response);
}).listen(port, () => {
  console.log(`Nikkah site preview: http://localhost:${port}`);
});
