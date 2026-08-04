import { createServer } from "node:http";
import { access, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const clientRoot = join(root, "dist", "client");
const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url));
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
};

async function assetFetch(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const safePath = normalize(pathname).replace(/^([/\\])+/, "");
  const filePath = join(clientRoot, safePath);
  if (!filePath.startsWith(clientRoot)) return new Response("Forbidden", { status: 403 });
  try {
    await access(filePath);
    return new Response(await readFile(filePath), {
      headers: { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const env = {
  ASSETS: { fetch: assetFetch },
  IMAGES: { input() { throw new Error("Local image optimization is disabled"); } },
};
const context = { waitUntil() {}, passThroughOnException() {} };

createServer(async (request, response) => {
  try {
    const url = `http://${request.headers.host || `${host}:${port}`}${request.url || "/"}`;
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const webRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
      duplex: body ? "half" : undefined,
    });
    const pathname = new URL(url).pathname;
    const staticAsset =
      pathname.startsWith("/assets/") ||
      [".css", ".js", ".json", ".svg", ".png", ".jpg", ".jpeg", ".woff2"].includes(extname(pathname));
    const result = staticAsset
      ? await assetFetch(webRequest)
      : await worker.fetch(webRequest, env, context);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(response);
    else response.end();
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.stack : String(error));
  }
}).listen(port, host, () => {
  console.log(`EvidenceAlpha frontend: http://localhost:${port}`);
});
