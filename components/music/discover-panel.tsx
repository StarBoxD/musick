"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { postMusic, searchMusic } from "@/lib/music/audius";
import { MOODS } from "@/lib/music/moods";
import type { Mood, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

type Props = {
  favorites: Song[];
  onPlay: (songs: Song[], index: number) => void;
  onFavorite: (song: Song) => void;
  onAdd: (song: Song) => void;
};

export default function DiscoverPanel({ favorites, onPlay, onFavorite, onAdd }: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [query, setQuery] = useState("");
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Bir ruh hâli seç; arkana yaslan, müzik direkt başlasın.");

  const discover = async (nextMood: Mood) => {
    setMood(nextMood);
    setLoading(true);
    setMessage(`${nextMood} modunda rastgele bir parça seçiliyor...`);
    try {
      const data = await postMusic("/api/music/discover", { mood: nextMood });
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        onPlay([picked], 0); // Şarkıyı anında çalmaya başlat!
        setMessage(`Şu an çalıyor: ${picked.title} - ${picked.artist}`);
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
    setMessage("Aranıyor...");
    try {
      const data = await searchMusic(query);
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        onPlay(data.songs ?? [picked], 0);
        setMessage(`Şu an çalıyor: ${picked.title} - ${picked.artist}`);
      } else {
        setMessage("Aramaya uygun parça bulunamadı.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Arama yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="radio-container">
      {/* Üstte Mod Seçim Izgarası */}
      <div className="mood-grid">
        {MOODS.map((item) => (
          <button
            key={item}
            className={`mood-card mood-${item.toLowerCase()} ${mood === item ? "active" : ""}`}
            onClick={() => void discover(item)}
            disabled={loading}
          >
            <div className="mood-glow" />
            <b>{item}</b>
            <small>Radyoyu Başlat ⚡</small>
          </button>
        ))}
      </div>

      {/* Arama Alanı */}
      <form className="music-search" onSubmit={(event) => { event.preventDefault(); void search(); }}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şarkı veya sanatçı ara, direkt çalsın..." />
        <button disabled={loading}>{loading ? "Yükleniyor..." : "Çal"}</button>
      </form>

      {message && <p className="music-message-hero">{message}</p>}

      {/* Ortadaki Büyük Görsel Player / Çalan Şarkı Ekranı */}
      {currentSong ? (
        <div className="now-playing-card">
          <div className="now-playing-cover-wrap">
            {currentSong.artwork ? (
              <img src={currentSong.artwork} alt={currentSong.title} className="now-playing-img" />
            ) : (
              <div className="now-playing-fallback">🎵</div>
            )}
            <div className="vinyl-wave-ring" />
          </div>
          <div className="now-playing-details">
            <span className="live-badge">CANLI ÇALIYOR</span>
            <h2>{currentSong.title}</h2>
            <h3>{currentSong.artist}</h3>
            <div className="now-playing-actions">
              <button
                className={`action-btn ${favorites.some((f) => f.trackId === currentSong.trackId) ? "fav-active" : ""}`}
                onClick={() => onFavorite(currentSong)}
              >
                ♥ Favorile
              </button>
              <button className="action-btn next-btn" onClick={playRandomNext} disabled={loading}>
                {loading ? "Geçiliyor..." : "Sıradaki Rastgele Parça ⏭"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="radio-placeholder">
          <div className="pulse-disc">💿</div>
          <h3>Henüz bir şarkı çalmıyor</h3>
          <p>Yukarıdaki modlardan birine tıkla, Türkçe şarkılar anında rastgele çalmaya başlasın.</p>
        </div>
      )}
    </div>
  );
}
