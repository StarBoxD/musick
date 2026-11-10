/**
 * VYBE P1 Comprehensive Regression and Security Test Suite
 */

import {
  runP1RegressionChecks,
  type TestReport,
} from "./tests/p1-regression-checks";

export type { TestReport };

export function runP1Tests(): { total: number; passed: number; reports: TestReport[] } {
  const reports = runP1RegressionChecks();
  return {
    total: reports.length,
    passed: reports.filter((r) => r.passed).length,
    reports,
  };
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("test-p1-regressions"))
) {
  const summary = runP1Tests();
  console.log("=======================================================");
  console.log("   VYBE P1 REGRESYON VE GÜVENLİK TEST RAPORU");
  console.log("=======================================================");
  summary.reports.forEach((r, idx) => {
    console.log(
      `[TEST ${idx + 1}] ${r.passed ? "✓ GEÇTİ" : "✗ KALDI"} - ${r.category}: ${r.name}`
    );
    console.log(`         Detay: ${r.details}`);
  });
  console.log("-------------------------------------------------------");
  console.log(
    `Toplam: ${summary.total} | Başarılı: ${summary.passed} | Başarısız: ${summary.total - summary.passed}`
  );
  console.log("=======================================================");

  if (summary.passed !== summary.total) {
    process.exit(1);
  }
}
