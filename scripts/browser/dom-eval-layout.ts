export const DOM_LAYOUT_EVAL_CODE = `
  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;
  const noPageHorizontalOverflow = scrollWidth <= clientWidth;

  const main = document.getElementById("music-main");
  const mainNoOverflow = main ? main.scrollWidth <= main.clientWidth + 1 : true;

  const playerEl = document.getElementById("mini-player");
  const navEl = document.getElementById("mobile-bottom-nav");
  const pRect = playerEl ? playerEl.getBoundingClientRect() : { bottom: 0 };
  const nRect = navEl ? navEl.getBoundingClientRect() : { top: 9999 };
  const isMobileVp = window.innerWidth <= 768;
  const noNavPlayerCollision = isMobileVp ? (pRect.bottom <= nRect.top + 4) : true;

  const cards = Array.from(document.querySelectorAll(".song-card"));
  const cardCount = cards.length;

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

  const input = document.getElementById("test-input");
  let inputFontSize = 0;
  let inputZoomSafe = true;
  if (input) {
    input.focus();
    inputFontSize = parseFloat(window.getComputedStyle(input).fontSize);
    inputZoomSafe = isMobileVp ? inputFontSize >= 16 : true;
  }

  const sidebar = document.getElementById("music-sidebar");
  const sideRect = sidebar ? sidebar.getBoundingClientRect() : { width: 0 };
  let tabletSidebarOk = true;
  if (window.innerWidth >= 769 && window.innerWidth <= 1120) {
    tabletSidebarOk = Math.abs(sideRect.width - 80) < 5;
  }

  const form = document.getElementById("playlist-form");
  const formRect = form ? form.getBoundingClientRect() : { right: 0 };
  const mainRect = main ? main.getBoundingClientRect() : { right: 9999 };
  const playlistFormNoOverflow = formRect.right <= mainRect.right + 2;

  const topbar = document.querySelector(".music-topbar");
  const mobileUser = document.querySelector(".mobile-user");
  let profileLineNoOverlap = true;
  if (topbar && mobileUser && window.getComputedStyle(mobileUser).display !== "none") {
    const tbRect = topbar.getBoundingClientRect();
    const uRect = mobileUser.getBoundingClientRect();
    profileLineNoOverlap = uRect.bottom <= tbRect.bottom + 2;
  }

  const heading = document.querySelector(".music-heading");
  let headingNoOverlap = true;
  if (topbar && heading) {
    const tbRect = topbar.getBoundingClientRect();
    const hRect = heading.getBoundingClientRect();
    headingNoOverlap = hRect.top >= tbRect.bottom - 4;
  }

  const topbarLeft = document.querySelector(".topbar-left");
  const topbarRight = document.querySelector(".topbar-right");
  let headerAlignOk = true;
  if (topbarLeft && topbarRight) {
    const lRect = topbarLeft.getBoundingClientRect();
    const rRect = topbarRight.getBoundingClientRect();
    headerAlignOk = Math.abs(lRect.top + lRect.height / 2 - (rRect.top + rRect.height / 2)) < 8;
  }
`;
