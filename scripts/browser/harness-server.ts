import http from "http";
import fs from "fs";
import path from "path";

export async function startHarnessServer(bundledCss: string): Promise<{
  server: http.Server;
  fileUrl: string;
}> {
  const harnessPath = path.resolve(process.cwd(), "scripts/harness.html");
  const server = http.createServer((req, res) => {
    const reqUrl = req.url || "/";
    if (reqUrl.includes("globals.css") || reqUrl.endsWith(".css")) {
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      res.end(bundledCss);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const html = fs
      .readFileSync(harnessPath, "utf-8")
      .replace("../app/globals.css", "/app/globals.css");
    res.end(html);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const httpPort = (server.address() as { port: number }).port;
  return {
    server,
    fileUrl: `http://127.0.0.1:${httpPort}/dashboard`,
  };
}
