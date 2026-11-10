export interface ViewportProfile {
  id: string;
  name: string;
  width: number;
  height: number;
  type: "mobile" | "tablet" | "desktop";
  expectedSidebar: "none" | "rail-80px" | "full-248px";
  expectedNav: "mobile-bottom-nav" | "sidebar-rail" | "sidebar-full";
  expectedMoodCols: number;
}

export interface ResponsiveCheckResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

export const VIEWPORT_MATRIX: ViewportProfile[] = [
  {
    id: "phone-se",
    name: "Small phone (320x568) - iPhone SE 1st gen",
    width: 320,
    height: 568,
    type: "mobile",
    expectedSidebar: "none",
    expectedNav: "mobile-bottom-nav",
    expectedMoodCols: 2,
  },
  {
    id: "phone-standard",
    name: "iPhone standard (375x667) - iPhone 6/7/8/SE2/SE3",
    width: 375,
    height: 667,
    type: "mobile",
    expectedSidebar: "none",
    expectedNav: "mobile-bottom-nav",
    expectedMoodCols: 2,
  },
  {
    id: "phone-modern",
    name: "iPhone modern (390x844) - iPhone 12/13/14/15/16",
    width: 390,
    height: 844,
    type: "mobile",
    expectedSidebar: "none",
    expectedNav: "mobile-bottom-nav",
    expectedMoodCols: 2,
  },
  {
    id: "phone-large",
    name: "Large phone (430x932) - iPhone Pro Max / Plus / Galaxy S24 Ultra",
    width: 430,
    height: 932,
    type: "mobile",
    expectedSidebar: "none",
    expectedNav: "mobile-bottom-nav",
    expectedMoodCols: 2,
  },
  {
    id: "tablet-small",
    name: "Small tablet (768x1024) - iPad Mini / older iPad portrait",
    width: 768,
    height: 1024,
    type: "mobile",
    expectedSidebar: "none",
    expectedNav: "mobile-bottom-nav",
    expectedMoodCols: 2,
  },
  {
    id: "tablet-ipad-air",
    name: "iPad portrait (820x1180) - iPad Air 4/5 / iPad 10th gen",
    width: 820,
    height: 1180,
    type: "tablet",
    expectedSidebar: "rail-80px",
    expectedNav: "sidebar-rail",
    expectedMoodCols: 4,
  },
  {
    id: "tablet-landscape",
    name: "Tablet landscape (1024x768) - iPad landscape",
    width: 1024,
    height: 768,
    type: "tablet",
    expectedSidebar: "rail-80px",
    expectedNav: "sidebar-rail",
    expectedMoodCols: 4,
  },
  {
    id: "tablet-pro-landscape",
    name: 'Large tablet (1180x820) - iPad Air/Pro 11" landscape',
    width: 1180,
    height: 820,
    type: "desktop",
    expectedSidebar: "full-248px",
    expectedNav: "sidebar-full",
    expectedMoodCols: 4,
  },
  {
    id: "laptop-hd",
    name: "Laptop (1366x768) - WXGA HD laptop",
    width: 1366,
    height: 768,
    type: "desktop",
    expectedSidebar: "full-248px",
    expectedNav: "sidebar-full",
    expectedMoodCols: 4,
  },
  {
    id: "desktop-fhd",
    name: "Desktop (1920x1080) - FHD Desktop",
    width: 1920,
    height: 1080,
    type: "desktop",
    expectedSidebar: "full-248px",
    expectedNav: "sidebar-full",
    expectedMoodCols: 4,
  },
];
