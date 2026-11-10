import type { Song } from "@/types/music";
import {
  type AudiusTrack,
  evaluateAudiusTrack,
  sanitizeAudiusTrackToSong,
  verifyTrackLicense,
} from "@/lib/music/license-filter";

const API = "https://api.audius.co/v1";

/**
 * Validates a license string according to verified schemas.
 * Safe default: returns empty string if unverified.
 */
export function acceptedLicense(license?: string | null): string {
  const check = verifyTrackLicense(license);
  return check.status === "VERIFIED" ? check.label : "";
}

/**
 * Checks whether an Audius track passes license and access requirements.
 */
export function isPlayable(track: AudiusTrack): boolean {
  return evaluateAudiusTrack(track).allowed;
}

/**
 * Safe fetch wrapper for Audius API.
 * In case of API failure, throws a clean error so caller can fail closed safely.
 */
async function audiusGet(path: string, params: Record<string, string>) {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set("app_name", "VYBE");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (process.env.AUDIUS_API_KEY) {
    headers["x-api-key"] = process.env.AUDIUS_API_KEY;
  }

  try {
    const response = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error(`Audius API ${response.status} hatası döndürdü.`);
    }
    const payload = await response.json();
    return payload?.data;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[VYBE] Audius API request failed for path "${path}":`, error);
    }
    throw error;
  }
}

async function searchTracks(query: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  // Sayfalama yaparak yeterli lisanslı parça topla
  for (const offset of ["0", "50", "100", "150"]) {
    try {
      const page = await audiusGet("tracks/search", { query, limit: "50", offset });
      if (!Array.isArray(page) || page.length === 0) break;
      rows.push(...page);
      const licensedCount = rows.filter((t) => isPlayable(t as AudiusTrack)).length;
      if (licensedCount >= 12) break;
    } catch {
      // API sayfa hatası durumunda döngüyü kes, eldeki güvenli sonuçları kullan
      break;
    }
  }
  return rows;
}

function collectVerifiedSongs(rows: unknown, into: Map<string, Song>): void {
  if (!Array.isArray(rows)) return;
  rows.forEach((track) => {
    const verifiedSong = sanitizeAudiusTrackToSong(track as AudiusTrack);
    if (verifiedSong) {
      into.set(verifiedSong.trackId, verifiedSong);
    }
  });
}

/**
 * Searches Audius for tracks that strictly satisfy licensing and streaming rules.
 */
export async function searchAudius(query: string, includeArtists = false): Promise<Song[]> {
  const tracks = await searchTracks(query);
  const unique = new Map<string, Song>();
  collectVerifiedSongs(tracks, unique);

  if (!includeArtists) return [...unique.values()];

  const users = await audiusGet("users/search", { query, limit: "3" }).catch(() => []);
  const people = Array.isArray(users) ? users.slice(0, 3) : [];
  const extra = await Promise.all(
    people.map((user: { id?: string }) =>
      user.id
        ? audiusGet(`users/${encodeURIComponent(user.id)}/tracks`, { limit: "15" }).catch(() => [])
        : []
    )
  );
  extra.forEach((rows) => collectVerifiedSongs(rows, unique));

  return [...unique.values()];
}

/**
 * Gathers verified tracks for an array of search terms.
 */
export async function gatherSongs(terms: string[]): Promise<Song[]> {
  const batches = await Promise.all(
    terms.map((term) => searchAudius(term).catch(() => [] as Song[]))
  );
  const unique = new Map<string, Song>();
  batches.flat().forEach((song) => unique.set(song.trackId, song));
  return [...unique.values()];
}
