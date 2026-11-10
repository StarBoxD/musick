import type { Song } from "@/types/music";

/**
 * Audius API v1 Track schema subset relevant to streaming and licensing.
 * Based on official Audius API docs and response payload.
 */
export type AudiusTrack = {
  id?: string | number;
  track_id?: number;
  title?: string;
  genre?: string | null;
  duration?: number;
  permalink?: string;
  license?: string | null;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  is_unlisted?: boolean;
  is_available?: boolean;
  is_delete?: boolean;
  stream_conditions?: unknown;
  allowed_api_keys?: string[] | null;
  artwork?: Record<string, string> | null;
  access?: { stream?: boolean; download?: boolean } | null;
  user?: { name?: string; handle?: string; id?: string };
  stream?: { url?: string } | null;
};

export type FilterRejectionReason =
  | "INVALID_ID"
  | "NOT_STREAMABLE"
  | "UNAVAILABLE"
  | "DELETED"
  | "UNLISTED"
  | "STREAM_GATED"
  | "ACCESS_STREAM_DENIED"
  | "API_KEY_RESTRICTED"
  | "INVALID_DURATION"
  | "INVALID_STREAM_URL";

export type LicenseStatus = "VERIFIED" | "LICENSE_UNVERIFIED";

export type FilterDecision =
  | {
      allowed: true;
      licenseStatus: LicenseStatus;
      licenseLabel: string;
      rawLicense: string | null;
    }
  | {
      allowed: false;
      reason: FilterRejectionReason;
      details: string;
    };

/**
 * Verified license patterns defined in standard music schemas and Audius:
 * - "All Rights Reserved" (platform streaming terms and artist API permission apply)
 * - Creative Commons licenses (CC BY, CC BY-NC, CC BY-SA, CC BY-ND, CC BY-NC-SA, CC BY-NC-ND)
 * - Public Domain / CC0
 * - Open Music License (OML)
 */
const VERIFIED_LICENSE_PATTERNS: RegExp[] = [
  /^all\s*rights\s*reserved$/i,
  /^creative\s*commons\s*(attribution|cc\s*by)[\w\s.-]*$/i,
  /^cc\s*(by|by-nc|by-sa|by-nd|by-nc-sa|by-nc-nd)[\w\s.-]*$/i,
  /^public\s*domain$/i,
  /^cc0[\w\s.-]*$/i,
  /^open\s*music\s*license[\w\s.-]*$/i,
  /^oml[\w\s.-]*$/i,
];

/**
 * Evaluates license text strictly against verified schemas.
 * - If verified: returns VERIFIED status and normalized license text.
 * - If missing, empty, or unknown: classified as LICENSE_UNVERIFIED.
 * Does NOT assume missing metadata is royalty-free.
 */
export function verifyTrackLicense(rawLicense?: string | null): {
  status: LicenseStatus;
  label: string;
  raw: string | null;
} {
  if (!rawLicense || typeof rawLicense !== "string") {
    return {
      status: "LICENSE_UNVERIFIED",
      label: "Lisans Belirtilmemiş (Doğrulanmamış)",
      raw: null,
    };
  }

  const trimmed = rawLicense.trim();
  if (trimmed.length === 0) {
    return {
      status: "LICENSE_UNVERIFIED",
      label: "Lisans Belirtilmemiş (Doğrulanmamış)",
      raw: null,
    };
  }

  const matchesVerified = VERIFIED_LICENSE_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (matchesVerified) {
    return {
      status: "VERIFIED",
      label: trimmed,
      raw: trimmed,
    };
  }

  // Unknown license value: do not reject playback if technically allowed,
  // but do NOT classify as verified or royalty-free.
  return {
    status: "LICENSE_UNVERIFIED",
    label: `Doğrulanmamış Lisans: ${trimmed}`,
    raw: trimmed,
  };
}

/**
 * Logs rejection reasons safely without storing or exposing personal user data.
 */
export function logLicenseRejection(
  trackId: string | number | undefined,
  title: string | undefined,
  reason: FilterRejectionReason,
  details: string
): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[VYBE Filter] Track "${trackId || "unknown"}" (${title || "untitled"}) REJECTED: ${reason} - ${details}`);
  }
}

/**
 * Evaluates full Audius track metadata against API terms, license restrictions,
 * and stream accessibility.
 */
export function evaluateAudiusTrack(
  track: AudiusTrack,
  configuredApiKey = process.env.AUDIUS_API_KEY
): FilterDecision {
  // 1. Valid identifier
  if (track.id == null || String(track.id).trim() === "") {
    return { allowed: false, reason: "INVALID_ID", details: "Parça kimliği (ID) bulunamadı veya boş." };
  }

  // 2. Streamable permission from artist/platform (STRICT REQUIREMENT)
  if (track.is_streamable !== true) {
    return { allowed: false, reason: "NOT_STREAMABLE", details: "Sanatçı veya platform bu parçanın API üzerinden akışına izin vermiyor (is_streamable=false)." };
  }

  // 3. Network availability (STRICT REQUIREMENT)
  if (track.is_available === false) {
    return { allowed: false, reason: "UNAVAILABLE", details: "Parça Audius ağında kullanılamıyor veya moderasyon/senkronizasyon hatası var (is_available=false)." };
  }

  // 4. Deletion status (STRICT REQUIREMENT)
  if (track.is_delete === true) {
    return { allowed: false, reason: "DELETED", details: "Parça silinmiş olarak işaretlenmiş (is_delete=true)." };
  }

  // 5. Unlisted check
  if (track.is_unlisted === true) {
    return { allowed: false, reason: "UNLISTED", details: "Parça liste dışı (is_unlisted=true) olduğu için genel akışa alınamaz." };
  }

  // 6. Gated access check (NFT, tip, follow conditions) (STRICT REQUIREMENT)
  if (track.is_stream_gated === true || track.stream_conditions != null) {
    if (track.access?.stream !== true) {
      return { allowed: false, reason: "STREAM_GATED", details: "Parça özel erişim koşullarına (gated) tabi ve akış izni doğrulanmadı." };
    }
  }

  // 7. General access stream clearance
  if (track.access && track.access.stream === false) {
    return { allowed: false, reason: "ACCESS_STREAM_DENIED", details: "Kullanıcı veya istek için akış erişimi açıkça reddedilmiş (access.stream=false)." };
  }

  // 8. API key restrictions
  if (track.allowed_api_keys && track.allowed_api_keys.length > 0) {
    if (!configuredApiKey || !track.allowed_api_keys.includes(configuredApiKey)) {
      return { allowed: false, reason: "API_KEY_RESTRICTED", details: "Parça yalnızca belirli API anahtarlarıyla dinlenebilir." };
    }
  }

  // 9. Duration validity
  const duration = typeof track.duration === "number" ? track.duration : 0;
  if (!Number.isFinite(duration) || duration < 30) {
    return { allowed: false, reason: "INVALID_DURATION", details: "Parça süresi geçersiz veya tam bir şarkı için çok kısa (<30s)." };
  }

  // 10. License evaluation:
  // Missing or unverified license does NOT reject track from API streaming if technical
  // streaming permission (is_streamable, access.stream) is granted.
  // Instead, it is classified with precise status (VERIFIED vs LICENSE_UNVERIFIED).
  const licenseCheck = verifyTrackLicense(track.license);

  return {
    allowed: true,
    licenseStatus: licenseCheck.status,
    licenseLabel: licenseCheck.label,
    rawLicense: licenseCheck.raw,
  };
}

/**
 * Builds a verified Audius stream URL following documented REST API guidelines.
 */
export function buildVerifiedStreamUrl(trackId: string | number): string {
  const cleanId = encodeURIComponent(String(trackId).trim());
  return `https://api.audius.co/v1/tracks/${cleanId}/stream?app_name=VYBE`;
}

/**
 * Validates whether a streaming URL meets strict HTTPS Audius stream standards.
 */
export function isValidStreamUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const isAudiusApi = parsed.hostname.endsWith("audius.co") && parsed.pathname.includes("/stream");
    const isAudiusCdn = parsed.hostname.includes("audius") && (parsed.pathname.includes("/stream") || parsed.pathname.includes("/tracks/cidstream"));
    return isAudiusApi || isAudiusCdn;
  } catch {
    return false;
  }
}

/**
 * Converts a raw Audius track to a Song object if and only if it passes all filters.
 */
export function sanitizeAudiusTrackToSong(track: AudiusTrack): Song | null {
  const decision = evaluateAudiusTrack(track);
  if (!decision.allowed) {
    logLicenseRejection(track.id, track.title, decision.reason, decision.details);
    return null;
  }

  const id = String(track.id).trim();
  const streamUrl = buildVerifiedStreamUrl(id);
  if (!isValidStreamUrl(streamUrl)) {
    logLicenseRejection(track.id, track.title, "INVALID_STREAM_URL", "Geçerli bir akış URL'si üretilemedi.");
    return null;
  }

  const path = track.permalink ?? "";
  const permalink = path.startsWith("http")
    ? path
    : `https://audius.co${path.startsWith("/") ? "" : "/"}${path}`;

  return {
    trackId: id,
    title: track.title?.trim() || "İsimsiz Parça",
    artist: track.user?.name?.trim() || track.user?.handle?.trim() || "Bilinmeyen Sanatçı",
    album: "Audius",
    artwork: track.artwork?.["480x480"] || track.artwork?.["1000x1000"] || track.artwork?.["150x150"] || "",
    streamUrl,
    durationSeconds: Math.round(track.duration || 0),
    genre: track.genre?.trim() || "Müzik",
    sourceUrl: permalink,
    license: decision.licenseLabel,
    provider: "audius",
  };
}
