"use client";

import type { RefObject } from "react";
import { AlertCircle, Volume2 } from "lucide-react";
import type { Song } from "@/types/music";

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

type SeekProps = {
  song: Song;
  time: number;
  duration: number;
  isReady: boolean;
  error: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  setTime: (time: number) => void;
  setIsSeeking: (seeking: boolean) => void;
};

export function PlayerSeek({
  song,
  time,
  duration,
  isReady,
  error,
  audioRef,
  setTime,
  setIsSeeking,
}: SeekProps) {
  return (
    <div className="player-seek">
      <div className="player-seek-meta">
        {error ? (
          <span className="player-error-text">
            <AlertCircle size={12} /> {error}
          </span>
        ) : (
          <span>
            {isReady
              ? `${formatTime(time)} / ${formatTime(duration)} · ${song.license || "Lisans Belirtilmemiş"}`
              : "Akış hazırlanıyor..."}
          </span>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(time, duration || 0)}
        disabled={!isReady}
        aria-label="Şarkı Süresi"
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => setIsSeeking(false)}
        onPointerCancel={() => setIsSeeking(false)}
        onChange={(event) => {
          const next = Number(event.target.value);
          setTime(next);
          if (audioRef.current) {
            audioRef.current.currentTime = next;
          }
        }}
      />
    </div>
  );
}

type VolumeProps = {
  volume: number;
  setVolume: (vol: number) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
};

export function PlayerVolume({ volume, setVolume, audioRef }: VolumeProps) {
  return (
    <label className="player-volume" title="Ses Seviyesi">
      <Volume2 size={14} />
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        aria-label="Ses Ayarı"
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          if (audioRef.current) {
            audioRef.current.volume = next;
          }
        }}
      />
    </label>
  );
}
