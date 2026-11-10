/**
 * VYBE - Real Headless Browser DOM, React Component & Responsive Testing Suite
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { readAllStyles } from "./tests/source-bundle-reader";
import {
  DomMeasurementResult,
  VIEWPORT_WIDTHS,
  getBrowserExecutable,
} from "./browser/browser-types";
import { CdpClient, waitForDebuggerUrl } from "./browser/cdp-client";
import { buildReactMountBundle } from "./browser/esbuild-bundler";
import { buildDomEvalScript } from "./browser/dom-eval-menu";
import { startHarnessServer } from "./browser/harness-server";
import {
  captureFullDashboardScreenshots,
  isMeasurementPassing,
} from "./browser/dashboard-screenshots";

export type { DomMeasurementResult };

export async function runRealBrowserAudit(): Promise<{
  success: boolean;
  measurements: DomMeasurementResult[];
  browserName: string;
  error?: string;
}> {
  const browserPath = getBrowserExecutable();
  if (!browserPath) {
    return {
      success: false,
      measurements: [],
      browserName: "None",
      error: "Sistemde Google Chrome veya Microsoft Edge bulunamadı.",
    };
  }

  const reactBundleCode = await buildReactMountBundle();
  const bundledCss = readAllStyles();
  const browserName = browserPath.includes("chrome")
    ? "Google Chrome (Headless)"
    : "Microsoft Edge (Headless)";
  const port = 9333;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vybe-browser-test-"));
  const artifactRoot =
    "C:\\Users\\efedo\\.gemini\\antigravity\\brain\\84a8fea8-9ffb-452f-981e-803b5e12bcb8";
  const screenshotDir = path.join(artifactRoot, "screenshots");

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const { server, fileUrl } = await startHarnessServer(bundledCss);

  const chromeProc: ChildProcess = spawn(browserPath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    fileUrl,
  ]);

  const wsUrl = await waitForDebuggerUrl(port);
  if (!wsUrl) {
    chromeProc.kill("SIGKILL");
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    return {
      success: false,
      measurements: [],
      browserName,
      error: "Tarayıcı CDP portu açılamadı.",
    };
  }

  const cdp = new CdpClient();
  const measurements: DomMeasurementResult[] = [];

  try {
    await cdp.connect(wsUrl);
    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: fileUrl });
    await new Promise((r) => setTimeout(r, 600));

    await cdp.send("Runtime.evaluate", {
      expression: reactBundleCode,
      awaitPromise: false,
    });
    await new Promise((r) => setTimeout(r, 250));

    const evalScript = buildDomEvalScript();

    for (const width of VIEWPORT_WIDTHS) {
      const isMobile = width <= 768;
      const height = isMobile ? 780 : 920;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile,
      });

      await cdp.send("Runtime.evaluate", {
        expression:
          "if (window.__VYBE_TEST_STATE__?.resetSongs) { window.__VYBE_TEST_STATE__.resetSongs(); }",
      });
      await new Promise((r) => setTimeout(r, 80));

      const screenshotData = await cdp.send("Page.captureScreenshot", { format: "png" });
      const fullScreenshotPath = path.join(screenshotDir, `viewport_${width}.png`);
      const pngBuffer = Buffer.from(screenshotData.data, "base64");
      fs.writeFileSync(fullScreenshotPath, pngBuffer);
      if (width === 390) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_phone_390.png"), pngBuffer);
      } else if (width === 820) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_tablet_820.png"), pngBuffer);
      } else if (width === 1440) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_desktop_1440.png"), pngBuffer);
      }

      const evalResponse = await cdp.send("Runtime.evaluate", {
        expression: evalScript,
        returnByValue: true,
        awaitPromise: true,
      });

      measurements.push({
        ...evalResponse.result.value,
        screenshotSaved: true,
        screenshotPath: fullScreenshotPath,
      });
    }

    await captureFullDashboardScreenshots(cdp, artifactRoot);

    return {
      success: measurements.every(isMeasurementPassing),
      measurements,
      browserName,
    };
  } finally {
    cdp.close();
    chromeProc.kill();
    server.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("test-real-browser"))
) {
  runRealBrowserAudit().then((res) => {
    console.log(`\n=== VYBE GERÇEK TARAYICI AUDIT (${res.browserName}) ===\n`);
    if (!res.success && res.error) {
      console.error(`Tarayıcı çalıştırılamadı: ${res.error}`);
      process.exit(1);
    }
    res.measurements.forEach((m) => {
      const allPass = isMeasurementPassing(m);
      console.log(`[${allPass ? "✓" : "✗"}] ${m.width}x${m.height}px | Taşma: ${m.noPageHorizontalOverflow ? "Yok" : "Var"} | Kapak: ${m.coverWidth}x${m.coverHeight}`);
    });
    console.log(`\nGenel Durum: ${res.success ? "BAŞARILI ✓" : "BAŞARISIZ ✗"}`);
    if (!res.success) process.exit(1);
  });
}
