"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, X } from "lucide-react";
import type { Song } from "@/types/music";

export default function MiniPlayer({ song, onClose }: { song: Song | null; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
    if (song?.previewUrl && audioRef.current) {
      audioRef.current.src = song.previewUrl;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [song]);

  if (!song) return null;
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); } catch { setPlaying(false); }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <aside className="mini-player">
      <audio ref={audioRef} onEnded={() => setPlaying(false)} />
      {song.artwork && <img src={song.artwork} alt="" />}
      <div className="player-track"><strong>{song.title}</strong><span>{song.artist}</span></div>
      {song.previewUrl ? (
        <button className="player-control" onClick={toggle} aria-label={playing ? "Duraklat" : "Oynat"}>
          {playing ? <Pause size={19} /> : <Play size={19} />}
        </button>
      ) : <span className="preview-note"><Volume2 size={15} /> Önizleme yok</span>}
      <button className="icon-action" onClick={onClose} aria-label="Oynatıcıyı kapat"><X size={18} /></button>
      <span className="player-progress" />
    </aside>
  );
}
