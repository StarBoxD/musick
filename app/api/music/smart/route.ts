import { NextResponse } from "next/server";
import { guardMusic } from "@/lib/music/session";
import type { SmartList, Song } from "@/types/music";

function dedupeSongs(songs: Song[]): Song[] {
  const map = new Map<string, Song>();
  songs.forEach((s) => {
    if (s.trackId && !map.has(s.trackId)) {
      map.set(s.trackId, s);
    }
  });
  return [...map.values()];
}

async function handleSmartLists() {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) {
    return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const favorites = await supabase
    .from("favorites")
    .select("song")
    .eq("user_id", user.id);

  if (favorites.error) {
    return NextResponse.json({ error: "Favoriler okunamadı." }, { status: 500 });
  }

  const rawSongs = (favorites.data ?? []).map((row) => row.song as Song);
  const songs = dedupeSongs(rawSongs);

  if (songs.length < 2) {
    return NextResponse.json({
      suggestions: [] as SmartList[],
      note: "Akıllı listeler favorilerinizdeki ortak tür ve sanatçılara göre kurgulanır. En az 2 favori parça ekleyin.",
    });
  }

  const suggestions: SmartList[] = [];
  const usedListNames = new Set<string>();

  // 1. Tür (Genre) Bazlı Gruplama
  const genreGroups = new Map<string, Song[]>();
  songs.forEach((song) => {
    const genre = song.genre?.trim() || "Diğer";
    const list = genreGroups.get(genre) ?? [];
    list.push(song);
    genreGroups.set(genre, list);
  });

  for (const [genre, group] of genreGroups.entries()) {
    if (group.length >= 2) {
      const name = `${genre} Frekansı`;
      suggestions.push({ name, songs: group });
      usedListNames.add(name);
    }
  }

  // 2. Sanatçı (Artist) Bazlı Gruplama
  const artistGroups = new Map<string, Song[]>();
  songs.forEach((song) => {
    const artist = song.artist?.trim() || "Bilinmeyen";
    const list = artistGroups.get(artist) ?? [];
    list.push(song);
    artistGroups.set(artist, list);
  });

  for (const [artist, group] of artistGroups.entries()) {
    if (group.length >= 2) {
      const name = `${artist} Özel Seçkisi`;
      if (!usedListNames.has(name)) {
        suggestions.push({ name, songs: group });
        usedListNames.add(name);
      }
    }
  }

  return NextResponse.json({
    suggestions,
    note: suggestions.length
      ? "Koleksiyonlar favorilerinizdeki gerçek tür ve sanatçı dağılımına göre derlendi."
      : "Ortak tür veya sanatçıya sahip en az iki favori parça gerekli.",
  });
}

export async function GET() {
  return handleSmartLists();
}

export async function POST() {
  return handleSmartLists();
}
