"use client";

import { useEffect } from "react";
import type { Tab } from "@/components/music/dashboard/dashboard-types";

export function useViewportBottomSync(tab: Tab) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewportBottom = () => {
      if (window.innerWidth <= 768 && window.scrollY === 0) {
        window.scrollTo(0, 0);
      }
      const vv = window.visualViewport;
      if (vv && window.innerWidth <= 768) {
        const bottomGap = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
        document.documentElement.style.setProperty(
          "--vv-bottom-fix",
          bottomGap > 0 && bottomGap < 80 ? `${Math.round(bottomGap)}px` : "0px"
        );
      } else {
        document.documentElement.style.setProperty("--vv-bottom-fix", "0px");
      }
    };

    syncViewportBottom();
    const rafId = window.requestAnimationFrame(syncViewportBottom);
    const timerId = window.setTimeout(syncViewportBottom, 120);

    window.addEventListener("resize", syncViewportBottom, { passive: true });
    window.addEventListener("pageshow", syncViewportBottom, { passive: true });
    window.visualViewport?.addEventListener("resize", syncViewportBottom, { passive: true });
    window.visualViewport?.addEventListener("scroll", syncViewportBottom, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener("resize", syncViewportBottom);
      window.removeEventListener("pageshow", syncViewportBottom);
      window.visualViewport?.removeEventListener("resize", syncViewportBottom);
      window.visualViewport?.removeEventListener("scroll", syncViewportBottom);
    };
  }, [tab]);
}
