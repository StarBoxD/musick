"use client";

import { useCallback, type RefObject, type MutableRefObject } from "react";
import type { Song } from "@/types/music";

type PlayerAudioProps = {
  song: Song;
  audioRef: RefObject<HTMLAudioElement | null>;
  listenedRef: MutableRefObject<boolean>;
  consecutiveErrorsRef: MutableRefObject<number>;
  autoSkipTimerRef: MutableRefObject<NodeJS.Timeout | null>;
  isSeeking: boolean;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  onNext: () => void;
};

export default function PlayerAudio({
  song,
  audioRef,
  listenedRef,
  consecutiveErrorsRef,
  autoSkipTimerRef,
  isSeeking,
  setPlaying,
  setLoading,
  setTime,
  setDuration,
  setIsReady,
  setError,
  onNext,
}: PlayerAudioProps) {
  const markAsListened = useCallback(async (s: Song) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("seen_tracks").upsert(
        { user_id: user.id, track_id: s.trackId, song: s, source: "listened" },
        { onConflict: "user_id,track_id" }
      );
    } catch {
      // sessizce geç
    }
  }, []);

  return (
    <audio
      ref={audioRef}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onWaiting={() => setLoading(true)}
      onCanPlay={() => setLoading(false)}
      onTimeUpdate={(event) => {
        if (isSeeking) return;
        const current = event.currentTarget.currentTime;
        setTime(current);
        if (current >= 15 && song && !listenedRef.current) {
          listenedRef.current = true;
          void markAsListened(song);
        }
      }}
      onLoadedMetadata={(event) => {
        setDuration(event.currentTarget.duration);
        setIsReady(true);
        setLoading(false);
      }}
      onError={() => {
        setPlaying(false);
        setLoading(false);
        setIsReady(false);
        consecutiveErrorsRef.current += 1;

        if (consecutiveErrorsRef.current >= 3) {
          setError("Arka arkaya akış alınamadı. Lütfen ağ bağlantınızı kontrol edin.");
          return;
        }

        setError("Bu parçanın akışı sağlanamadı, sıradaki parçaya geçiliyor...");
        autoSkipTimerRef.current = setTimeout(() => {
          onNext();
        }, 2000);
      }}
      onEnded={() => {
        setPlaying(false);
        onNext();
      }}
    />
  );
}
