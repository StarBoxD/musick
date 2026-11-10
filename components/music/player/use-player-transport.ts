"use client";

import { useCallback, type RefObject } from "react";
import type { Song } from "@/types/music";
import { useMediaSession } from "@/components/music/player/use-media-session";

type UsePlayerTransportParams = {
  song: Song | null;
  playing: boolean;
  time: number;
  duration: number;
  error: string | null;
  hasPrev: boolean;
  hasNext: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  setPlaying: (playing: boolean) => void;
  setTime: (time: number) => void;
  setError: (error: string | null) => void;
  onPrev: () => void;
  onNext: () => void;
  onNeedMoreSongs?: () => void;
};

export function usePlayerTransport({
  song,
  playing,
  time,
  duration,
  error,
  hasPrev,
  hasNext,
  audioRef,
  setPlaying,
  setTime,
  setError,
  onPrev,
  onNext,
  onNeedMoreSongs,
}: UsePlayerTransportParams) {
  const handlePrevClick = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setTime(0);
      return;
    }
    if (hasPrev) {
      onPrev();
    } else if (audio) {
      audio.currentTime = 0;
      setTime(0);
    }
  }, [audioRef, hasPrev, onPrev, setTime]);

  const handleNextClick = useCallback(() => {
    if (hasNext) {
      onNext();
    } else if (onNeedMoreSongs) {
      onNeedMoreSongs();
    } else {
      setError("Kuyruktaki son parçadasınız.");
    }
  }, [hasNext, onNeedMoreSongs, onNext, setError]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || error?.includes("doğrulanamadı")) return;

    if (audio.paused) {
      try {
        setError(null);
        await audio.play();
        setPlaying(true);
      } catch {
        setError("Akış başlatılamadı.");
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [audioRef, error, setError, setPlaying]);

  useMediaSession({
    song,
    playing,
    time,
    duration,
    audioRef,
    setTime,
    togglePlay,
    handlePrevClick,
    handleNextClick,
  });

  return {
    handlePrevClick,
    handleNextClick,
    togglePlay,
  };
}
