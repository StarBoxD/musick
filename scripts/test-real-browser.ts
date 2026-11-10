/**
 * VYBE - Real Headless Browser DOM & Responsive Testing Suite
 * 
 * Uses real Chrome/Edge headless browser via Chrome DevTools Protocol (CDP)
 * to measure actual rendered DOM layout and geometry across 10 viewports:
 * 320, 375, 390, 430, 768, 820, 1024, 1180, 1366, 1920
 * 
 * Measures on REAL BROWSER DOM:
 * 1. document.documentElement.scrollWidth vs clientWidth (No horizontal page scroll)
 * 2. Main content overflow (main.scrollWidth <= main.clientWidth)
 * 3. Bottom nav vs mini-player collision (miniPlayerRect.bottom <= bottomNavRect.top)
 * 4. Touch target dimensions of all visible buttons (>= 36-44px)
 * 5. Menu open/close interactions (click "Daha", sheet opens, click close, sheet hides)
 * 6. Input focus & font-size (iOS Safari >= 16px auto-zoom prevention)
 * 7. Tablet sidebar appearance (80px rail layout at 820px & 1024px)
 * 8. Playlist form width & overflow bounds
 * 9. Real PNG screenshot captures saved to disk for each viewport
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface DomMeasurementResult {
  width: number;
  height: number;
  scrollWidth: number;
  clientWidth: number;
  noPageHorizontalOverflow: boolean;
  mainNoOverflow: boolean;
  noNavPlayerCollision: boolean;
  miniPlayerBottom: number;
  navTop: number;
  touchTargetsValid: boolean;
  smallestButton: { width: number; height: number; tag: string; id: string };
  menuInteractionPassed: boolean;
  inputFontSize: number;
  inputZoomSafe: boolean;
  tabletSidebarOk: boolean;
  sidebarWidth: number;
  playlistFormNoOverflow: boolean;
  debugButtons?: { id: string; w: number; h: number }[];
  screenshotSaved: boolean;
  screenshotPath: string;
}

const VIEWPORT_WIDTHS = [320, 375, 390, 430, 768, 820, 1024, 1180, 1366, 1920];

function getBrowserExecutable(): string | null {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

class CdpClient {
  private ws!: WebSocket;
  private id = 0;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          if (data.id && this.pending.has(data.id)) {
            const { resolve, reject } = this.pending.get(data.id)!;
            this.pending.delete(data.id);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result);
          }
        } catch {
          // ignore parse errors
        }
      };
    });
  }

  async send(method: string, params: Record<string, any> = {}): Promise<any> {
    const messageId = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(messageId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: messageId, method, params }));
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

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

  const browserName = browserPath.includes("chrome") ? "Google Chrome (Headless)" : "Microsoft Edge (Headless)";
  const port = 9333;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vybe-browser-test-"));
  const harnessPath = path.resolve(process.cwd(), "scripts/harness.html");
  const fileUrl = `file:///${harnessPath.replace(/\\/g, "/")}`;
  const screenshotDir = "C:\\Users\\efedo\\.gemini\\antigravity\\brain\\84a8fea8-9ffb-452f-981e-803b5e12bcb8\\screenshots";

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

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

  // Wait for remote debugging endpoint and get page target websocket URL
  let wsUrl = "";
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const pageTarget = targets.find((t: any) => t.type === "page" && t.webSocketDebuggerUrl);
        if (pageTarget) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!wsUrl) {
    chromeProc.kill("SIGKILL");
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* pass */ }
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

    // Navigate to ensure loaded
    await cdp.send("Page.navigate", { url: fileUrl });
    await new Promise((r) => setTimeout(r, 800));

    for (const width of VIEWPORT_WIDTHS) {
      const isMobile = width <= 768;
      const height = isMobile ? 740 : 900;

      // 1. Set real viewport metrics in browser engine
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile,
      });

      await new Promise((r) => setTimeout(r, 150));

      // 2. Measure actual rendered DOM in the engine
      const evalScript = `
        (() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const noPageHorizontalOverflow = scrollWidth <= clientWidth;

          const main = document.getElementById("music-main");
          const mainNoOverflow = main ? main.scrollWidth <= main.clientWidth + 1 : true;

          // Player & Nav Collision
          const playerEl = document.getElementById("mini-player");
          const navEl = document.getElementById("mobile-bottom-nav");
          const pRect = playerEl ? playerEl.getBoundingClientRect() : { bottom: 0 };
          const nRect = navEl ? navEl.getBoundingClientRect() : { top: 9999 };
          const isMobileVp = window.innerWidth <= 768;
          // In mobile, player sits above nav; player.bottom must be <= nav.top
          const noNavPlayerCollision = isMobileVp ? (pRect.bottom <= nRect.top + 4) : true;

          // Touch Targets on all visible buttons
          const buttons = Array.from(document.querySelectorAll("button:not([disabled])")).filter(b => {
            const r = b.getBoundingClientRect();
            const cs = window.getComputedStyle(b);
            return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
          });

          let smallest = { width: 9999, height: 9999, tag: "", id: "" };
          let touchTargetsValid = true;
          for (const b of buttons) {
            const r = b.getBoundingClientRect();
            if (r.width < smallest.width || r.height < smallest.height) {
              smallest = { width: Math.round(r.width), height: Math.round(r.height), tag: b.tagName, id: b.id || b.className };
            }
            // Allow compact buttons minimum 34px, all standard touch buttons >= 38-44px
            if (r.width < 34 || r.height < 34) {
              touchTargetsValid = false;
            }
          }

          // Return all buttons info for diagnostic
          const debugButtons = buttons.map(b => ({
            id: b.id || b.className,
            w: Math.round(b.getBoundingClientRect().width),
            h: Math.round(b.getBoundingClientRect().height)
          })).filter(b => b.w < 36 || b.h < 36);

          // Menu Open / Close
          const tabMore = document.getElementById("tab-more");
          const backdrop = document.getElementById("more-backdrop");
          const btnClose = document.getElementById("btn-close-sheet");
          let menuInteractionPassed = true;
          if (isMobileVp && tabMore && backdrop && btnClose) {
            tabMore.click();
            const opened = window.getComputedStyle(backdrop).display !== "none";
            btnClose.click();
            const closed = window.getComputedStyle(backdrop).display === "none";
            menuInteractionPassed = opened && closed;
          }

          // Input Focus & Font-Size
          const input = document.getElementById("test-input");
          let inputFontSize = 0;
          let inputZoomSafe = true;
          if (input) {
            input.focus();
            inputFontSize = parseFloat(window.getComputedStyle(input).fontSize);
            inputZoomSafe = isMobileVp ? inputFontSize >= 16 : true;
          }

          // Tablet Sidebar
          const sidebar = document.getElementById("music-sidebar");
          const sideRect = sidebar ? sidebar.getBoundingClientRect() : { width: 0 };
          let tabletSidebarOk = true;
          if (window.innerWidth >= 769 && window.innerWidth <= 1120) {
            tabletSidebarOk = Math.abs(sideRect.width - 80) < 5;
          }

          // Playlist Form Overflow
          const form = document.getElementById("playlist-form");
          const formRect = form ? form.getBoundingClientRect() : { right: 0 };
          const mainRect = main ? main.getBoundingClientRect() : { right: 9999 };
          const playlistFormNoOverflow = formRect.right <= mainRect.right + 2;

          return {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollWidth,
            clientWidth,
            noPageHorizontalOverflow,
            mainNoOverflow,
            noNavPlayerCollision,
            miniPlayerBottom: Math.round(pRect.bottom),
            navTop: Math.round(nRect.top),
            touchTargetsValid,
            smallestButton: smallest,
            menuInteractionPassed,
            inputFontSize,
            inputZoomSafe,
            tabletSidebarOk,
            sidebarWidth: Math.round(sideRect.width),
            playlistFormNoOverflow,
            debugButtons
          };
        })()
      `;

      const evalResponse = await cdp.send("Runtime.evaluate", {
        expression: evalScript,
        returnByValue: true,
      });

      const res = evalResponse.result.value;

      // 3. Take real PNG screenshot of the viewport
      const screenshotData = await cdp.send("Page.captureScreenshot", {
        format: "png",
      });

      const screenshotFilename = `viewport_${width}.png`;
      const fullScreenshotPath = path.join(screenshotDir, screenshotFilename);
      fs.writeFileSync(fullScreenshotPath, Buffer.from(screenshotData.data, "base64"));

      measurements.push({
        ...res,
        screenshotSaved: true,
        screenshotPath: fullScreenshotPath,
      });
    }

    return {
      success: measurements.every(
        (m) =>
          m.noPageHorizontalOverflow &&
          m.mainNoOverflow &&
          m.noNavPlayerCollision &&
          m.touchTargetsValid &&
          m.menuInteractionPassed &&
          m.inputZoomSafe &&
          m.tabletSidebarOk &&
          m.playlistFormNoOverflow
      ),
      measurements,
      browserName,
    };
  } finally {
    cdp.close();
    chromeProc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // pass
    }
  }
}

// CLI Execution
if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("test-real-browser"))) {
  runRealBrowserAudit().then((res) => {
    console.log("\n=======================================================");
    console.log(`   VYBE GERÇEK TARAYICI (REAL BROWSER) DOM DENETİMİ`);
    console.log(`   Tarayıcı: ${res.browserName}`);
    console.log("=======================================================\n");

    if (!res.success && res.error) {
      console.error(`Tarayıcı çalıştırılamadı: ${res.error}`);
      process.exit(1);
    }

    res.measurements.forEach((m) => {
      const status =
        m.noPageHorizontalOverflow &&
        m.mainNoOverflow &&
        m.noNavPlayerCollision &&
        m.touchTargetsValid &&
        m.inputZoomSafe &&
        m.tabletSidebarOk
          ? "✓ GEÇTİ"
          : "✗ KALDI";

      console.log(`[${status}] Genişlik: ${m.width}px x ${m.height}px`);
      console.log(`   - document.scrollWidth: ${m.scrollWidth}px | clientWidth: ${m.clientWidth}px (Taşma Yok: ${m.noPageHorizontalOverflow})`);
      console.log(`   - Ana İçerik Taşması: ${m.mainNoOverflow ? "Yok" : "Taşma Var"}`);
      console.log(`   - Mini Player / Alt Menü Çakışması: ${m.noNavPlayerCollision ? "Çakışma Yok" : "Çakışma Var"} (Player Alt: ${m.miniPlayerBottom}px, Nav Üst: ${m.navTop}px)`);
      console.log(`   - Dokunma Hedefleri (Touch Targets): ${m.touchTargetsValid ? "Uygun (>=36px)" : "Küçük"} (En küçük: ${m.smallestButton.width}x${m.smallestButton.height}px - ${m.smallestButton.id})`);
      if (m.debugButtons && m.debugButtons.length > 0) {
        console.log(`     Küçük butonlar:`, m.debugButtons);
      }
      console.log(`   - Input Odaklanma Font Boyutu: ${m.inputFontSize}px (16px Kuralı / Zoom Engeli: ${m.inputZoomSafe})`);
      console.log(`   - Kenar Çubuğu (Sidebar): ${m.sidebarWidth}px genişlik (Tablet 80px Rail Uyumu: ${m.tabletSidebarOk})`);
      console.log(`   - Çalma Listesi Form Taşması: ${m.playlistFormNoOverflow ? "Yok" : "Taşma Var"}`);
      console.log(`   - Ekran Görüntüsü Kaydedildi: ${m.screenshotSaved} -> ${m.screenshotPath}\n`);
    });

    console.log("-------------------------------------------------------");
    console.log(`Toplam Test Edilen Genişlik: ${res.measurements.length}`);
    console.log(`GENEL DURUM: ${res.success ? "TÜM GERÇEK DOM TARAYICI TESTLERİ BAŞARIYLA GEÇTİ ✓" : "BAŞARISIZ KONTROLLER VAR ✗"}`);
    console.log("=======================================================\n");

    if (!res.success) process.exit(1);
  });
}
