import { NextResponse } from "next/server";
import { gatherSongs, termsFor } from "@/lib/music/catalog";
import { guardMusic, istanbulDay } from "@/lib/music/session";
import { takeUnseen } from "@/lib/music/unseen";
import type { Song } from "@/types/music";

export async function GET() {
  return handleDaily();
}

export async function POST() {
  return handleDaily();
}

async function handleDaily() {
  const { user, supabase, denied } = await guardMusic();
  if (denied || !user || !supabase) return denied ?? NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const day = istanbulDay();
  const existing = await supabase.from("daily_vybes").select("song").eq("user_id", user.id).eq("day", day).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "Günlük tablo yok. SQL migration henüz çalışmamış." }, { status: 503 });
  if (existing.data?.song) return NextResponse.json({ song: existing.data.song as Song, day, exhausted: false });

  try {
    const picked = await takeUnseen(supabase, await gatherSongs(termsFor("daily")), 1, "daily");
    if (picked.error) return NextResponse.json({ error: picked.error }, { status: 503 });
    const song = picked.songs[0];
    if (!song) return NextResponse.json({ song: null, day, exhausted: true });
    const saved = await supabase.from("daily_vybes").insert({ user_id: user.id, day, track_id: song.trackId, song });
    if (saved.error) {
      const again = await supabase.from("daily_vybes").select("song").eq("user_id", user.id).eq("day", day).maybeSingle();
      if (again.data?.song) return NextResponse.json({ song: again.data.song as Song, day, exhausted: false });
      return NextResponse.json({ error: "Günün şarkısı kaydedilemedi." }, { status: 500 });
    }
    return NextResponse.json({ song, day, exhausted: false });
  } catch {
    return NextResponse.json({ error: "Audius'a ulaşılamadı." }, { status: 502 });
  }
}
