"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import type { Song } from "@/types/music";
import { isValidStreamUrl } from "@/lib/music/license-filter";

type Props = { song: Song | null; onClose: () => void; onPrev: () => void; onNext: () => void };

function clock(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function MiniPlayer({ song, onClose, onPrev, onNext }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listenedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [full, setFull] = useState(false);
  const [error, setError] = useState("");

  const markAsListened = async (s: Song) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("seen_tracks").upsert(
        { user_id: user.id, track_id: s.trackId, song: s, source: "listened" },
        { onConflict: "user_id,track_id" }
      );
    } catch {
      // sessizce geç
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    listenedRef.current = false;
    setPlaying(false); setTime(0); setDuration(0); setFull(false); setError("");
    if (!audio || !song) return;

    // Lisans ve akış URL'si güvenlik doğrulaması
    if (!song.streamUrl || !isValidStreamUrl(song.streamUrl)) {
      setError("Geçerli bir akış adresi doğrulanamadı.");
      return;
    }
    if (!song.license || song.license.trim() === "") {
      setError("Lisans bilgisi doğrulanamayan parça oynatılamaz.");
      return;
    }

    audio.src = song.streamUrl;
    audio.volume = volume;
    audio.play().then(() => setPlaying(true)).catch(() => setError("Oynatma başlamadı. Play'e bas."));
  }, [song]);

  if (!song) return null;
  const audio = audioRef.current;
  const toggle = async () => {
    if (!audio || error.includes("doğrulanamadı")) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); setError(""); } catch { setError("Akış başlatılamadı."); setPlaying(false); }
    } else { audio.pause(); setPlaying(false); }
  };

  return (
    <aside className="mini-player">
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => {
          const current = event.currentTarget.currentTime;
          setTime(current);
          // Kullanıcı şarkının en az 15 saniyesini dinlediyse "dinlendi" olarak kaydet
          if (current >= 15 && song && !listenedRef.current) {
            listenedRef.current = true;
            void markAsListened(song);
          }
        }}
        onLoadedMetadata={(event) => {
          const reported = event.currentTarget.duration;
          setDuration(reported);
          setFull(true);
        }}
        onError={() => {
          setError("İçerik sağlayıcıdan akış alınamadı veya lisans kısıtlaması mevcut.");
          setPlaying(false);
          setFull(false);
        }}
        onEnded={() => { setPlaying(false); onNext(); }}
      />
      {song.artwork ? <img src={song.artwork} alt="" /> : <span className="player-fallback">V</span>}
      <div className="player-track">
        <strong>{song.title}</strong>
        <span>{song.artist}</span>
      </div>
      <div className="player-transport">
        <button onClick={onPrev} aria-label="Önceki"><SkipBack size={16} /></button>
        <button className="player-control" onClick={toggle} aria-label={playing ? "Duraklat" : "Oynat"}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button onClick={onNext} aria-label="Sonraki"><SkipForward size={16} /></button>
      </div>
      <label className="player-seek">
        <span>{error || (full ? `${clock(time)} / ${clock(duration)} · ${song.license || "Audius Lisanslı"}` : "Lisans ve akış kontrol ediliyor...")}</span>
        <input type="range" min={0} max={duration || 0} step={0.1} value={Math.min(time, duration || 0)} disabled={!full} onChange={(event) => {
          const next = Number(event.target.value);
          if (audio) audio.currentTime = next;
          setTime(next);
        }} />
      </label>
      <label className="player-volume"><Volume2 size={14} /><input type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => {
        const next = Number(event.target.value);
        setVolume(next);
        if (audioRef.current) audioRef.current.volume = next;
      }} /></label>
      <button className="icon-action" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
    </aside>
  );
}
