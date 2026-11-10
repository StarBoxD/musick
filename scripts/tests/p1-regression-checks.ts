import fs from "fs";
import path from "path";
import { sanitizeRedirectTarget } from "../../lib/auth/redirect";
import { verifyTrackLicense } from "../../lib/music/license-filter";
import {
  readDashboardSources,
  readDiscoverSources,
  readMiniPlayerSources,
} from "./source-bundle-reader";

export interface TestReport {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

export function runP1RegressionChecks(): TestReport[] {
  const reports: TestReport[] = [];
  const check = (category: string, name: string, passed: boolean, details: string) => {
    reports.push({ category, name, passed, details });
  };

  // 1. OAuth Açık Yönlendirme Koruması
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

  const allMaliciousBlocked = maliciousTargets.every(
    (target) => sanitizeRedirectTarget(target, appOrigin) === "/dashboard"
  );
  const validTargets = ["/dashboard", "/dashboard?view=library", "/dashboard#playlists", "/login"];
  const allValidPreserved = validTargets.every(
    (valid) => sanitizeRedirectTarget(valid, appOrigin) === valid
  );

  check(
    "1. OAuth Yönlendirme Güvenliği",
    "Tüm açık yönlendirme saldırı vektörleri engellenip /dashboard yoluna yönlendirildi",
    allMaliciousBlocked && allValidPreserved,
    `Engellenen zararlı hedef sayısı: ${maliciousTargets.length}, Korunan geçerli hedef sayısı: ${validTargets.length}`
  );

  // 2. Player Ses Seviyesi Değişimi & Effect Bağımlılığı
  const miniPlayerSource = readMiniPlayerSources();
  const hasSeparateVolumeEffect =
    miniPlayerSource.includes("useEffect(() => {") &&
    miniPlayerSource.includes("audioRef.current.volume = volume") &&
    miniPlayerSource.includes("}, [volume]);");
  const songEffectDeps = miniPlayerSource.match(/\}, \[\s*song\b[\s\S]*?\]\);/g) ?? [];
  const songLoadingEffectDoesNotDependOnVolume =
    songEffectDeps.length > 0 && songEffectDeps.every((deps) => !/\bvolume\b/.test(deps));
  const hasTrackIdGuard = miniPlayerSource.includes("currentTrackIdRef.current === song.trackId");

  check(
    "2. Player Ses Seviyesi İzolasyonu",
    "Ses ayarı bağımsız effect'e ayrıldı ve şarkı yükleme effect'i ses değişiminde tetiklenmiyor",
    hasSeparateVolumeEffect && songLoadingEffectDoesNotDependOnVolume && hasTrackIdGuard,
    "Volume değiştiğinde şarkıyı baştan başlatan bağımlılık hatası düzeltildi"
  );

  // 3. Kuyruk ve Keşif Kaynağının Korunması
  const dashboardSource = readDashboardSources();
  const discoverPanelSource = readDiscoverSources();

  const tracksPlaybackSource =
    dashboardSource.includes("playbackSource") && dashboardSource.includes("setPlaybackSource");
  const doesNotHardcodeChillOnFetchMore =
    !dashboardSource.includes('postMusic("/api/music/discover", { mood: "Chill" })') &&
    (dashboardSource.includes("activeSource.mood") || dashboardSource.includes("playbackSource.mood"));
  const discoverPanelPassesMoodSource = discoverPanelSource.includes(
    'onPlay([picked], 0, { type: "mood", mood: nextMood })'
  );
  const deduplicatesIncomingQueue = dashboardSource.includes("fresh = incoming.filter");

  check(
    "3. Kuyruk ve Mood Korunması",
    "Kuyruk bittiğinde otomatik Chill'e geçiş engellendi, aktif mood kaynağı korunuyor",
    tracksPlaybackSource &&
      doesNotHardcodeChillOnFetchMore &&
      discoverPanelPassesMoodSource &&
      deduplicatesIncomingQueue,
    "Kullanıcının seçtiği frekans/mood veya liste kuyruk sonrasında korunuyor"
  );

  // 4. iPhone & PWA Media Session API
  const hasMediaSession =
    miniPlayerSource.includes("navigator.mediaSession") &&
    miniPlayerSource.includes("MediaMetadata") &&
    miniPlayerSource.includes('setActionHandler("play"') &&
    miniPlayerSource.includes('setActionHandler("pause"') &&
    miniPlayerSource.includes('setActionHandler("nexttrack"') &&
    miniPlayerSource.includes('setActionHandler("previoustrack"') &&
    miniPlayerSource.includes('playbackState = playing ? "playing" : "paused"') &&
    miniPlayerSource.includes("setPositionState");
  const hasSsrSafeGuards =
    miniPlayerSource.includes('typeof window === "undefined"') ||
    miniPlayerSource.includes('typeof window !== "undefined"');

  check(
    "4. Media Session API Entegrasyonu",
    "Kilit ekranı ve bildirim çubuğu Media Session kontrolleri ve metadata senkronizasyonu eklendi",
    hasMediaSession && hasSsrSafeGuards,
    "iOS Safari ve PWA kilit ekranı eylemleri bağlandı"
  );

  // 5. Audius Lisans Mesajları ve Sınıflandırma
  const arrLicense = verifyTrackLicense("All Rights Reserved");
  const ccLicense = verifyTrackLicense("CC BY-SA 4.0");
  const emptyLicense = verifyTrackLicense(null);
  const customLicense = verifyTrackLicense("Proprietary-Indie-Label");

  const isArrDistinguished =
    arrLicense.status === "VERIFIED" && arrLicense.label === "All Rights Reserved";
  const isCcVerified = ccLicense.status === "VERIFIED" && ccLicense.label === "CC BY-SA 4.0";
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

  // 6. Supabase Yetkileri ve RLS Sıkılaştırması
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
    !grantsSource.includes("delete on table public.allowed_users");
  const hardeningLeastPrivilege =
    hardeningSource.includes('drop policy if exists "Allowed users delete own profile"') &&
    hardeningSource.includes('drop policy if exists "Allowed users delete own seen tracks"') &&
    hardeningSource.includes('drop policy if exists "Allowed users delete own daily vybe"');

  check(
    "6. Supabase En Az Yetki (Least Privilege)",
    "allowed_users, profiles, seen_tracks ve daily_vybes için gereksiz DELETE yetkileri kaldırıldı",
    grantsLeastPrivilege && hardeningLeastPrivilege,
    "API rolleri ve RLS politikaları tam uyumlu hale getirildi"
  );

  // 7. PWA, Service Worker & Viewport
  const swSource = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf-8");
  const layoutSource = fs.readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf-8");
  const swExcludesPrivateApis =
    swSource.includes('url.pathname.startsWith("/api/")') &&
    swSource.includes('url.pathname.startsWith("/auth/")');
  const swHandlesStaticCaches =
    (swSource.includes("vybe-static-v4") || swSource.includes("vybe-static-v3")) &&
    swSource.includes("caches.delete");
  const viewportAllowsZoom = !layoutSource.includes("maximumScale: 1");

  check(
    "7. PWA & Service Worker Güvenliği",
    "Özel API'ler cache dışı bırakıldı, eski cache temizliği sağlandı ve maximumScale: 1 kaldırıldı",
    swExcludesPrivateApis && swHandlesStaticCaches && viewportAllowsZoom,
    "PWA statik cache güvenliği ve mobil yakınlaştırma erişilebilirliği sağlandı"
  );

  return reports;
}
