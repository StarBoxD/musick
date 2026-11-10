import type { SupabaseClient } from "@supabase/supabase-js";
import type { Song } from "@/types/music";
import { gatherSongs } from "@/lib/music/audius-server";
import { takeUnseen, type UnseenResult } from "@/lib/music/unseen";

export { gatherSongs, searchAudius } from "@/lib/music/audius-server";
export { termsFor } from "@/lib/music/moods";

const SAMPLE_SIZE = 4;

function sampleTerms(terms: string[], size: number): string[] {
  if (terms.length <= size) return terms;
  const copy = [...terms];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, size);
}

/**
 * Picks unheard songs from a random subset of search terms, so each request hits Audius a few times
 * instead of once per term. Falls back to every term before reporting the pool as exhausted.
 */
export async function pickFreshSongs(
  supabase: SupabaseClient,
  terms: string[],
  take: number,
  source: string,
  refine: (songs: Song[]) => Song[] = (songs) => songs
): Promise<UnseenResult> {
  const sampled = sampleTerms(terms, SAMPLE_SIZE);
  const first = await takeUnseen(supabase, refine(await gatherSongs(sampled)), take, source);
  if (first.error || !first.exhausted || sampled.length === terms.length) return first;
  const rest = terms.filter((term) => !sampled.includes(term));
  return takeUnseen(supabase, refine(await gatherSongs(rest)), take, source);
}
