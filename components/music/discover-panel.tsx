"use client";

import { useState } from "react";
import { Heart, Music2, Search, Shuffle, Sparkles } from "lucide-react";
import { postMusic, searchMusic } from "@/lib/music/audius";
import { MOODS } from "@/lib/music/moods";
import type { Mood, Song } from "@/types/music";

type Props = {
  favorites: Song[];
  onPlay: (songs: Song[], index: number) => void;
  onFavorite: (song: Song) => void;
  onAdd: (song: Song) => void;
};

const MOOD_META: Record<Mood, { label: string; desc: string; emoji: string }> = {
  Happy: { label: "Happy", desc: "Hareketli Türkçe Pop", emoji: "☀️" },
  Sad: { label: "Sad", desc: "Duygusal & Akustik", emoji: "🌧️" },
  Chill: { label: "Chill", desc: "Alternatif & Sakin", emoji: "🌙" },
  Energetic: { label: "Energetic", desc: "Türkçe Rap & Yüksek Tempo", emoji: "⚡" },
  Romantic: { label: "Romantic", desc: "Aşk & Slow Hit", emoji: "💜" },
  Focus: { label: "Focus", desc: "Enstrümantal & Odak", emoji: "🎧" },
  Nostalgic: { label: "Nostalgic", desc: "90'lar & Anadolu Rock", emoji: "📼" },
  Dark: { label: "Dark", desc: "Türkçe Rock & Kült", emoji: "🔥" },
};

export default function DiscoverPanel({ favorites, onPlay, onFavorite }: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [query, setQuery] = useState("");
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Bir ruh hâli seç; liste kalabalığı olmadan müziğin anında başlasın.");

  const discover = async (nextMood: Mood) => {
    setMood(nextMood);
    setLoading(true);
    setMessage(`${MOOD_META[nextMood].label} frekansından rastgele parça çekiliyor...`);
    try {
      const data = await postMusic("/api/music/discover", { mood: nextMood });
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        onPlay([picked], 0);
        setMessage(`${MOOD_META[nextMood].emoji} ${MOOD_META[nextMood].desc} · Canlı Yayında`);
      } else {
        setMessage("Bu modda çalacak şarkı bulunamadı, başka bir mod dene.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Parça başlatılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const playRandomNext = () => {
    if (mood) void discover(mood);
    else void discover("Chill");
  };

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessage("Sanatçı veya parça aranıyor...");
    try {
      const data = await searchMusic(query);
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        onPlay(data.songs ?? [picked], 0);
        setMessage(`🔍 Arama radyosu: ${picked.artist}`);
      } else {
        setMessage("Aramaya uygun parça bulunamadı.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Arama yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const isFav = currentSong ? favorites.some((f) => f.trackId === currentSong.trackId) : false;

  return (
    <div className="radio-container">
      {/* Üst Arama & Hızlı Rastgele Çal Barı */}
      <div className="discover-top-controls">
        <form
          className="music-search"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sanatçı veya şarkı yaz, anında çalsın (Duman, Sezen Aksu, Ezhel...)"
          />
          <button disabled={loading}>{loading ? "..." : "Çal"}</button>
        </form>
        <button
          type="button"
          className="quick-shuffle-btn"
          onClick={playRandomNext}
          disabled={loading}
        >
          <Shuffle size={16} />
          <span>Şansımı Dene</span>
        </button>
      </div>

      {/* Renkli Mood Kartları */}
      <div className="mood-grid">
        {MOODS.map((item) => {
          const meta = MOOD_META[item];
          return (
            <button
              key={item}
              className={`mood-card mood-${item.toLowerCase()} ${mood === item ? "active" : ""}`}
              onClick={() => void discover(item)}
              disabled={loading}
            >
              <div className="mood-card-top">
                <span className="mood-emoji">{meta.emoji}</span>
                {mood === item && <span className="mood-playing-dot" />}
              </div>
              <b>{meta.label}</b>
              <small>{meta.desc}</small>
            </button>
          );
        })}
      </div>

      {message && (
        <div className="music-message-pill">
          <Sparkles size={13} />
          <span>{message}</span>
        </div>
      )}

      {/* Ortadaki Stüdyo Sahnesi / Canlı Radyo Kartı */}
      {currentSong ? (
        <div className="now-playing-card">
          <div
            className="now-playing-ambient"
            style={
              currentSong.artwork
                ? { backgroundImage: `url(${currentSong.artwork})` }
                : undefined
            }
          />
          <div className="now-playing-cover-wrap">
            {currentSong.artwork ? (
              <img src={currentSong.artwork} alt={currentSong.title} className="now-playing-img" />
            ) : (
              <div className="now-playing-fallback">
                <Music2 size={54} />
              </div>
            )}
            <div className="equalizer-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="now-playing-details">
            <div className="live-badge-row">
              <span className="live-badge">
                <span className="live-dot" /> CANLI RADYO
              </span>
              {mood && <span className="mood-tag">{MOOD_META[mood].desc}</span>}
            </div>
            <h2>{currentSong.title}</h2>
            <h3>{currentSong.artist}</h3>
            <p className="listen-rule-hint">
              15 saniye dinlediğinde bu parça hafızaya alınır ve bir daha tekrar karşına çıkmaz.
            </p>
            <div className="now-playing-actions">
              <button
                type="button"
                className={`action-btn ${isFav ? "fav-active" : ""}`}
                onClick={() => onFavorite(currentSong)}
              >
                <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                <span>{isFav ? "Favorilerde" : "Favorile"}</span>
              </button>
              <button
                type="button"
                className="action-btn next-btn"
                onClick={playRandomNext}
                disabled={loading}
              >
                <Shuffle size={16} />
                <span>{loading ? "Seçiliyor..." : "Sıradaki Rastgele Parça"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="radio-placeholder">
          <div className="pulse-disc">
            <Music2 size={34} />
          </div>
          <h3>Frekansını Seç, Radyon Başlasın</h3>
          <p>
            Yukarıdaki 8 ruh hâlinden birine dokun veya <b>Şansımı Dene</b> butonuna bas; Türkçe şarkılar ekranda liste kalabalığı yapmadan anında çalmaya başlasın.
          </p>
        </div>
      )}
    </div>
  );
}
