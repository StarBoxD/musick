/**
 * VYBE - Zorunlu 200 Satır Mimari Kuralı Denetleyicisi
 *
 * Projedeki tüm kaynak kod dosyalarını (.ts, .tsx, .js, .jsx, .css, .module.css) tarar.
 * Her dosyanın satır sayısını hesaplar.
 * 200 satırı aşan tek bir dosya bile varsa listeler ve çıkış kodu 1 ile hata verir.
 */

import fs from "fs";
import path from "path";

export const MAX_LINES = 200;

const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
]);

const IGNORED_FILES = new Set([
  "next-env.d.ts",
]);

export interface FileLineReport {
  relativePath: string;
  lines: number;
  exceeded: boolean;
}

export function scanProjectLineCounts(rootDir: string = process.cwd()): {
  allFiles: FileLineReport[];
  violations: FileLineReport[];
  maxLines: number;
} {
  const allFiles: FileLineReport[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
        continue;
      }

      if (!entry.isFile()) continue;
      if (IGNORED_FILES.has(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!TARGET_EXTENSIONS.has(ext)) continue;

      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      const raw = fs.readFileSync(fullPath, "utf-8");
      const lineCount = raw.length === 0 ? 0 : raw.split(/\r?\n/).length;

      allFiles.push({
        relativePath: relPath,
        lines: lineCount,
        exceeded: lineCount > MAX_LINES,
      });
    }
  }

  walk(rootDir);
  allFiles.sort((a, b) => b.lines - a.lines || a.relativePath.localeCompare(b.relativePath));

  const violations = allFiles.filter((f) => f.exceeded);
  return {
    allFiles,
    violations,
    maxLines: MAX_LINES,
  };
}

function main() {
  const { allFiles, violations, maxLines } = scanProjectLineCounts();

  console.log("\n=======================================================");
  console.log(`   VYBE ZORUNLU ${maxLines} SATIR MİMARİ KONTROLÜ`);
  console.log("=======================================================\n");

  for (const file of allFiles) {
    const badge = file.exceeded ? "[✗ AŞTI]" : "[✓ UYGUN]";
    console.log(`${badge} ${String(file.lines).padStart(4, " ")} satır | ${file.relativePath}`);
  }

  console.log("\n-------------------------------------------------------");
  console.log(`Taranan Kaynak Dosya Sayısı : ${allFiles.length}`);
  console.log(`En Fazla İzin Verilen Satır : ${maxLines}`);
  console.log(`Sınırı Aşan Dosya Sayısı    : ${violations.length}`);

  if (violations.length > 0) {
    console.error("\n[HATA] 200 satır sınırını aşan dosyalar tespit edildi:");
    for (const v of violations) {
      console.error(`  - ${v.relativePath} (${v.lines} satır > ${maxLines})`);
    }
    console.log("=======================================================\n");
    process.exit(1);
  }

  console.log("SONUÇ: TÜM KAYNAK DOSYALAR <= 200 SATIR KURALINA UYGUN ✓");
  console.log("=======================================================\n");
}

if (require.main === module) {
  main();
}
