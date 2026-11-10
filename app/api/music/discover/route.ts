import { NextRequest, NextResponse } from "next/server";
import { gatherSongs, termsFor } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";
import { takeUnseen } from "@/lib/music/unseen";
import type { Mood } from "@/types/music";

const MOODS = new Set<Mood>(["Happy", "Sad", "Chill", "Energetic", "Romantic", "Focus", "Nostalgic", "Dark"]);

export async function POST(request: NextRequest) {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const body = await request.json().catch(() => null) as { mood?: Mood } | null;
  if (!body?.mood || !MOODS.has(body.mood)) return NextResponse.json({ error: "Geçerli bir mood seç." }, { status: 400 });

  try {
    const pool = await gatherSongs(termsFor("mood", body.mood));
    if (!pool.length) {
      return NextResponse.json({ songs: [], exhausted: true, note: "Bu mood için parça bulunamadı." });
    }
    // Sadece 1 adet rastgele parça seçiyoruz (ekranda liste dolmayacak, doğrudan çalacak)
    const picked = await takeUnseen(supabase, pool, 1, `mood:${body.mood}`);
    if (picked.error) return NextResponse.json({ error: picked.error, songs: [] }, { status: 503 });
    return NextResponse.json({ songs: picked.songs, exhausted: picked.exhausted });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı.", songs: [] }, { status: 502 });
  }
}
