import fs from "fs";
import path from "path";
import type { CdpClient } from "./cdp-client";
import type { DomMeasurementResult } from "./browser-types";

export async function captureFullDashboardScreenshots(
  cdp: CdpClient,
  artifactRoot: string
): Promise<void> {
  const dashboardShots: {
    tab: string;
    width: number;
    height: number;
    mobile: boolean;
    filename: string;
  }[] = [
    { tab: "home", width: 1440, height: 920, mobile: false, filename: "vybe_home_1440.png" },
    { tab: "home", width: 820, height: 980, mobile: false, filename: "vybe_home_820.png" },
    { tab: "home", width: 390, height: 844, mobile: true, filename: "vybe_home_390.png" },
    { tab: "discover", width: 1440, height: 920, mobile: false, filename: "vybe_discover_1440.png" },
    { tab: "favorites", width: 1440, height: 920, mobile: false, filename: "vybe_favorites_1440.png" },
    { tab: "playlists", width: 1440, height: 920, mobile: false, filename: "vybe_playlists_1440.png" },
  ];

  for (const shot of dashboardShots) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.width,
      height: shot.height,
      deviceScaleFactor: 1,
      mobile: shot.mobile,
    });
    await cdp.send("Runtime.evaluate", {
      expression: `if (window.__MOUNT_FULL_DASHBOARD__) { window.__MOUNT_FULL_DASHBOARD__("${shot.tab}"); }`,
    });
    await new Promise((r) => setTimeout(r, 220));
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const playBtn = document.querySelector(".home-welcome-actions .next-btn, .now-playing-card .next-btn, .collection-hero-actions .next-btn, .playlist-detail-actions .next-btn");
        if (playBtn instanceof HTMLElement) playBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 120));
    const shotData = await cdp.send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(shotData.data, "base64");
    fs.writeFileSync(path.join(artifactRoot, shot.filename), buf);
    if (shot.tab === "home" && shot.width === 1440) {
      fs.writeFileSync(path.join(artifactRoot, "vybe_desktop_1440.png"), buf);
    } else if (shot.tab === "home" && shot.width === 820) {
      fs.writeFileSync(path.join(artifactRoot, "vybe_tablet_820.png"), buf);
    } else if (shot.tab === "home" && shot.width === 390) {
      fs.writeFileSync(path.join(artifactRoot, "vybe_phone_390.png"), buf);
      await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const expBtn = document.querySelector(".player-expand-btn");
          if (expBtn instanceof HTMLElement) expBtn.click();
        })()`,
      });
      await new Promise((r) => setTimeout(r, 100));
      const expData = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(
        path.join(artifactRoot, "vybe_phone_expanded_player_390.png"),
        Buffer.from(expData.data, "base64")
      );
    }
  }
}

export function isMeasurementPassing(m: DomMeasurementResult): boolean {
  return (
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
  );
}
