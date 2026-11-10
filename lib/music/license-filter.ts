import type { Song } from "@/types/music";
import {
  type AudiusTrack,
  type FilterDecision,
  type FilterRejectionReason,
  type LicenseStatus,
  logLicenseRejection,
  verifyTrackLicense,
} from "@/lib/music/license-types";
import {
  buildVerifiedStreamUrl,
  isGenuineAudiusHostname,
  isValidStreamUrl,
} from "@/lib/music/stream-url";

export type {
  AudiusTrack,
  FilterDecision,
  FilterRejectionReason,
  LicenseStatus,
};
export {
  buildVerifiedStreamUrl,
  isGenuineAudiusHostname,
  isValidStreamUrl,
  logLicenseRejection,
  verifyTrackLicense,
};

/**
 * Evaluates full Audius track metadata against API terms, license restrictions,
 * and stream accessibility.
 */
export function evaluateAudiusTrack(
  track: AudiusTrack,
  configuredApiKey = process.env.AUDIUS_API_KEY
): FilterDecision {
  if (track.id == null || String(track.id).trim() === "") {
    return { allowed: false, reason: "INVALID_ID", details: "Parça kimliği (ID) bulunamadı veya boş." };
  }

  if (track.is_streamable !== true) {
    return {
      allowed: false,
      reason: "NOT_STREAMABLE",
      details: "Sanatçı veya platform bu parçanın API üzerinden akışına izin vermiyor (is_streamable=false).",
    };
  }

  if (track.is_available === false) {
    return {
      allowed: false,
      reason: "UNAVAILABLE",
      details: "Parça Audius ağında kullanılamıyor veya moderasyon/senkronizasyon hatası var (is_available=false).",
    };
  }

  if (track.is_delete === true) {
    return { allowed: false, reason: "DELETED", details: "Parça silinmiş olarak işaretlenmiş (is_delete=true)." };
  }

  if (track.is_unlisted === true) {
    return {
      allowed: false,
      reason: "UNLISTED",
      details: "Parça liste dışı (is_unlisted=true) olduğu için genel akışa alınamaz.",
    };
  }

  if (track.is_stream_gated === true || track.stream_conditions != null) {
    if (track.access?.stream !== true) {
      return {
        allowed: false,
        reason: "STREAM_GATED",
        details: "Parça özel erişim koşullarına (gated) tabi ve akış izni doğrulanmadı.",
      };
    }
  }

  if (track.access && track.access.stream === false) {
    return {
      allowed: false,
      reason: "ACCESS_STREAM_DENIED",
      details: "Kullanıcı veya istek için akış erişimi açıkça reddedilmiş (access.stream=false).",
    };
  }

  if (track.allowed_api_keys && track.allowed_api_keys.length > 0) {
    if (!configuredApiKey || !track.allowed_api_keys.includes(configuredApiKey)) {
      return {
        allowed: false,
        reason: "API_KEY_RESTRICTED",
        details: "Parça yalnızca belirli API anahtarlarıyla dinlenebilir.",
      };
    }
  }

  const duration = typeof track.duration === "number" ? track.duration : 0;
  if (!Number.isFinite(duration) || duration < 30) {
    return {
      allowed: false,
      reason: "INVALID_DURATION",
      details: "Parça süresi geçersiz veya tam bir şarkı için çok kısa (<30s).",
    };
  }

  const licenseCheck = verifyTrackLicense(track.license);

  return {
    allowed: true,
    licenseStatus: licenseCheck.status,
    licenseLabel: licenseCheck.label,
    rawLicense: licenseCheck.raw,
  };
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
