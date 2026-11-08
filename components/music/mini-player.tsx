"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import type { Song } from "@/types/music";

type Props = { song: Song | null; onClose: () => void; onPrev: () => void; onNext: () => void };

function clock(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function MiniPlayer({ song, onClose, onPrev, onNext }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [full, setFull] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    setPlaying(false); setTime(0); setDuration(0); setFull(false); setError("");
    if (!audio || !song?.streamUrl) return;
    audio.src = song.streamUrl;
    audio.volume = volume;
    audio.play().then(() => setPlaying(true)).catch(() => setError("Oynatma başlamadı. Play'e bas."));
  }, [song]);

  if (!song) return null;
  const audio = audioRef.current;
  const toggle = async () => {
    if (!audio || error.startsWith("Gelen")) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); setError(""); } catch { setError("Parça yüklenemedi."); setPlaying(false); }
    } else { audio.pause(); setPlaying(false); }
  };

  return (
    <aside className="mini-player">
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const reported = event.currentTarget.duration;
          setDuration(reported);
          if (!Number.isFinite(reported) || reported < 20) {
            setError("Süre okunamadı. Tam parça olarak işaretlenmedi.");
            event.currentTarget.pause();
            setPlaying(false);
            return;
          }
          if (song.durationSeconds > 0 && reported < song.durationSeconds * 0.7) {
            setError("Gelen kayıt parçanın süresinden kısa. Tam parça olarak çalınmıyor.");
            event.currentTarget.pause();
            setPlaying(false);
            return;
          }
          setFull(true);
        }}
        onError={() => { setError("Parça yüklenemedi."); setPlaying(false); setFull(false); }}
        onEnded={() => { setPlaying(false); onNext(); }}
      />
      {song.artwork ? <img src={song.artwork} alt="" /> : <span className="player-fallback">V</span>}
      <div className="player-track"><strong>{song.title}</strong><span>{song.artist}</span></div>
      <div className="player-transport">
        <button onClick={onPrev} aria-label="Önceki"><SkipBack size={16} /></button>
        <button className="player-control" onClick={toggle} aria-label={playing ? "Duraklat" : "Oynat"}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button onClick={onNext} aria-label="Sonraki"><SkipForward size={16} /></button>
      </div>
      <label className="player-seek">
        <span>{error || (full ? `${clock(time)} / ${clock(duration)} · Audius tam parça` : "Akış kontrol ediliyor")}</span>
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
