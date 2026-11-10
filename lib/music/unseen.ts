import type { SupabaseClient } from "@supabase/supabase-js";
import type { Song } from "@/types/music";

type Db = SupabaseClient;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Splits an array into chunks of a given size.
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export type UnseenResult = {
  songs: Song[];
  exhausted: boolean;
  error?: string;
};

/**
 * Filters out tracks the user has already listened to (seen_tracks) across
 * all candidate track IDs without limiting checks to only the first 50.
 *
 * If no fresh tracks remain in the pool, sets exhausted: true and does NOT
 * silently present previously heard songs as fresh.
 */
export async function takeUnseen(
  supabase: Db,
  pool: Song[],
  take: number,
  source: string
): Promise<UnseenResult> {
  if (!pool.length) {
    return { songs: [], exhausted: true, error: undefined };
  }

  // Deduplicate pool by trackId
  const uniquePoolMap = new Map<string, Song>();
  pool.forEach((s) => {
    if (s.trackId && !uniquePoolMap.has(s.trackId)) {
      uniquePoolMap.set(s.trackId, s);
    }
  });
  const uniquePool = [...uniquePoolMap.values()];
  const trackIds = uniquePool.map((s) => s.trackId);

  // Query seen_tracks in chunks of 100 to avoid PostgREST query length limits
  const chunks = chunkArray(trackIds, 100);
  const seenSet = new Set<string>();

  try {
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("seen_tracks")
        .select("track_id")
        .in("track_id", chunk);

      if (error) {
        // If seen_tracks table is temporarily unavailable or missing, pass through error safely
        return {
          songs: [],
          exhausted: false,
          error: `Dinleme geçmişi sorgulanamadı: ${error.message}`,
        };
      }

      if (Array.isArray(data)) {
        data.forEach((row: { track_id: string }) => seenSet.add(row.track_id));
      }
    }
  } catch (err: unknown) {
    return {
      songs: [],
      exhausted: false,
      error: `Veritabanı bağlantı hatası: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Filter out any track already heard
  const unseenPool = uniquePool.filter((song) => !seenSet.has(song.trackId));

  if (unseenPool.length === 0) {
    // All songs in this pool have been heard.
    // Truthful report: do not silently present seen songs as new.
    return {
      songs: [],
      exhausted: true,
      error: undefined,
    };
  }

  const shuffled = shuffle(unseenPool);
  const picked = shuffled.slice(0, take);

  return {
    songs: picked,
    exhausted: false,
    error: undefined,
  };
}
