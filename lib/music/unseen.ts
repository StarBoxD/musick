import type { SupabaseClient } from "@supabase/supabase-js";
import type { Song } from "@/types/music";

type Db = SupabaseClient;

function missingFeature(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message ?? ""}`;
  return /claim_unseen_tracks|seen_tracks|schema cache|does not exist|42P01|PGRST205|42883/i.test(text);
}

function shuffle(songs: Song[]) {
  const copy = [...songs];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export async function takeUnseen(supabase: Db, pool: Song[], take: number, source: string) {
  if (!pool.length) return { songs: [] as Song[], exhausted: false, error: undefined };
  
  // Önce kullanıcının gerçekten dinlediği (seen_tracks) şarkıları filtreliyoruz ama henüz dinlenmemiş şarkıyı hemen DB'ye kaydetmiyoruz!
  const shuffled = shuffle(pool);
  const trackIds = shuffled.map((s) => s.trackId);
  
  const { data: seenRows, error } = await supabase
    .from("seen_tracks")
    .select("track_id")
    .in("track_id", trackIds.slice(0, 50));
    
  const seenSet = new Set((seenRows ?? []).map((r: { track_id: string }) => r.track_id));
  const fresh = shuffled.filter((s) => !seenSet.has(s.trackId)).slice(0, take);
  
  // Eğer havuz bittiyse bile kullanıcıyı müziksiz bırakma, rastgele şarkı çal
  const songs = fresh.length > 0 ? fresh : shuffled.slice(0, take);
  return { songs, exhausted: false, error: undefined };
}
