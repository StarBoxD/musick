/**
 * VYBE - Real Headless Browser DOM, React Component & Responsive Testing Suite
 *
 * Bundles the REAL React SongGrid & SongCard components via esbuild and executes
 * them inside real Headless Chrome via Chrome DevTools Protocol (CDP) across 12 viewports:
 * 320, 360, 375, 390, 430, 768, 820, 1024, 1180, 1280, 1440, 1920
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import http from "http";
import * as esbuild from "esbuild";

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
  profileLineNoOverlap: boolean;
  headingNoOverlap: boolean;
  headerAlignOk: boolean;
  // SongCard & 3-Dot Menu specific real DOM checks
  cardCount: number;
  coverSizeOk: boolean;
  coverWidth: number;
  coverHeight: number;
  titleFontSize: number;
  artistFontSize: number;
  typographyReadableOk: boolean;
  cardsNoOverlap: boolean;
  menuTrigger44pxOk: boolean;
  menuInViewportOk: boolean;
  singleMenuOnlyOk: boolean;
  escapeClosesMenuOk: boolean;
  favoriteActionOk: boolean;
  enqueuePreservesCurrentSongOk: boolean;
  playlistActionSeparateOk: boolean;
  removeActionOk: boolean;
  debugButtons?: { id: string; w: number; h: number }[];
  screenshotSaved: boolean;
  screenshotPath: string;
}

const VIEWPORT_WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1180, 1280, 1440, 1920];

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

async function buildReactMountBundle(): Promise<string> {
  const entryCode = `
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";
    import SongGrid from "./components/music/song-grid";

    const makeArtwork = (c1: string, c2: string, accent: string, title: string, sub: string) =>
      \`data:image/svg+xml;utf8,\${encodeURIComponent(
        \`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="\${c1}"/>
              <stop offset="100%" stop-color="\${c2}"/>
            </linearGradient>
            <radialGradient id="glow" cx="75%" cy="25%" r="60%">
              <stop offset="0%" stop-color="\${accent}" stop-opacity="0.38"/>
              <stop offset="100%" stop-color="\${c2}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="480" height="480" fill="url(#bg)"/>
          <rect width="480" height="480" fill="url(#glow)"/>
          <circle cx="240" cy="210" r="128" fill="rgba(9,9,13,0.34)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
          <circle cx="240" cy="210" r="88" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
          <circle cx="240" cy="210" r="42" fill="\${accent}" fill-opacity="0.85"/>
          <circle cx="240" cy="210" r="12" fill="#09090d"/>
          <text x="36" y="404" fill="#f5f5f7" font-family="sans-serif" font-weight="800" font-size="34" letter-spacing="-0.8">\${title}</text>
          <text x="36" y="438" fill="rgba(245,245,247,0.68)" font-family=" monospace" font-weight="600" font-size="18" letter-spacing="2">\${sub}</text>
        </svg>\`
      )}\`;

    const SAMPLE_SONGS = [
      {
        trackId: "trk-1",
        title: "Bir Derdim Var (Canlı Stüdyo Kaydı - 2026 Remastered Özel Versiyon)",
        artist: "Mor ve Ötesi feat. Şebnem Ferah & Teoman",
        album: "Dünya Yalan Söylüyor",
        artwork: makeArtwork("#1e2547", "#0d101d", "#d2ff5a", "MOR VE ÖTESİ", "DÜNYA YALAN SÖYLÜYOR"),
        streamUrl: "https://api.audius.co/v1/tracks/trk-1/stream?app_name=VYBE",
        durationSeconds: 214,
        genre: "Alternatif Rock",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
      {
        trackId: "trk-2",
        title: "Antidepresan",
        artist: "Mert Demir & Mabel Matiz",
        album: "Antidepresan",
        artwork: makeArtwork("#361d47", "#120d1a", "#ff7eb6", "ANTİDEPRESAN", "MERT DEMİR • MABEL MATİZ"),
        streamUrl: "https://api.audius.co/v1/tracks/trk-2/stream?app_name=VYBE",
        durationSeconds: 198,
        genre: "Türkçe Pop",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
      {
        trackId: "trk-3",
        title: "Haberin Yok Ölüyorum",
        artist: "Duman",
        album: "Belki Alışman Lazım",
        artwork: makeArtwork("#1b333b", "#0d1518", "#5ce1e6", "DUMAN", "BELKİ ALIŞMAN LAZIM"),
        streamUrl: "https://api.audius.co/v1/tracks/trk-3/stream?app_name=VYBE",
        durationSeconds: 242,
        genre: "Rock",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
      {
        trackId: "trk-4",
        title: "Gülpembe (Anadolu Rock Klasikleri Koleksiyonu)",
        artist: "Barış Manço & Kurtalan Ekspres",
        album: "Sözüm Meclisten Dışarı",
        artwork: makeArtwork("#1f3a2c", "#0f1713", "#d2ff5a", "BARIŞ MANÇO", "KURTALAN EKSPRES"),
        streamUrl: "https://api.audius.co/v1/tracks/trk-4/stream?app_name=VYBE",
        durationSeconds: 265,
        genre: "Anadolu Rock",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
      {
        trackId: "trk-5",
        title: "Fırtınadayım",
        artist: "Mabel Matiz",
        album: "Maya",
        artwork: makeArtwork("#42202c", "#160e12", "#ffb86c", "FIRTINADAYIM", "MABEL MATİZ • MAYA"),
        streamUrl: "https://api.audius.co/v1/tracks/trk-5/stream?app_name=VYBE",
        durationSeconds: 208,
        genre: "Indie Pop",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
      {
        trackId: "trk-6",
        title: "Yalnızlık Senfonisi",
        artist: "Sezen Aksu",
        album: "Gülümse",
        artwork: "",
        streamUrl: "https://api.audius.co/v1/tracks/trk-6/stream?app_name=VYBE",
        durationSeconds: 251,
        genre: "Klasik Pop",
        sourceUrl: "",
        license: "All Rights Reserved",
        provider: "audius",
      },
    ];

    function TestHarnessApp() {
      const [songs, setSongs] = useState(SAMPLE_SONGS);
      const [favorites, setFavorites] = useState([SAMPLE_SONGS[1]]);
      const [queue, setQueue] = useState([SAMPLE_SONGS[0]]);
      const [index, setIndex] = useState(0);
      const [playlistAdded, setPlaylistAdded] = useState([]);
      const [removedIds, setRemovedIds] = useState([]);
      const [lastToast, setLastToast] = useState("");

      const handlePlay = (newSongs, nextIdx) => {
        setQueue(newSongs);
        setIndex(nextIdx);
      };

      const handleFavorite = (song) => {
        setFavorites((prev) =>
          prev.some((f) => f.trackId === song.trackId)
            ? prev.filter((f) => f.trackId !== song.trackId)
            : [song, ...prev]
        );
      };

      const handleEnqueue = (track) => {
        setQueue((prev) => {
          if (prev.some((item) => item.trackId === track.trackId)) {
            setLastToast(\`"\${track.title}" zaten oynatma sırasında.\`);
            return prev;
          }
          setLastToast(\`"\${track.title}" sıraya eklendi.\`);
          return [...prev, track];
        });
      };

      const handleAddToPlaylist = (track) => {
        setPlaylistAdded((prev) => [...prev, track.trackId]);
        setLastToast(\`"\${track.title}" çalma listesine eklendi.\`);
      };

      const handleRemove = (track) => {
        setRemovedIds((prev) => [...prev, track.trackId]);
        setSongs((prev) => prev.filter((s) => s.trackId !== track.trackId));
      };

      // Expose state for automated CDP assertions
      window.__VYBE_TEST_STATE__ = {
        songs,
        favorites,
        queue,
        index,
        currentPlaying: queue[index] || null,
        playlistAdded,
        removedIds,
        lastToast,
        resetSongs: () => {
          setSongs(SAMPLE_SONGS);
          setLastToast("");
        },
      };

      return (
        <div>
          <SongGrid
            songs={songs}
            favorites={favorites}
            empty="Parça yok"
            source={{ type: "gems", label: "Alternatif" }}
            onPlay={handlePlay}
            onFavorite={handleFavorite}
            onAddToQueue={handleEnqueue}
            onAdd={handleAddToPlaylist}
            onRemove={handleRemove}
          />
          {lastToast && (
            <div className="music-toast" id="test-toast" role="status">
              <span>{lastToast}</span>
            </div>
          )}
        </div>
      );
    }

    const rootEl = document.getElementById("react-song-grid-root");
    if (rootEl) {
      const root = createRoot(rootEl);
      root.render(<TestHarnessApp />);
    }
  `;

  const result = await esbuild.build({
    stdin: {
      contents: entryCode,
      resolveDir: process.cwd(),
      sourcefile: "harness-entry.tsx",
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: ["chrome110"],
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });

  return result.outputFiles[0].text;
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

  const reactBundleCode = await buildReactMountBundle();

  const browserName = browserPath.includes("chrome")
    ? "Google Chrome (Headless)"
    : "Microsoft Edge (Headless)";
  const port = 9333;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vybe-browser-test-"));
  const harnessPath = path.resolve(process.cwd(), "scripts/harness.html");
  const cssPath = path.resolve(process.cwd(), "app/globals.css");
  const artifactRoot =
    "C:\\Users\\efedo\\.gemini\\antigravity\\brain\\84a8fea8-9ffb-452f-981e-803b5e12bcb8";
  const screenshotDir = path.join(artifactRoot, "screenshots");

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Serve real app CSS & React bundle over local HTTP server
  const server = http.createServer((req, res) => {
    const reqUrl = req.url || "/";
    if (reqUrl.includes("globals.css")) {
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      res.end(fs.readFileSync(cssPath, "utf-8"));
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
  const fileUrl = `http://127.0.0.1:${httpPort}/dashboard`;

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
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* pass */
    }
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

    // Mount the real React SongGrid & SongCard bundle into the page
    await cdp.send("Runtime.evaluate", {
      expression: reactBundleCode,
      awaitPromise: false,
    });
    await new Promise((r) => setTimeout(r, 250));

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
        expression: `if (window.__VYBE_TEST_STATE__ && window.__VYBE_TEST_STATE__.resetSongs) { window.__VYBE_TEST_STATE__.resetSongs(); }`,
      });
      await new Promise((r) => setTimeout(r, 80));

      // Take clean screenshot BEFORE interactive menu tests mutate list items
      const screenshotData = await cdp.send("Page.captureScreenshot", {
        format: "png",
      });
      const screenshotFilename = `viewport_${width}.png`;
      const fullScreenshotPath = path.join(screenshotDir, screenshotFilename);
      const pngBuffer = Buffer.from(screenshotData.data, "base64");
      fs.writeFileSync(fullScreenshotPath, pngBuffer);
      if (width === 390) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_phone_390.png"), pngBuffer);
      } else if (width === 820) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_tablet_820.png"), pngBuffer);
      } else if (width === 1440) {
        fs.writeFileSync(path.join(artifactRoot, "vybe_desktop_1440.png"), pngBuffer);
      }

      // Run comprehensive DOM & React interaction tests
      const evalScript = `
        (async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 15)));
          if (window.__VYBE_TEST_STATE__ && window.__VYBE_TEST_STATE__.resetSongs) {
            window.__VYBE_TEST_STATE__.resetSongs();
            await sleep(40);
          }

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
          const noNavPlayerCollision = isMobileVp ? (pRect.bottom <= nRect.top + 4) : true;

          // SongCard DOM Checks
          const cards = Array.from(document.querySelectorAll(".song-card"));
          const cardCount = cards.length;

          // Cover dimensions & 3-device layout verification:
          // - Phone (<= 768px): Nothing OS style single-column horizontal row (60x60px or 64x64px square cover)
          // - Tablet (769px - 1120px): Ronas IT style 2-column vertical album card (full card width square cover >= 240px)
          // - Desktop (>= 1121px): Moosync style 3/4-column vertical album card (full card width large square cover >= 220px)
          const firstCard = cards[0];
          const firstCover = document.querySelector(".song-cover-wrap") || document.querySelector(".song-cover");
          const cardRect = firstCard ? firstCard.getBoundingClientRect() : { width: 0, height: 0 };
          const coverRect = firstCover ? firstCover.getBoundingClientRect() : { width: 0, height: 0 };
          const coverWidth = Math.round(coverRect.width);
          const coverHeight = Math.round(coverRect.height);
          let coverSizeOk = false;
          if (window.innerWidth <= 768) {
            coverSizeOk = coverWidth >= 58 && coverWidth <= 68 && Math.abs(coverWidth - coverHeight) <= 1;
          } else if (window.innerWidth <= 1120) {
            coverSizeOk =
              coverWidth >= 240 &&
              Math.abs(coverWidth - coverHeight) <= 2 &&
              coverWidth >= Math.round(cardRect.width) - 34;
          } else {
            coverSizeOk =
              coverWidth >= 220 &&
              Math.abs(coverWidth - coverHeight) <= 2 &&
              coverWidth >= Math.round(cardRect.width) - 36;
          }

          // Typography readability
          const firstTitle = document.querySelector(".song-title");
          const firstArtist = document.querySelector(".song-artist");
          const titleFontSize = firstTitle ? parseFloat(window.getComputedStyle(firstTitle).fontSize) : 0;
          const artistFontSize = firstArtist ? parseFloat(window.getComputedStyle(firstArtist).fontSize) : 0;
          let typographyReadableOk = false;
          if (window.innerWidth <= 768) {
            typographyReadableOk = titleFontSize >= 14.8 && titleFontSize <= 16.5 && artistFontSize >= 12.8 && artistFontSize <= 14.5;
          } else if (window.innerWidth <= 1120) {
            typographyReadableOk = titleFontSize >= 14.5 && titleFontSize <= 15.8 && artistFontSize >= 12.5 && artistFontSize <= 13.8;
          } else {
            typographyReadableOk = titleFontSize >= 15.5 && titleFontSize <= 16.8 && artistFontSize >= 13.5 && artistFontSize <= 14.8;
          }

          // Check that cards do not overlap each other
          let cardsNoOverlap = cards.length >= 4;
          for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
              const r1 = cards[i].getBoundingClientRect();
              const r2 = cards[j].getBoundingClientRect();
              const horizOverlap = r1.left < r2.right - 1 && r2.left < r1.right - 1;
              const vertOverlap = r1.top < r2.bottom - 1 && r2.top < r1.bottom - 1;
              if (horizOverlap && vertOverlap) {
                cardsNoOverlap = false;
              }
            }
          }

          // Check that when scrolled to bottom, the last card does not remain trapped behind MiniPlayer
          if (main && cards.length > 0 && playerEl) {
            const prevScroll = main.scrollTop;
            main.scrollTop = main.scrollHeight;
            const lastCardRect = cards[cards.length - 1].getBoundingClientRect();
            const plRectNow = playerEl.getBoundingClientRect();
            if (lastCardRect.bottom > plRectNow.top + 2) {
              cardsNoOverlap = false;
            }
            main.scrollTop = prevScroll;
          }

          // Check 3-dot menu trigger size >= 44x44px
          const menuTriggers = Array.from(document.querySelectorAll(".song-menu-trigger"));
          const menuTrigger44pxOk = menuTriggers.length > 0 && menuTriggers.every((btn) => {
            const r = btn.getBoundingClientRect();
            return Math.round(r.width) >= 44 && Math.round(r.height) >= 44;
          });

          // Test 3-dot Menu Open & Viewport Bounds
          let menuInViewportOk = false;
          let singleMenuOnlyOk = false;
          let escapeClosesMenuOk = false;
          let favoriteActionOk = false;
          let enqueuePreservesCurrentSongOk = false;
          let playlistActionSeparateOk = false;
          let removeActionOk = false;

          if (menuTriggers.length >= 3) {
            // 1. Open first card's menu
            menuTriggers[0].click();
            await sleep(40);
            const openMenus1 = document.querySelectorAll(".song-dropdown-menu");
            if (openMenus1.length === 1) {
              const mRect = openMenus1[0].getBoundingClientRect();
              menuInViewportOk =
                mRect.left >= 0 &&
                mRect.right <= window.innerWidth &&
                mRect.top >= 0 &&
                mRect.bottom <= window.innerHeight;
            }

            // 2. Click second card's menu trigger -> first must close automatically
            menuTriggers[1].click();
            await sleep(40);
            const openMenus2 = document.querySelectorAll(".song-dropdown-menu");
            singleMenuOnlyOk =
              openMenus2.length === 1 &&
              menuTriggers[0].getAttribute("aria-expanded") === "false" &&
              menuTriggers[1].getAttribute("aria-expanded") === "true";

            // 3. Press Escape -> menu must close
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            await sleep(40);
            escapeClosesMenuOk = document.querySelectorAll(".song-dropdown-menu").length === 0;

            // 4. Favorite toggle via menu
            const initialFavCount = window.__VYBE_TEST_STATE__.favorites.length;
            menuTriggers[0].click();
            await sleep(40);
            const menuItems0 = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item"));
            const favBtn = menuItems0.find((el) => el.textContent.includes("Favori"));
            if (favBtn) {
              favBtn.click();
              await sleep(40);
              const afterFavCount = window.__VYBE_TEST_STATE__.favorites.length;
              favoriteActionOk = afterFavCount === initialFavCount + 1;
              // Toggle back to keep clean state
              menuTriggers[0].click();
              await sleep(40);
              const favBtnBack = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item")).find((el) =>
                el.textContent.includes("Favorilerden çıkar")
              );
              if (favBtnBack) {
                favBtnBack.click();
                await sleep(40);
              } else {
                favoriteActionOk = false;
              }
            }

            // 5. Enqueue via menu ("Sıraya ekle") without interrupting current playing track
            const beforePlayingId = window.__VYBE_TEST_STATE__.currentPlaying?.trackId;
            const beforeIndex = window.__VYBE_TEST_STATE__.index;
            const beforeQueueLen = window.__VYBE_TEST_STATE__.queue.length;
            menuTriggers[2].click();
            await sleep(40);
            const queueBtn = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item")).find((el) =>
              el.textContent.includes("Sıraya ekle")
            );
            if (queueBtn) {
              queueBtn.click();
              await sleep(40);
              const afterPlayingId = window.__VYBE_TEST_STATE__.currentPlaying?.trackId;
              const afterIndex = window.__VYBE_TEST_STATE__.index;
              const afterQueueLen = window.__VYBE_TEST_STATE__.queue.length;

              // Try adding the exact same track again -> duplicate must be prevented
              menuTriggers[2].click();
              await sleep(40);
              const queueBtnAgain = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item")).find((el) =>
                el.textContent.includes("Sıraya ekle")
              );
              if (queueBtnAgain) {
                queueBtnAgain.click();
                await sleep(40);
              }
              const afterDuplicateQueueLen = window.__VYBE_TEST_STATE__.queue.length;

              enqueuePreservesCurrentSongOk =
                beforePlayingId === afterPlayingId &&
                beforeIndex === afterIndex &&
                afterQueueLen >= beforeQueueLen &&
                afterDuplicateQueueLen === afterQueueLen;
            }

            // 6. Add to Playlist via menu ("Çalma listesine ekle")
            const beforePlaylistLen = window.__VYBE_TEST_STATE__.playlistAdded.length;
            menuTriggers[1].click();
            await sleep(40);
            const plBtn = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item")).find((el) =>
              el.textContent.includes("Çalma listesine ekle")
            );
            if (plBtn) {
              plBtn.click();
              await sleep(40);
              playlistActionSeparateOk =
                window.__VYBE_TEST_STATE__.playlistAdded.length === beforePlaylistLen + 1;
            }

            // 7. Remove from list ("Listeden çıkar")
            const beforeSongCount = window.__VYBE_TEST_STATE__.songs.length;
            const lastTrigger = menuTriggers[menuTriggers.length - 1];
            lastTrigger.click();
            await sleep(40);
            const removeBtn = Array.from(document.querySelectorAll(".song-dropdown-menu .song-menu-item")).find((el) =>
              el.textContent.includes("Listeden çıkar")
            );
            if (removeBtn) {
              removeBtn.click();
              await sleep(40);
              removeActionOk = window.__VYBE_TEST_STATE__.songs.length === beforeSongCount - 1;
              window.__VYBE_TEST_STATE__.resetSongs();
              await sleep(40);
            }
          }

          // Touch Targets on all visible buttons
          const buttons = Array.from(document.querySelectorAll("button:not([disabled])")).filter((b) => {
            const r = b.getBoundingClientRect();
            const cs = window.getComputedStyle(b);
            return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
          });

          let smallest = { width: 9999, height: 9999, tag: "", id: "" };
          let touchTargetsValid = true;
          for (const b of buttons) {
            const r = b.getBoundingClientRect();
            if (r.width < smallest.width || r.height < smallest.height) {
              smallest = {
                width: Math.round(r.width),
                height: Math.round(r.height),
                tag: b.tagName,
                id: b.id || b.className,
              };
            }
            if (r.width < 34 || r.height < 34) {
              touchTargetsValid = false;
            }
          }

          const debugButtons = buttons
            .map((b) => ({
              id: b.id || b.className,
              w: Math.round(b.getBoundingClientRect().width),
              h: Math.round(b.getBoundingClientRect().height),
            }))
            .filter((b) => b.w < 36 || b.h < 36);

          // Mobile bottom sheet Open / Close
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

          // Topbar Line vs Profile Overlap
          const topbar = document.querySelector(".music-topbar");
          const mobileUser = document.querySelector(".mobile-user");
          let profileLineNoOverlap = true;
          if (topbar && mobileUser && window.getComputedStyle(mobileUser).display !== "none") {
            const tbRect = topbar.getBoundingClientRect();
            const uRect = mobileUser.getBoundingClientRect();
            profileLineNoOverlap = uRect.bottom <= tbRect.bottom + 2;
          }

          // Topbar vs Heading Collision
          const heading = document.querySelector(".music-heading");
          let headingNoOverlap = true;
          if (topbar && heading) {
            const tbRect = topbar.getBoundingClientRect();
            const hRect = heading.getBoundingClientRect();
            headingNoOverlap = hRect.top >= tbRect.bottom - 4;
          }

          // Topbar Vertical Alignment
          const topbarLeft = document.querySelector(".topbar-left");
          const topbarRight = document.querySelector(".topbar-right");
          let headerAlignOk = true;
          if (topbarLeft && topbarRight) {
            const lRect = topbarLeft.getBoundingClientRect();
            const rRect = topbarRight.getBoundingClientRect();
            headerAlignOk = Math.abs(lRect.top + lRect.height / 2 - (rRect.top + rRect.height / 2)) < 8;
          }

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
            profileLineNoOverlap,
            headingNoOverlap,
            headerAlignOk,
            cardCount,
            coverSizeOk,
            coverWidth,
            coverHeight,
            titleFontSize,
            artistFontSize,
            typographyReadableOk,
            cardsNoOverlap,
            menuTrigger44pxOk,
            menuInViewportOk,
            singleMenuOnlyOk,
            escapeClosesMenuOk,
            favoriteActionOk,
            enqueuePreservesCurrentSongOk,
            playlistActionSeparateOk,
            removeActionOk,
            debugButtons,
          };
        })()
      `;

      const evalResponse = await cdp.send("Runtime.evaluate", {
        expression: evalScript,
        returnByValue: true,
        awaitPromise: true,
      });

      const res = evalResponse.result.value;

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
          m.playlistFormNoOverflow &&
          m.profileLineNoOverlap &&
          m.headingNoOverlap &&
          m.headerAlignOk &&
          m.coverSizeOk &&
          m.typographyReadableOk &&
          m.cardsNoOverlap &&
          m.menuTrigger44pxOk &&
          m.menuInViewportOk &&
          m.singleMenuOnlyOk &&
          m.escapeClosesMenuOk &&
          m.favoriteActionOk &&
          m.enqueuePreservesCurrentSongOk &&
          m.playlistActionSeparateOk &&
          m.removeActionOk
      ),
      measurements,
      browserName,
    };
  } finally {
    cdp.close();
    chromeProc.kill();
    server.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // pass
    }
  }
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("test-real-browser"))
) {
  runRealBrowserAudit().then((res) => {
    console.log("\n=======================================================");
    console.log(`   VYBE GERÇEK TARAYICI & REACT BİLEŞEN TESTİ (12 EKRAN)`);
    console.log(`   Tarayıcı: ${res.browserName}`);
    console.log("=======================================================\n");

    if (!res.success && res.error) {
      console.error(`Tarayıcı çalıştırılamadı: ${res.error}`);
      process.exit(1);
    }

    res.measurements.forEach((m) => {
      const allPass =
        m.noPageHorizontalOverflow &&
        m.mainNoOverflow &&
        m.noNavPlayerCollision &&
        m.touchTargetsValid &&
        m.inputZoomSafe &&
        m.tabletSidebarOk &&
        m.coverSizeOk &&
        m.typographyReadableOk &&
        m.cardsNoOverlap &&
        m.menuTrigger44pxOk &&
        m.menuInViewportOk &&
        m.singleMenuOnlyOk &&
        m.escapeClosesMenuOk &&
        m.favoriteActionOk &&
        m.enqueuePreservesCurrentSongOk &&
        m.playlistActionSeparateOk &&
        m.removeActionOk;

      const status = allPass ? "✓ GEÇTİ" : "✗ KALDI";

      console.log(`[${status}] Genişlik: ${m.width}px x ${m.height}px`);
      console.log(`   - Yatay Taşma: ${m.noPageHorizontalOverflow ? "Yok" : "Var"} (${m.scrollWidth}px / ${m.clientWidth}px)`);
      console.log(`   - Albüm Kapağı: ${m.coverWidth}x${m.coverHeight}px (Hedef Aralığa Uygun: ${m.coverSizeOk})`);
      console.log(`   - Yazı Okunabilirliği: Şarkı=${m.titleFontSize}px, Sanatçı=${m.artistFontSize}px (Uygun: ${m.typographyReadableOk})`);
      console.log(`   - Kart Çakışması: ${m.cardsNoOverlap ? "Yok" : "Çakışma Var"}`);
      console.log(`   - Üç Nokta Butonu (44x44px): ${m.menuTrigger44pxOk ? "Uygun" : "Küçük"}`);
      console.log(`   - Üç Nokta Menüsü Ekran İçi Sınırları: ${m.menuInViewportOk ? "Taşma Yok" : "Taşma Var"}`);
      console.log(`   - Tek Açık Menü Kuralı & Escape Kapatma: ${m.singleMenuOnlyOk && m.escapeClosesMenuOk ? "Çalışıyor" : "Hatalı"}`);
      console.log(`   - Favori Ekle/Çıkar & Sıraya Ekle (Çalanı Korur) & Liste Ekle/Çıkar: ${m.favoriteActionOk && m.enqueuePreservesCurrentSongOk && m.playlistActionSeparateOk && m.removeActionOk ? "Çalışıyor" : "Hatalı"}`);
      console.log(`   - Ekran Görüntüsü: ${m.screenshotPath}\n`);
    });

    console.log("-------------------------------------------------------");
    console.log(`Toplam Test Edilen Genişlik: ${res.measurements.length}`);
    console.log(
      `GENEL DURUM: ${
        res.success
          ? "TÜM 12 VIEWPORT & REACT KART TESTLERİ BAŞARIYLA GEÇTİ ✓"
          : "BAŞARISIZ KONTROLLER VAR ✗"
      }`
    );
    console.log("=======================================================\n");

    if (!res.success) process.exit(1);
  });
}
