import { DOM_LAYOUT_EVAL_CODE } from "./dom-eval-layout";

const DOM_MENU_EVAL_CODE = `
  const menuTriggers = Array.from(document.querySelectorAll(".song-menu-trigger"));
  const menuTrigger44pxOk = menuTriggers.length > 0 && menuTriggers.every((btn) => {
    const r = btn.getBoundingClientRect();
    return Math.round(r.width) >= 44 && Math.round(r.height) >= 44;
  });

  let menuInViewportOk = false;
  let singleMenuOnlyOk = false;
  let escapeClosesMenuOk = false;
  let favoriteActionOk = false;
  let enqueuePreservesCurrentSongOk = false;
  let playlistActionSeparateOk = false;
  let removeActionOk = false;

  if (menuTriggers.length >= 3) {
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

    menuTriggers[1].click();
    await sleep(40);
    const openMenus2 = document.querySelectorAll(".song-dropdown-menu");
    singleMenuOnlyOk =
      openMenus2.length === 1 &&
      menuTriggers[0].getAttribute("aria-expanded") === "false" &&
      menuTriggers[1].getAttribute("aria-expanded") === "true";

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(40);
    escapeClosesMenuOk = document.querySelectorAll(".song-dropdown-menu").length === 0;

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
`;

export function buildDomEvalScript(): string {
  return `
    (async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 15)));
      if (window.__VYBE_TEST_STATE__ && window.__VYBE_TEST_STATE__.resetSongs) {
        window.__VYBE_TEST_STATE__.resetSongs();
        await sleep(40);
      }
      ${DOM_LAYOUT_EVAL_CODE}
      ${DOM_MENU_EVAL_CODE}
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
}
