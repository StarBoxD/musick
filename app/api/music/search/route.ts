import { NextRequest, NextResponse } from "next/server";
import { searchAudius } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";
import { takeUnseen } from "@/lib/music/unseen";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "Arama terimi gerekli." }, { status: 400 });
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  try {
    const songs = await searchAudius(query, true);
    if (!songs.length) {
      return NextResponse.json({
        results: [],
        exhausted: true,
        note: "Bu arama kriterine uygun ve akış koşullarını sağlayan parça bulunamadı.",
      });
    }
    const picked = await takeUnseen(supabase, songs, 12, "search");
    if (picked.error) return NextResponse.json({ error: picked.error, results: [] }, { status: 503 });
    return NextResponse.json({ results: picked.songs, exhausted: picked.exhausted });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı." }, { status: 502 });
  }
}
