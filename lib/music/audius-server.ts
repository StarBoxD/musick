import type { Song } from "@/types/music";

type AudiusTrack = {
  id?: string | number;
  title?: string;
  genre?: string | null;
  duration?: number;
  permalink?: string;
  license?: string | null;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  is_unlisted?: boolean;
  stream_conditions?: unknown;
  allowed_api_keys?: string[] | null;
  artwork?: Record<string, string> | null;
  access?: { stream?: boolean } | null;
  user?: { name?: string; handle?: string; id?: string };
  stream?: { url?: string } | null;
};

const API = "https://api.audius.co/v1";

/** Explicit third-party playback only. Blank and "all rights reserved" stay out. */
export function acceptedLicense(license?: string | null) {
  const value = license?.trim() ?? "";
  if (!value || /all rights reserved/i.test(value)) return null;
  if (/non-?commercial|\bnc\b|by-nc/i.test(value)) return null;
  if (/open music license|\bOML\b/i.test(value)) return value;
  if (/\bcc0\b|public domain/i.test(value)) return value;
  if (/cc by(?!-nc)\b/i.test(value)) return value;
  if (/^attribution(?!-noncommercial)/i.test(value)) return value;
  return null;
}

function playable(track: AudiusTrack) {
  const keys = track.allowed_api_keys;
  const ownKey = process.env.AUDIUS_API_KEY;
  const keyOk = !keys?.length || Boolean(ownKey && keys.includes(ownKey));
  return Boolean(
    acceptedLicense(track.license) &&
    track.id != null &&
    track.is_streamable === true &&
    track.is_stream_gated !== true &&
    track.is_unlisted !== true &&
    !track.stream_conditions &&
    track.access?.stream === true &&
    track.stream?.url &&
    (track.duration ?? 0) > 45 &&
    keyOk
  );
}

function toSong(track: AudiusTrack): Song | null {
  if (!playable(track)) return null;
  const id = String(track.id);
  const path = track.permalink ?? "";
  const permalink = path.startsWith("http")
    ? path
    : `https://audius.co${path.startsWith("/") ? "" : "/"}${path}`;
  return {
    trackId: id,
    title: track.title || "İsimsiz parça",
    artist: track.user?.name || track.user?.handle || "Bilinmeyen sanatçı",
    album: "Audius",
    artwork: track.artwork?.["480x480"] || track.artwork?.["1000x1000"] || track.artwork?.["150x150"] || "",
    streamUrl: `${API}/tracks/${encodeURIComponent(id)}/stream?app_name=VYBE`,
    durationSeconds: Math.round(track.duration || 0),
    genre: track.genre || "Müzik",
    sourceUrl: permalink,
    license: acceptedLicense(track.license) || "",
    provider: "audius",
  };
}

async function audiusGet(path: string, params: Record<string, string>) {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set("app_name", "VYBE");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const headers: Record<string, string> = {};
  if (process.env.AUDIUS_API_KEY) headers["x-api-key"] = process.env.AUDIUS_API_KEY;
  const response = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!response.ok) throw new Error("Audius yanıt vermedi.");
  const payload = await response.json();
  return payload?.data;
}

async function searchTracks(query: string) {
  const rows: unknown[] = [];
  for (const offset of ["0", "50", "100", "150"]) {
    const page = await audiusGet("tracks/search", { query, limit: "50", offset });
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    const licensed = rows.filter((track) => playable(track as AudiusTrack)).length;
    if (licensed >= 12) break;
  }
  return rows;
}

function collect(rows: unknown, into: Map<string, Song>) {
  if (!Array.isArray(rows)) return;
  rows.forEach((track) => {
    const song = toSong(track as AudiusTrack);
    if (song) into.set(song.trackId, song);
  });
}

export async function searchAudius(query: string, includeArtists = false) {
  const tracks = await searchTracks(query);
  const unique = new Map<string, Song>();
  collect(tracks, unique);
  if (!includeArtists) return [...unique.values()];

  const users = await audiusGet("users/search", { query, limit: "3" }).catch(() => []);
  const people = Array.isArray(users) ? users.slice(0, 3) : [];
  const extra = await Promise.all(people.map((user: { id?: string }) => (
    user.id ? audiusGet(`users/${encodeURIComponent(user.id)}/tracks`, { limit: "15" }).catch(() => []) : []
  )));
  extra.forEach((rows) => collect(rows, unique));
  return [...unique.values()];
}

export async function gatherSongs(terms: string[]) {
  const batches = await Promise.all(terms.map((term) => searchAudius(term).catch(() => [] as Song[])));
  const unique = new Map<string, Song>();
  batches.flat().forEach((song) => unique.set(song.trackId, song));
  return [...unique.values()];
}
