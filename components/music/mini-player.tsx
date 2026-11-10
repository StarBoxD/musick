"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/types/music";
import { isValidStreamUrl } from "@/lib/music/license-filter";
import { usePlayerTransport } from "@/components/music/player/use-player-transport";
import PlayerAudio from "@/components/music/player/player-audio";
import {
  PlayerActionButtons,
  PlayerExpandedHeader,
  PlayerTrackInfo,
  PlayerTransport,
} from "@/components/music/player/player-controls";
import { PlayerSeek, PlayerVolume } from "@/components/music/player/player-sliders";

type Props = {
  song: Song | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNeedMoreSongs?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export default function MiniPlayer({
  song,
  onClose,
  onPrev,
  onNext,
  onNeedMoreSongs,
  hasPrev = true,
  hasNext = true,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listenedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const autoSkipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
  }, [song]);

  const { handlePrevClick, handleNextClick, togglePlay } = usePlayerTransport({
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
  });

  if (!song) return null;

  const handleMobileToggleExpand = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <aside
      id="mini-player"
      className={`mini-player ${expanded ? "is-expanded" : ""}`}
      aria-label="Müzik Oynatıcı"
    >
      <PlayerAudio
        song={song}
        audioRef={audioRef}
        listenedRef={listenedRef}
        consecutiveErrorsRef={consecutiveErrorsRef}
        autoSkipTimerRef={autoSkipTimerRef}
        isSeeking={isSeeking}
        setPlaying={setPlaying}
        setLoading={setLoading}
        setTime={setTime}
        setDuration={setDuration}
        setIsReady={setIsReady}
        setError={setError}
        onNext={handleNextClick}
      />
      {expanded && (
        <PlayerExpandedHeader
          onCollapse={() => setExpanded(false)}
          onClose={() => {
            setExpanded(false);
            onClose();
          }}
        />
      )}
      <PlayerTrackInfo song={song} onMobileToggleExpand={handleMobileToggleExpand} />
      <PlayerTransport
        playing={playing}
        loading={loading}
        onPrev={handlePrevClick}
        onTogglePlay={() => void togglePlay()}
        onNext={handleNextClick}
      />
      <PlayerSeek
        song={song}
        time={time}
        duration={duration}
        isReady={isReady}
        error={error}
        audioRef={audioRef}
        setTime={setTime}
        setIsSeeking={setIsSeeking}
      />
      <PlayerVolume volume={volume} setVolume={setVolume} audioRef={audioRef} />
      <PlayerActionButtons expanded={expanded} onExpand={() => setExpanded(true)} onClose={onClose} />
    </aside>
  );
}
