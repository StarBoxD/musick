import { NextResponse } from "next/server";
import { guardMusic } from "@/lib/music/session";
import type { Song } from "@/types/music";

export async function GET() {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const favorites = await supabase.from("favorites").select("song").eq("user_id", user.id);
  if (favorites.error) return NextResponse.json({ error: "Favoriler okunamadı." }, { status: 500 });
  const songs = (favorites.data ?? []).map((row) => row.song as Song);
  const groups = new Map<string, Song[]>();
  songs.forEach((song) => {
    const list = groups.get(song.genre) ?? [];
    list.push(song);
    groups.set(song.genre, list);
  });
  const suggestions = [...groups.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([genre, list]) => ({ name: `${genre} VYBE`, songs: list }));
  return NextResponse.json({
    suggestions,
    note: suggestions.length
      ? "Öneriler favori parçalarının türüne göre kuruldu. Dinleme süresi verisi yok."
      : "Otomatik liste için aynı türden en az iki favori gerekli.",
  });
}
