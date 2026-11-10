import { NextResponse } from "next/server";
import { gatherSongs, termsFor } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";
import { takeUnseen } from "@/lib/music/unseen";

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
    const [niche, popular] = await Promise.all([gatherSongs(termsFor("gems")), gatherSongs(termsFor("popular"))]);
    const popularIds = new Set(popular.map((song) => song.trackId));
    const pool = niche.filter((song) => !popularIds.has(song.trackId));
    const picked = await takeUnseen(supabase, pool, 8, "gems");
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
