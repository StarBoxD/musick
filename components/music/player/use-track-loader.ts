"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Song } from "@/types/music";
import { isValidStreamUrl } from "@/lib/music/license-filter";

type TrackLoaderParams = {
  song: Song | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  volumeRef: MutableRefObject<number>;
  listenedRef: MutableRefObject<boolean>;
  consecutiveErrorsRef: MutableRefObject<number>;
  autoSkipTimerRef: MutableRefObject<NodeJS.Timeout | null>;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  setExpanded: (expanded: boolean) => void;
};

/**
 * Loads the current song into the audio element and starts playback whenever the track changes.
 */
export function useTrackLoader({
  song,
  audioRef,
  volumeRef,
  listenedRef,
  consecutiveErrorsRef,
  autoSkipTimerRef,
  setPlaying,
  setLoading,
  setTime,
  setDuration,
  setIsReady,
  setError,
  setExpanded,
}: TrackLoaderParams) {
  const currentTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (autoSkipTimerRef.current) {
      clearTimeout(autoSkipTimerRef.current);
      autoSkipTimerRef.current = null;
    }
    if (!song) {
      currentTrackIdRef.current = null;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      setPlaying(false);
      setTime(0);
      setDuration(0);
      setIsReady(false);
      setError(null);
      setExpanded(false);
      return;
    }
    if (currentTrackIdRef.current === song.trackId && audio && audio.src) {
      return;
    }
    currentTrackIdRef.current = song.trackId;
    listenedRef.current = false;
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setIsReady(false);
    setError(null);
    if (!audio) return;
    if (!song.streamUrl || !isValidStreamUrl(song.streamUrl)) {
      setError("Geçerli bir akış adresi doğrulanamadı.");
      return;
    }
    setLoading(true);
    audio.src = song.streamUrl;
    audio.volume = volumeRef.current;
    audio.load();
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaying(true);
          setLoading(false);
          consecutiveErrorsRef.current = 0;
        })
        .catch((err: Error) => {
          setLoading(false);
          setError(
            err.name === "NotAllowedError"
              ? "Otomatik oynatma engellendi. Başlatmak için 'Oynat'a basın."
              : "Oynatma başlatılamadı. Tekrar deneyin."
          );
        });
    }
  }, [
    song,
    audioRef,
    volumeRef,
    listenedRef,
    consecutiveErrorsRef,
    autoSkipTimerRef,
    setPlaying,
    setLoading,
    setTime,
    setDuration,
    setIsReady,
    setError,
    setExpanded,
  ]);
}
