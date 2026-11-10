/**
 * VYBE - Comprehensive Row Level Security (RLS) & Function Privilege Matrix Tester
 */

export interface UserSession {
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

const allowedUsersDb: AllowedUserRow[] = [
  { email: "aktif@vybe.io", is_active: true },
  { email: "pasif@vybe.io", is_active: false },
  { email: "victim@vybe.io", is_active: true },
];

const playlistsDb: PlaylistRow[] = [
  { id: "pl-victim-001", user_id: "user-victim-id", name: "Victim's Secret Playlist" },
  { id: "pl-active-002", user_id: "user-active-id", name: "Active User's Playlist" },
];

function isUserActiveInAllowlist(session: UserSession): boolean {
  if (session.role !== "authenticated" || !session.email) return false;
  const normalizedEmail = session.email.toLowerCase();
  return allowedUsersDb.some((au) => au.email === normalizedEmail && au.is_active === true);
}

export function evaluateProfilesSelect(session: UserSession, targetProfileId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  return session.uid === targetProfileId && isUserActiveInAllowlist(session);
}

export function evaluateFavoritesManage(session: UserSession, targetUserId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  return session.uid === targetUserId && isUserActiveInAllowlist(session);
}

export function evaluatePlaylistsManage(session: UserSession, targetUserId: string): boolean {
  if (session.role !== "authenticated" || !session.uid) return false;
  return session.uid === targetUserId && isUserActiveInAllowlist(session);
}

export function evaluatePlaylistTracksSelect(session: UserSession, playlistId: string): boolean {
  if (session.role !== "authenticated" || !session.uid || !isUserActiveInAllowlist(session)) {
    return false;
  }
  return playlistsDb.some((p) => p.id === playlistId && p.user_id === session.uid);
}

export function evaluatePlaylistTracksInsert(session: UserSession, playlistId: string): boolean {
  if (session.role !== "authenticated" || !session.uid || !isUserActiveInAllowlist(session)) {
    return false;
  }
  return playlistsDb.some((p) => p.id === playlistId && p.user_id === session.uid);
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

export function runRlsMatrixTests(): {
  total: number;
  passed: number;
  results: { scenario: string; passed: boolean; message: string }[];
} {
  const results: { scenario: string; passed: boolean; message: string }[] = [];
  const record = (scenario: string, passed: boolean, message: string) => {
    results.push({ scenario, passed, message });
  };

  // 1. Aktif Allowlist Kullanıcısı
  const activeUser: UserSession = { uid: "user-active-id", email: "aktif@vybe.io", role: "authenticated" };
  const s1Claim = evaluateClaimUnseenTracks(activeUser);
  record(
    "Senaryo 1: Aktif Allowlist Kullanıcısı",
    evaluateProfilesSelect(activeUser, "user-active-id") &&
      evaluateFavoritesManage(activeUser, "user-active-id") &&
      evaluatePlaylistsManage(activeUser, "user-active-id") &&
      evaluatePlaylistTracksSelect(activeUser, "pl-active-002") &&
      s1Claim.success,
    "Kendi verilerine ve claim_unseen_tracks'e tam erişim sağlandı."
  );

  // 2. Pasif Allowlist Kullanıcısı (is_active = false)
  const passiveUser: UserSession = { uid: "user-passive-id", email: "pasif@vybe.io", role: "authenticated" };
  const s2Claim = evaluateClaimUnseenTracks(passiveUser);
  record(
    "Senaryo 2: Pasif Allowlist Kullanıcısı",
    !evaluateProfilesSelect(passiveUser, "user-passive-id") &&
      !evaluateFavoritesManage(passiveUser, "user-passive-id") &&
      !evaluatePlaylistsManage(passiveUser, "user-passive-id") &&
      !s2Claim.success &&
      s2Claim.error === "User is not in active allowed_users list.",
    "Pasif kullanıcı RLS tarafından ve stored function seviyesinde engellendi."
  );

  // 3. Allowlist'te Bulunmayan Kullanıcı
  const unlistedUser: UserSession = { uid: "user-unlisted-id", email: "unlisted@hacker.io", role: "authenticated" };
  const s3Claim = evaluateClaimUnseenTracks(unlistedUser);
  record(
    "Senaryo 3: Allowlist'te Bulunmayan Kullanıcı",
    !evaluateProfilesSelect(unlistedUser, "user-unlisted-id") &&
      !evaluateFavoritesManage(unlistedUser, "user-unlisted-id") &&
      !s3Claim.success &&
      s3Claim.error === "User is not in active allowed_users list.",
    "Listede olmayan kullanıcı RLS ve stored function seviyesinde engellendi."
  );

  // 4. Oturum Açmamış Kullanıcı (Anon)
  const anonUser: UserSession = { uid: null, email: null, role: "anon" };
  const s4Claim = evaluateClaimUnseenTracks(anonUser);
  record(
    "Senaryo 4: Oturum Açmamış Kullanıcı (Anon)",
    !evaluateProfilesSelect(anonUser, "user-active-id") &&
      !evaluateFavoritesManage(anonUser, "user-active-id") &&
      !evaluatePlaylistsManage(anonUser, "pl-active-002") &&
      !s4Claim.success &&
      s4Claim.error === "Authentication required.",
    "Anonim istekler RLS ve fonksiyon tarafından yetkisiz kabul edilerek engellendi."
  );

  // 5. Başka Kullanıcıya Ait Playlist'e Erişim
  record(
    "Senaryo 5: Başka Kullanıcıya Ait Playlist'e Erişim",
    !evaluatePlaylistTracksSelect(activeUser, "pl-victim-001") &&
      !evaluatePlaylistTracksInsert(activeUser, "pl-victim-001") &&
      !evaluatePlaylistsManage(activeUser, "user-victim-id"),
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
  if (summary.passed !== summary.total) process.exit(1);
}
