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
  const { data, error } = await supabase.rpc("claim_unseen_tracks", {
    p_tracks: shuffle(pool),
    p_take: take,
    p_source: source,
  });
  if (missingFeature(error)) {
    return { songs: [] as Song[], exhausted: false, error: "Keşif tablosu yok. SQL migration henüz çalışmamış." };
  }
  if (error) return { songs: [] as Song[], exhausted: false, error: "Gösterilen şarkı kaydedilemedi." };
  const songs = (Array.isArray(data) ? data : []) as Song[];
  return { songs, exhausted: songs.length === 0, error: undefined };
}
