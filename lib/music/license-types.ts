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
export const VERIFIED_LICENSE_PATTERNS: RegExp[] = [
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
    console.warn(
      `[VYBE Filter] Track "${trackId || "unknown"}" (${title || "untitled"}) REJECTED: ${reason} - ${details}`
    );
  }
}
