import { NextRequest, NextResponse } from "next/server";
import { pickFreshSongs, termsFor } from "@/lib/music/catalog";
import { guardMusic } from "@/lib/music/session";
import type { Mood } from "@/types/music";

const MOODS = new Set<Mood>(["Happy", "Sad", "Chill", "Energetic", "Romantic", "Focus", "Nostalgic", "Dark"]);

export async function POST(request: NextRequest) {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const body = await request.json().catch(() => null) as { mood?: Mood } | null;
  if (!body?.mood || !MOODS.has(body.mood)) return NextResponse.json({ error: "Geçerli bir mood seç." }, { status: 400 });

  try {
    // Sadece 1 adet rastgele parça seçiyoruz (ekranda liste dolmayacak, doğrudan çalacak)
    const picked = await pickFreshSongs(supabase, termsFor("mood", body.mood), 1, `mood:${body.mood}`);
    if (picked.error) return NextResponse.json({ error: picked.error, songs: [] }, { status: 503 });
    return NextResponse.json({ songs: picked.songs, exhausted: picked.exhausted });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı.", songs: [] }, { status: 502 });
  }
}
