import fs from "fs";

export interface DomMeasurementResult {
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

export const VIEWPORT_WIDTHS = [
  320, 360, 375, 390, 430, 768, 820, 1024, 1180, 1280, 1440, 1920,
];

export function getBrowserExecutable(): string | null {
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
