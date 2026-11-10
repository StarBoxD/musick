/**
 * VYBE - Comprehensive Full System QA & Verification Suite
 */

import * as fs from "fs";
import * as path from "path";
import { runCoreSystemChecks, type TestRecord } from "./tests/core-system-checks";
import { scanProjectLineCounts, MAX_LINES } from "./check-file-lines";

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch {
  // pass
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("   VYBE FULL QA & SYSTEM VERIFICATION SUITE");
  console.log("=======================================================\n");

  const records: TestRecord[] = await runCoreSystemChecks();
  const check = (category: string, name: string, condition: boolean, message: string) => {
    records.push({ category, name, passed: condition, message });
  };

  // BÖLÜM 6: 5 Kullanıcı Senaryosu RLS Matrisi
  const { runRlsMatrixTests } = await import("./test-rls-matrix");
  const matrixResult = runRlsMatrixTests();
  matrixResult.results.forEach((r) => {
    check("6. RLS Kullanıcı Senaryoları", r.scenario, r.passed, r.message);
  });

  // BÖLÜM 7: P1 Güvenlik, Player, Kuyruk ve PWA Regresyonları
  const { runP1Tests } = await import("./test-p1-regressions");
  const p1Result = runP1Tests();
  p1Result.reports.forEach((r) => {
    check(r.category, r.name, r.passed, r.details);
  });

  // BÖLÜM 8: 10 Viewport Boyutu & Kod Sözleşme Matrisi
  const { runResponsiveMatrixTests } = await import("./test-responsive-matrix");
  const respResult = runResponsiveMatrixTests();
  respResult.results.forEach((r) => {
    check(r.category, r.name, r.passed, r.details);
  });

  // BÖLÜM 9: Gerçek Tarayıcı (Headless Chrome/Edge) DOM Denetimi
  const { runRealBrowserAudit } = await import("./test-real-browser");
  const browserResult = await runRealBrowserAudit();
  if (browserResult.success) {
    check(
      "9. Gerçek Tarayıcı DOM Denetimi",
      `10 Viewport Gerçek DOM Geometrisi ve Taşma Kontrolü (${browserResult.browserName})`,
      true,
      "scrollWidth <= clientWidth, taşma yok, mini-player çakışması yok, dokunma alanları >= 36px, 10 gerçek PNG ekran görüntüsü alındı"
    );
  } else {
    check(
      "9. Gerçek Tarayıcı DOM Denetimi",
      "Gerçek Tarayıcı DOM Denetimi",
      false,
      browserResult.error || "Bazı genişliklerde DOM ölçümleri başarısız"
    );
  }

  // BÖLÜM 10: Zorunlu <= 200 Satır Mimari Kuralı Denetimi
  const lineCheck = scanProjectLineCounts();
  check(
    "10. Zorunlu 200 Satır Mimari Kuralı",
    `Projedeki tüm kaynak dosyalar (${lineCheck.allFiles.length} dosya) <= ${MAX_LINES} satır sınırına uyuyor`,
    lineCheck.violations.length === 0,
    lineCheck.violations.length === 0
      ? `Taranan ${lineCheck.allFiles.length} dosyanın tamamı <= ${MAX_LINES} satır (0 ihlal)`
      : `Sınırı aşan dosyalar: ${lineCheck.violations.map((v) => `${v.relativePath} (${v.lines})`).join(", ")}`
  );

  // SONUÇLARI YAZDIR
  let allOk = true;
  const categories = [...new Set(records.map((r) => r.category))];

  categories.forEach((cat) => {
    console.log(`\n--- [ ${cat} ] ---`);
    const catRecords = records.filter((r) => r.category === cat);
    catRecords.forEach((r, idx) => {
      const status = r.passed ? "✓ GEÇTİ" : "✗ KALDI";
      if (!r.passed) allOk = false;
      console.log(`  ${idx + 1}. [${status}] ${r.name}`);
      console.log(`     Detay: ${r.message}`);
    });
  });

  console.log("\n-------------------------------------------------------");
  console.log(
    `Toplam Kontrol: ${records.length} | Başarılı: ${records.filter((r) => r.passed).length} | Başarısız: ${records.filter((r) => !r.passed).length}`
  );
  console.log(
    `GENEL DURUM: ${allOk ? "TÜM SİSTEM TESTLERİ BAŞARIYLA TAMAMLANDI ✓" : "BAŞARISIZ KONTROLLER VAR ✗"}`
  );
  console.log("=======================================================\n");

  if (!allOk) process.exit(1);
}

runAllTests();
