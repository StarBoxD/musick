"use client";

import { useEffect, type RefObject } from "react";
import type { Song } from "@/types/music";

type MediaSessionParams = {
  song: Song | null;
  playing: boolean;
  time: number;
  duration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  setTime: (time: number) => void;
  togglePlay: () => Promise<void>;
  handlePrevClick: () => void;
  handleNextClick: () => void;
};

export function useMediaSession({
  song,
  playing,
  time,
  duration,
  audioRef,
  setTime,
  togglePlay,
  handlePrevClick,
  handleNextClick,
}: MediaSessionParams) {
  // iPhone / PWA Media Session API entegrasyonu
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !song) return;

    const mediaSession = navigator.mediaSession;

    try {
      const artworkList: MediaImage[] = song.artwork
        ? [
            { src: song.artwork, sizes: "512x512", type: "image/jpeg" },
            { src: song.artwork, sizes: "256x256", type: "image/jpeg" },
            { src: song.artwork, sizes: "128x128", type: "image/jpeg" },
          ]
        : [{ src: "/icon.svg", sizes: "512x512", type: "image/svg+xml" }];

      mediaSession.metadata = new window.MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: "VYBE Radyo",
        artwork: artworkList,
      });

      mediaSession.playbackState = playing ? "playing" : "paused";

      mediaSession.setActionHandler("play", () => {
        void togglePlay();
      });
      mediaSession.setActionHandler("pause", () => {
        void togglePlay();
      });
      mediaSession.setActionHandler("previoustrack", () => {
        handlePrevClick();
      });
      mediaSession.setActionHandler("nexttrack", () => {
        handleNextClick();
      });

      try {
        mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
            setTime(details.seekTime);
          }
        });
        mediaSession.setActionHandler("seekbackward", (details) => {
          const skip = details.seekOffset || 10;
          if (audioRef.current) {
            const nextTime = Math.max(0, audioRef.current.currentTime - skip);
            audioRef.current.currentTime = nextTime;
            setTime(nextTime);
          }
        });
        mediaSession.setActionHandler("seekforward", (details) => {
          const skip = details.seekOffset || 10;
          if (audioRef.current) {
            const maxDuration = duration || Infinity;
            const nextTime = Math.min(maxDuration, audioRef.current.currentTime + skip);
            audioRef.current.currentTime = nextTime;
            setTime(nextTime);
          }
        });
      } catch {
        // Tarayıcı bu ek seek eylemlerini desteklemiyorsa sessizce geç
      }
    } catch {
      // MediaSession API çağrısı sırasında oluşabilecek tarayıcı istisnalarını yakala
    }

    return () => {
      try {
        mediaSession.setActionHandler("play", null);
        mediaSession.setActionHandler("pause", null);
        mediaSession.setActionHandler("previoustrack", null);
        mediaSession.setActionHandler("nexttrack", null);
        mediaSession.setActionHandler("seekto", null);
        mediaSession.setActionHandler("seekbackward", null);
        mediaSession.setActionHandler("seekforward", null);
      } catch {
        // Temizleme hatalarını yut
      }
    };
  }, [song, playing, duration, audioRef, setTime, handlePrevClick, handleNextClick, togglePlay]);

  // Media Session Position State senkronizasyonu
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("mediaSession" in navigator) ||
      !("setPositionState" in navigator.mediaSession) ||
      !duration ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, duration),
        playbackRate: 1,
        position: Math.min(Math.max(0, time), duration),
      });
    } catch {
      // Safari / Chrome setPositionState istisnası koruması
    }
  }, [time, duration]);
}
