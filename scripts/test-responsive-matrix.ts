/**
 * VYBE - 10 Viewport Sizes & Responsive Matrix Verification Suite
 */

import {
  VIEWPORT_MATRIX,
  type ResponsiveCheckResult,
  type ViewportProfile,
} from "./tests/viewport-matrix-data";
import { evaluateResponsiveMatrixChecks } from "./tests/responsive-check-evaluator";

export { VIEWPORT_MATRIX, type ResponsiveCheckResult, type ViewportProfile };

export function runResponsiveMatrixTests(): {
  total: number;
  passed: number;
  results: ResponsiveCheckResult[];
} {
  const results = evaluateResponsiveMatrixChecks();
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  return { total, passed, results };
}

if (require.main === module) {
  const { total, passed, results } = runResponsiveMatrixTests();
  console.log("\n=======================================================");
  console.log("   VYBE 10 VIEWPORT & RESPONSIVE QA SUITE");
  console.log("=======================================================\n");
  results.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.passed ? "✓ GEÇTİ" : "✗ KALDI"}] ${r.name}`);
  });
  console.log(`\nToplam: ${total} | Başarılı: ${passed}`);
  if (total !== passed) process.exit(1);
}
