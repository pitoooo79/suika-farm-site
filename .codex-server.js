const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  });
}).listen(5500, "127.0.0.1");
