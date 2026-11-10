/**
 * VYBE P1 Comprehensive Regression and Security Test Suite
 * 
 * Verifies:
 * 1. OAuth open redirect validation
 * 2. Player volume change effect isolation (no track reloads on volume change)
 * 3. Queue source & mood preservation (no automatic Chill fallback)
 * 4. iPhone Media Session API handlers & SSR safety
 * 5. Audius license classification & messaging
 * 6. Supabase RLS and grants least privilege alignment
 * 7. Service Worker cache security and viewport zoom accessibility
 */

import fs from "fs";
import path from "path";
import { sanitizeRedirectTarget } from "../lib/auth/redirect";
import { verifyTrackLicense } from "../lib/music/license-filter";

interface TestReport {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const reports: TestReport[] = [];

function check(category: string, name: string, passed: boolean, details: string) {
  reports.push({ category, name, passed, details });
}

export function runP1Tests(): { total: number; passed: number; reports: TestReport[] } {
  // --------------------------------------------------------------------------
  // 1. OAuth Açık Yönlendirme (Open Redirect - CWE-601) Koruması
  // --------------------------------------------------------------------------
  const appOrigin = "https://vybe.izgura.com";
  const maliciousTargets = [
    "//attacker.com",
    "//attacker.com/path",
    "/\\attacker.com",
    "\\attacker.com",
    "http://attacker.com",
    "https://attacker.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "///attacker.com",
    "/%2f%2fattacker.com",
    "/%5c%5cattacker.com",
    "/test\\something",
    "https://vybe.izgura.com.attacker.com",
  ];

  let allMaliciousBlocked = true;
  for (const malicious of maliciousTargets) {
    const result = sanitizeRedirectTarget(malicious, appOrigin);
    if (result !== "/dashboard") {
      allMaliciousBlocked = false;
      break;
    }
  }

  const validTargets = [
    "/dashboard",
    "/dashboard?view=library",
    "/dashboard#playlists",
    "/login",
  ];

  let allValidPreserved = true;
  for (const valid of validTargets) {
    const result = sanitizeRedirectTarget(valid, appOrigin);
    if (result !== valid) {
      allValidPreserved = false;
      break;
    }
  }

  check(
    "1. OAuth Yönlendirme Güvenliği",
    "Tüm açık yönlendirme saldırı vektörleri engellenip /dashboard yoluna yönlendirildi",
    allMaliciousBlocked && allValidPreserved,
    `Engellenen zararlı hedef sayısı: ${maliciousTargets.length}, Korunan geçerli hedef sayısı: ${validTargets.length}`
  );

  // --------------------------------------------------------------------------
  // 2. Player Ses Seviyesi Değişimi & Effect Bağımlılığı
  // --------------------------------------------------------------------------
  const miniPlayerSource = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/mini-player.tsx"),
    "utf-8"
  );

  const hasSeparateVolumeEffect =
    miniPlayerSource.includes("useEffect(() => {") &&
    miniPlayerSource.includes("audioRef.current.volume = volume") &&
    miniPlayerSource.includes("}, [volume]);");

  const songLoadingEffectDoesNotDependOnVolume =
    !miniPlayerSource.includes("}, [song, volume]);") &&
    miniPlayerSource.includes("}, [song]);");

  const hasTrackIdGuard = miniPlayerSource.includes("currentTrackIdRef.current === song.trackId");

  check(
    "2. Player Ses Seviyesi İzolasyonu",
    "Ses ayarı bağımsız effect'e ayrıldı ve şarkı yükleme effect'i ses değişiminde tetiklenmiyor",
    hasSeparateVolumeEffect && songLoadingEffectDoesNotDependOnVolume && hasTrackIdGuard,
    "Volume değiştiğinde şarkıyı baştan başlatan bağımlılık hatası düzeltildi"
  );

  // --------------------------------------------------------------------------
  // 3. Kuyruk ve Keşif Kaynağının Korunması
  // --------------------------------------------------------------------------
  const dashboardSource = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/music-dashboard.tsx"),
    "utf-8"
  );
  const discoverPanelSource = fs.readFileSync(
    path.resolve(process.cwd(), "components/music/discover-panel.tsx"),
    "utf-8"
  );

  const tracksPlaybackSource =
    dashboardSource.includes("playbackSource") &&
    dashboardSource.includes("setPlaybackSource");

  const doesNotHardcodeChillOnFetchMore =
    !dashboardSource.includes('postMusic("/api/music/discover", { mood: "Chill" })') &&
    dashboardSource.includes("playbackSource.mood");

  const discoverPanelPassesMoodSource =
    discoverPanelSource.includes('onPlay([picked], 0, { type: "mood", mood: nextMood })');

  const deduplicatesIncomingQueue =
    dashboardSource.includes("fresh = incoming.filter");

  check(
    "3. Kuyruk ve Mood Korunması",
    "Kuyruk bittiğinde otomatik Chill'e geçiş engellendi, aktif mood kaynağı korunuyor",
    tracksPlaybackSource && doesNotHardcodeChillOnFetchMore && discoverPanelPassesMoodSource && deduplicatesIncomingQueue,
    "Kullanıcının seçtiği frekans/mood veya liste kuyruk sonrasında korunuyor"
  );

  // --------------------------------------------------------------------------
  // 4. iPhone & PWA Media Session API
  // --------------------------------------------------------------------------
  const hasMediaSession =
    miniPlayerSource.includes("navigator.mediaSession") &&
    miniPlayerSource.includes("MediaMetadata") &&
    miniPlayerSource.includes("setActionHandler(\"play\"") &&
    miniPlayerSource.includes("setActionHandler(\"pause\"") &&
    miniPlayerSource.includes("setActionHandler(\"nexttrack\"") &&
    miniPlayerSource.includes("setActionHandler(\"previoustrack\"") &&
    miniPlayerSource.includes("playbackState = playing ? \"playing\" : \"paused\"") &&
    miniPlayerSource.includes("setPositionState");

  const hasSsrSafeGuards =
    miniPlayerSource.includes('typeof window === "undefined"') ||
    miniPlayerSource.includes('typeof window !== "undefined"');

  check(
    "4. Media Session API Entegrasyonu",
    "Kilit ekranı ve bildirim çubuğu Media Session kontrolleri ve metadata senkronizasyonu eklendi",
    hasMediaSession && hasSsrSafeGuards,
    "iOS Safari ve PWA kilit ekranı eylemleri (play/pause/prev/next/seek) bağlandı"
  );

  // --------------------------------------------------------------------------
  // 5. Audius Lisans Mesajları ve Sınıflandırma
  // --------------------------------------------------------------------------
  const arrLicense = verifyTrackLicense("All Rights Reserved");
  const ccLicense = verifyTrackLicense("CC BY-SA 4.0");
  const emptyLicense = verifyTrackLicense(null);
  const customLicense = verifyTrackLicense("Proprietary-Indie-Label");

  const isArrDistinguished =
    arrLicense.status === "VERIFIED" && arrLicense.label === "All Rights Reserved";
  const isCcVerified =
    ccLicense.status === "VERIFIED" && ccLicense.label === "CC BY-SA 4.0";
  const isEmptyUnverified =
    emptyLicense.status === "LICENSE_UNVERIFIED" &&
    emptyLicense.label.includes("Doğrulanmamış") &&
    !emptyLicense.label.includes("Telifsiz");
  const isCustomUnverified =
    customLicense.status === "LICENSE_UNVERIFIED" &&
    customLicense.label.includes("Doğrulanmamış Lisans:");

  check(
    "5. Lisans Sınıflandırması",
    "All Rights Reserved ile bilinmeyen/eksik lisanslar birbirinden ayrıldı, telifsiz etiketi kaldırıldı",
    isArrDistinguished && isCcVerified && isEmptyUnverified && isCustomUnverified,
    "Lisans etiketleme doğruluk kurallarına uygun"
  );

  // --------------------------------------------------------------------------
  // 6. Supabase Yetkileri ve RLS Sıkılaştırması
  // --------------------------------------------------------------------------
  const grantsSource = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/migrations/20261110_api_role_grants.sql"),
    "utf-8"
  );
  const hardeningSource = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/migrations/20261110_allowlist_rls_hardening.sql"),
    "utf-8"
  );

  const grantsLeastPrivilege =
    grantsSource.includes("grant select on table public.allowed_users to authenticated") &&
    !grantsSource.includes("delete on table public.allowed_users") &&
    !grantsSource.includes("delete on table\n  public.favorites,\n  public.playlists,\n  public.playlist_tracks,\n  public.seen_tracks,\n  public.daily_vybes");

  const hardeningLeastPrivilege =
    hardeningSource.includes("drop policy if exists \"Allowed users delete own profile\"") &&
    hardeningSource.includes("drop policy if exists \"Allowed users delete own seen tracks\"") &&
    hardeningSource.includes("drop policy if exists \"Allowed users delete own daily vybe\"");

  check(
    "6. Supabase En Az Yetki (Least Privilege)",
    "allowed_users, profiles, seen_tracks ve daily_vybes için gereksiz DELETE yetkileri kaldırıldı",
    grantsLeastPrivilege && hardeningLeastPrivilege,
    "API rolleri ve RLS politikaları tam uyumlu hale getirildi"
  );

  // --------------------------------------------------------------------------
  // 7. PWA, Service Worker & Viewport
  // --------------------------------------------------------------------------
  const swSource = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf-8");
  const layoutSource = fs.readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf-8");

  const swExcludesPrivateApis =
    swSource.includes('url.pathname.startsWith("/api/")') &&
    swSource.includes('url.pathname.startsWith("/auth/")');

  const swHandlesStaticCaches =
    swSource.includes("vybe-static-v3") &&
    swSource.includes("caches.delete");

  const viewportAllowsZoom = !layoutSource.includes("maximumScale: 1");

  check(
    "7. PWA & Service Worker Güvenliği",
    "Özel API'ler cache dışı bırakıldı, eski cache temizliği sağlandı ve maximumScale: 1 kaldırıldı",
    swExcludesPrivateApis && swHandlesStaticCaches && viewportAllowsZoom,
    "PWA statik cache güvenliği ve mobil yakınlaştırma erişilebilirliği sağlandı"
  );

  return {
    total: reports.length,
    passed: reports.filter((r) => r.passed).length,
    reports,
  };
}

if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("test-p1-regressions"))) {
  const summary = runP1Tests();
  console.log("=======================================================");
  console.log("   VYBE P1 REGRESYON VE GÜVENLİK TEST RAPORU");
  console.log("=======================================================");
  summary.reports.forEach((r, idx) => {
    console.log(`[TEST ${idx + 1}] ${r.passed ? "✓ GEÇTİ" : "✗ KALDI"} - ${r.category}: ${r.name}`);
    console.log(`         Detay: ${r.details}`);
  });
  console.log("-------------------------------------------------------");
  console.log(`Toplam: ${summary.total} | Başarılı: ${summary.passed} | Başarısız: ${summary.total - summary.passed}`);
  console.log("=======================================================");

  if (summary.passed !== summary.total) {
    process.exit(1);
  }
}
