import { NextResponse } from "next/server";
import { gatherSongs } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";
import { takeUnseen } from "@/lib/music/unseen";
import type { Song } from "@/types/music";

function topKeys(songs: Song[], key: "artist" | "genre") {
  const counts = new Map<string, number>();
  songs.forEach((song) => counts.set(song[key], (counts.get(song[key]) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
}

export async function GET() {
  return handleMatch();
}

export async function POST() {
  return handleMatch();
}

async function handleMatch() {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const favorites = await supabase.from("favorites").select("song").eq("user_id", user.id);
  if (favorites.error) return NextResponse.json({ error: "Favoriler okunamadı." }, { status: 500 });
  const liked = (favorites.data ?? []).map((row) => row.song as Song);
  if (!liked.length) return NextResponse.json({ ready: false, songs: [], artists: [], note: "Zevk analizi için en az bir favori şarkı gerekli." });

  const artists = topKeys(liked, "artist");
  const genres = topKeys(liked, "genre");
  try {
    const picked = await takeUnseen(supabase, await gatherSongs([...artists, ...genres]), 8, "match");
    if (picked.error) return NextResponse.json({ error: picked.error, songs: [] }, { status: 503 });
    return NextResponse.json({ ready: true, artists, genres, songs: picked.songs, exhausted: picked.exhausted });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı.", songs: [] }, { status: 502 });
  }
}
