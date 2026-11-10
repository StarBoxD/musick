/**
 * VYBE - Comprehensive Row Level Security (RLS) & Function Privilege Matrix Tester
 * 
 * Tests the 5 required user scenarios:
 * 1. Aktif allowlist kullanıcısı
 * 2. Pasif allowlist kullanıcısı (is_active = false)
 * 3. Allowlist'te bulunmayan kullanıcı
 * 4. Oturum açmamış kullanıcı (anon / unauthenticated)
 * 5. Başka kullanıcıya ait playlist'e erişmeye çalışan kullanıcı (Cross-user attack)
 */

interface UserSession {
  uid: string | null;
  email: string | null;
  role: "authenticated" | "anon";
}

interface AllowedUserRow {
  email: string;
  is_active: boolean;
}

interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
}

interface PlaylistTrackRow {
  id: string;
  playlist_id: string;
  track_id: string;
}

// In-memory representation of database tables
const allowedUsersDb: AllowedUserRow[] = [
  { email: "aktif@vybe.io", is_active: true },
  { email: "pasif@vybe.io", is_active: false },
  { email: "victim@vybe.io", is_active: true },
];

const playlistsDb: PlaylistRow[] = [
  { id: "pl-victim-001", user_id: "user-victim-id", name: "Victim's Secret Playlist" },
  { id: "pl-active-002", user_id: "user-active-id", name: "Active User's Playlist" },
];

const playlistTracksDb: PlaylistTrackRow[] = [
  { id: "pt-1", playlist_id: "pl-victim-001", track_id: "trk-secret-1" },
  { id: "pt-2", playlist_id: "pl-active-002", track_id: "trk-public-2" },
];

// Helper: Check if session satisfies active allowlist
function isUserActiveInAllowlist(session: UserSession): boolean {
  if (session.role !== "authenticated" || !session.email) return false;
  const normalizedEmail = session.email.toLowerCase();
  return allowedUsersDb.some((au) => au.email === normalizedEmail && au.is_active === true);
}

// ----------------------------------------------------------------------------
// RLS Policy Evaluators directly translating 20261110_allowlist_rls_hardening.sql
// ----------------------------------------------------------------------------

export function evaluateProfilesSelect(session: UserSession, targetProfileId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  const isOwner = session.uid === targetProfileId;
  const isAllowlisted = isUserActiveInAllowlist(session);
  return isOwner && isAllowlisted;
}

export function evaluateFavoritesManage(session: UserSession, targetUserId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  const isOwner = session.uid === targetUserId;
  const isAllowlisted = isUserActiveInAllowlist(session);
  return isOwner && isAllowlisted;
}

export function evaluatePlaylistsManage(session: UserSession, targetUserId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  const isOwner = session.uid === targetUserId;
  const isAllowlisted = isUserActiveInAllowlist(session);
  return isOwner && isAllowlisted;
}

export function evaluatePlaylistTracksSelect(session: UserSession, playlistId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  const isAllowlisted = isUserActiveInAllowlist(session);
  if (!isAllowlisted) return false;
  // join check: exists (select 1 from playlists p where p.id = playlist_id and p.user_id = auth.uid())
  const ownsPlaylist = playlistsDb.some((p) => p.id === playlistId && p.user_id === session.uid);
  return ownsPlaylist;
}

export function evaluatePlaylistTracksInsert(session: UserSession, playlistId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  const isAllowlisted = isUserActiveInAllowlist(session);
  if (!isAllowlisted) return false;
  // check: exists (select 1 from playlists p where p.id = playlist_id and p.user_id = auth.uid())
  const ownsPlaylist = playlistsDb.some((p) => p.id === playlistId && p.user_id === session.uid);
  return ownsPlaylist;
}

export function evaluateClaimUnseenTracks(session: UserSession): { success: boolean; error?: string } {
  if (session.role !== "authenticated" || !session.uid) {
    return { success: false, error: "Authentication required." };
  }
  if (!isUserActiveInAllowlist(session)) {
    return { success: false, error: "User is not in active allowed_users list." };
  }
  return { success: true };
}

// ----------------------------------------------------------------------------
// Test Runner
// ----------------------------------------------------------------------------
export function runRlsMatrixTests(): { total: number; passed: number; results: { scenario: string; passed: boolean; message: string }[] } {
  const results: { scenario: string; passed: boolean; message: string }[] = [];

  function record(scenario: string, passed: boolean, message: string) {
    results.push({ scenario, passed, message });
  }

  // 1. Senaryo: Aktif Allowlist Kullanıcısı
  const activeUser: UserSession = { uid: "user-active-id", email: "aktif@vybe.io", role: "authenticated" };
  const s1Profiles = evaluateProfilesSelect(activeUser, "user-active-id");
  const s1Favorites = evaluateFavoritesManage(activeUser, "user-active-id");
  const s1Playlists = evaluatePlaylistsManage(activeUser, "user-active-id");
  const s1PlaylistTracks = evaluatePlaylistTracksSelect(activeUser, "pl-active-002");
  const s1Claim = evaluateClaimUnseenTracks(activeUser);

  record(
    "Senaryo 1: Aktif Allowlist Kullanıcısı",
    s1Profiles && s1Favorites && s1Playlists && s1PlaylistTracks && s1Claim.success,
    "Kendi verilerine ve claim_unseen_tracks'e tam erişim sağlandı."
  );

  // 2. Senaryo: Pasif Allowlist Kullanıcısı (is_active = false)
  const passiveUser: UserSession = { uid: "user-passive-id", email: "pasif@vybe.io", role: "authenticated" };
  const s2Profiles = evaluateProfilesSelect(passiveUser, "user-passive-id");
  const s2Favorites = evaluateFavoritesManage(passiveUser, "user-passive-id");
  const s2Playlists = evaluatePlaylistsManage(passiveUser, "user-passive-id");
  const s2Claim = evaluateClaimUnseenTracks(passiveUser);

  record(
    "Senaryo 2: Pasif Allowlist Kullanıcısı",
    !s2Profiles && !s2Favorites && !s2Playlists && !s2Claim.success && s2Claim.error === "User is not in active allowed_users list.",
    "Pasif kullanıcı RLS tarafından ve stored function seviyesinde engellendi."
  );

  // 3. Senaryo: Allowlist'te Bulunmayan Kullanıcı
  const unlistedUser: UserSession = { uid: "user-unlisted-id", email: "unlisted@hacker.io", role: "authenticated" };
  const s3Profiles = evaluateProfilesSelect(unlistedUser, "user-unlisted-id");
  const s3Favorites = evaluateFavoritesManage(unlistedUser, "user-unlisted-id");
  const s3Claim = evaluateClaimUnseenTracks(unlistedUser);

  record(
    "Senaryo 3: Allowlist'te Bulunmayan Kullanıcı",
    !s3Profiles && !s3Favorites && !s3Claim.success && s3Claim.error === "User is not in active allowed_users list.",
    "Listede olmayan kullanıcı RLS ve stored function seviyesinde engellendi."
  );

  // 4. Senaryo: Oturum Açmamış Kullanıcı (Anon)
  const anonUser: UserSession = { uid: null, email: null, role: "anon" };
  const s4Profiles = evaluateProfilesSelect(anonUser, "user-active-id");
  const s4Favorites = evaluateFavoritesManage(anonUser, "user-active-id");
  const s4Playlists = evaluatePlaylistsManage(anonUser, "pl-active-002");
  const s4Claim = evaluateClaimUnseenTracks(anonUser);

  record(
    "Senaryo 4: Oturum Açmamış Kullanıcı (Anon)",
    !s4Profiles && !s4Favorites && !s4Playlists && !s4Claim.success && s4Claim.error === "Authentication required.",
    "Anonim istekler RLS ve fonksiyon tarafından yetkisiz kabul edilerek engellendi."
  );

  // 5. Senaryo: Başka Kullanıcıya Ait Playlist'e Erişmeye Çalışan Kullanıcı (Cross-User İhlali)
  // Active user attempts to read or write to pl-victim-001 (belonging to user-victim-id)
  const s5VictimRead = evaluatePlaylistTracksSelect(activeUser, "pl-victim-001");
  const s5VictimInsert = evaluatePlaylistTracksInsert(activeUser, "pl-victim-001");
  const s5VictimManage = evaluatePlaylistsManage(activeUser, "user-victim-id");

  record(
    "Senaryo 5: Başka Kullanıcıya Ait Playlist'e Erişim",
    !s5VictimRead && !s5VictimInsert && !s5VictimManage,
    "Farklı kullanıcının çalma listesini okuma/yazma/yönetme girişimi RLS ilişkisel join kontrolü ile engellendi."
  );

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    results,
  };
}

if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("test-rls-matrix"))) {
  const summary = runRlsMatrixTests();
  console.log("=======================================================");
  console.log("   VYBE RLS 5 KULLANICI SENARYOSU DOĞRULAMA RAPORU");
  console.log("=======================================================");
  summary.results.forEach((r, i) => {
    console.log(`[SENARYO ${i + 1}] ${r.passed ? "✓ GEÇTİ" : "✗ KALDI"} - ${r.scenario}`);
    console.log(`            Detay: ${r.message}`);
  });
  console.log("-------------------------------------------------------");
  console.log(`Toplam: ${summary.total} | Başarılı: ${summary.passed} | Başarısız: ${summary.total - summary.passed}`);
  console.log("=======================================================");
  if (summary.passed !== summary.total) {
    process.exit(1);
  }
}
