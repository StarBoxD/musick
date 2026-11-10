"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, Loader2, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import type { Song } from "@/types/music";
import { isValidStreamUrl } from "@/lib/music/license-filter";

type Props = {
  song: Song | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNeedMoreSongs?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

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

  // 15 saniye dinlendiğinde veritabanına kaydet
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

  // Ses seviyesi değiştiğinde SADECE ses seviyesini güncelle (şarkıyı asla yeniden yükleme)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Parça değiştiğinde audio elementini hazırla
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
      return;
    }

    // Aynı şarkı prop olarak yeniden geldiyse playback'i sıfırlama
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

    // Akış URL'si güvenlik doğrulaması
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
          // Autoplay tarayıcı tarafından engellendiyse kullanıcıya bildir
          if (err.name === "NotAllowedError") {
            setError("Otomatik oynatma engellendi. Başlatmak için 'Oynat'a basın.");
          } else {
            setError("Oynatma başlatılamadı. Tekrar deneyin.");
          }
        });
    }
  }, [song]);

  // Önceki parça davranışı: 3 saniyeden fazla çalmışsa başa sar, değilse önceki şarkıya geç
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
  }, [hasPrev, onPrev]);

  // Sonraki parça davranışı: Sonraki parça yoksa yenisini talep et
  const handleNextClick = useCallback(() => {
    if (hasNext) {
      onNext();
    } else if (onNeedMoreSongs) {
      onNeedMoreSongs();
    } else {
      setError("Kuyruktaki son parçadasınız.");
    }
  }, [hasNext, onNext, onNeedMoreSongs]);

  // Play / Pause değiştirici
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
  }, [error]);

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

      // Action Handlers
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

      // Seek actions (optional support by browser)
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
  }, [song, playing, duration, handlePrevClick, handleNextClick, togglePlay]);

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

  if (!song) return null;

  return (
    <aside className="mini-player" aria-label="Müzik Oynatıcı">
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
          const reported = event.currentTarget.duration;
          setDuration(reported);
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
          // Hatalı parçayı 2 saniye sonra otomatik atla
          autoSkipTimerRef.current = setTimeout(() => {
            handleNextClick();
          }, 2000);
        }}
        onEnded={() => {
          setPlaying(false);
          handleNextClick();
        }}
      />

      {song.artwork ? (
        <img src={song.artwork} alt={song.title} className="player-artwork" />
      ) : (
        <span className="player-fallback">V</span>
      )}

      <div className="player-track">
        <strong title={song.title}>{song.title}</strong>
        <span title={song.artist}>{song.artist}</span>
      </div>

      <div className="player-transport">
        <button
          type="button"
          onClick={handlePrevClick}
          aria-label="Önceki Şarkı"
          title="Önceki (3s sonrası başa sarar)"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          className="player-control"
          onClick={togglePlay}
          aria-label={playing ? "Duraklat" : "Oynat"}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="spin-fast" />
          ) : playing ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={handleNextClick}
          aria-label="Sonraki Şarkı"
          title="Sonraki Parça"
        >
          <SkipForward size={16} />
        </button>
      </div>

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
          onMouseDown={() => setIsSeeking(true)}
          onTouchStart={() => setIsSeeking(true)}
          onChange={(event) => {
            const next = Number(event.target.value);
            setTime(next);
            if (audioRef.current) {
              audioRef.current.currentTime = next;
            }
          }}
          onMouseUp={() => setIsSeeking(false)}
          onTouchEnd={() => setIsSeeking(false)}
        />
      </div>

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

      <button
        type="button"
        className="icon-action player-close-btn"
        onClick={onClose}
        aria-label="Oynatıcıyı Kapat"
        title="Kapat"
      >
        <X size={18} />
      </button>
    </aside>
  );
}
