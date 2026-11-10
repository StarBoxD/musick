import { NextResponse } from "next/server";
import { gatherSongs, pickFreshSongs, termsFor } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";

export async function GET() {
  return handleGems();
}

export async function POST() {
  return handleGems();
}

async function handleGems() {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  try {
    const popularIds = new Set((await gatherSongs(termsFor("popular"))).map((song) => song.trackId));
    const picked = await pickFreshSongs(supabase, termsFor("gems"), 8, "gems", (songs) =>
      songs.filter((song) => !popularIds.has(song.trackId))
    );
    if (picked.error) return NextResponse.json({ error: picked.error, songs: [] }, { status: 503 });
    return NextResponse.json({
      songs: picked.songs,
      exhausted: picked.exhausted,
      note: "Akış ve lisans filtrelerinden başarıyla geçen alternatif Türkçe Audius parçaları. Popüler listelerle çakışanlar elendi.",
    });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı.", songs: [] }, { status: 502 });
  }
}
