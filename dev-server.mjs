// Local preview server for the v0 sandbox only. GitHub Pages serves
// index.html, style.css and script.js directly and ignores this file.
// Only the public site files are served so env files and node_modules stay private.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_FILES = new Set(["/index.html", "/style.css", "/script.js"]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  let pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/") pathname = "/index.html";

  if (!PUBLIC_FILES.has(pathname)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  try {
    const body = await readFile(join(ROOT, pathname));
    res.writeHead(200, {
      "Content-Type": TYPES[extname(pathname)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Could not read file");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Civic OS preview running at http://localhost:${PORT}`);
});
