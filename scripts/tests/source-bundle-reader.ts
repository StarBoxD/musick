import fs from "fs";
import path from "path";

function readDirFiles(relDir: string): string {
  const absDir = path.resolve(process.cwd(), relDir);
  if (!fs.existsSync(absDir)) return "";
  return fs
    .readdirSync(absDir)
    .sort()
    .map((file) => {
      const fullPath = path.join(absDir, file);
      return fs.statSync(fullPath).isFile() ? fs.readFileSync(fullPath, "utf-8") : "";
    })
    .join("\n");
}

export function readMiniPlayerSources(): string {
  const main = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/mini-player.tsx"),
    "utf-8"
  );
  return `${main}\n${readDirFiles("components/music/player")}`;
}

export function readDashboardSources(): string {
  const main = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/music-dashboard.tsx"),
    "utf-8"
  );
  return `${main}\n${readDirFiles("components/music/dashboard")}`;
}

export function readDiscoverSources(): string {
  const main = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/discover-panel.tsx"),
    "utf-8"
  );
  return `${main}\n${readDirFiles("components/music/discover")}`;
}

export function readAllStyles(): string {
  const globalsPath = path.resolve(process.cwd(), "app/globals.css");
  const globals = fs.readFileSync(globalsPath, "utf-8");
  const importedCssParts: string[] = [];
  const nonImportLines: string[] = [];

  for (const line of globals.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@import")) {
      const match = trimmed.match(/@import\s+["']([^"']+)["'];?/);
      if (match && match[1]) {
        const importPath = path.resolve(path.dirname(globalsPath), match[1]);
        if (fs.existsSync(importPath)) {
          importedCssParts.push(fs.readFileSync(importPath, "utf-8"));
        }
      }
    } else {
      nonImportLines.push(line);
    }
  }

  // Base reset and variables first, then imports in exact order
  return `${nonImportLines.join("\n")}\n${importedCssParts.join("\n")}`;
}
