"use client";

import { useEffect, useState } from "react";
import {
  CloudRain,
  Disc3,
  Flame,
  Headphones,
  Heart,
  ListEnd,
  ListPlus,
  Loader2,
  Moon,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { postMusic, searchMusic } from "@/lib/music/audius";
import { MOODS } from "@/lib/music/moods";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

export type { PlaybackSource, PlaybackSourceType } from "@/types/music";

type Props = {
  favorites: Song[];
  pendingFavorites?: Set<string>;
  externalQuery?: string;
  onPlay: (songs: Song[], index: number, source?: PlaybackSource) => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAdd: (song: Song) => void;
};

export const MOOD_META: Record<
  Mood,
  { label: string; desc: string; tag: string; icon: typeof Sun }
> = {
  Happy: { label: "Upbeat", desc: "Hareketli Türkçe Pop", tag: "POP", icon: Sun },
  Sad: { label: "Melancholy", desc: "Duygusal & Akustik", tag: "SLOW", icon: CloudRain },
  Chill: { label: "Chill", desc: "Alternatif & Sakin", tag: "INDIE", icon: Moon },
  Energetic: { label: "High Tempo", desc: "Türkçe Rap & Hip-Hop", tag: "RAP", icon: Zap },
  Romantic: { label: "Late Night", desc: "Slow & Aşk Şarkıları", tag: "SOUL", icon: Heart },
  Focus: { label: "Deep Focus", desc: "Enstrümantal & Akustik", tag: "INSTRUMENTAL", icon: Headphones },
  Nostalgic: { label: "Classics", desc: "90'lar & Anadolu Rock", tag: "RETRO", icon: Disc3 },
  Dark: { label: "Alt Rock", desc: "Türkçe Rock & Kült", tag: "ROCK", icon: Flame },
};

export default function DiscoverPanel({
  favorites,
  pendingFavorites,
  externalQuery,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAdd,
}: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [query, setQuery] = useState(externalQuery ?? "");
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [discoveredSongs, setDiscoveredSongs] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // İlk açılışta Keşfet sayfasında öne çıkan keşif kartlarını hazırla
  useEffect(() => {
    let cancelled = false;
    postMusic("/api/music/gems")
      .then((data) => {
        if (cancelled) return;
        const incoming = (data.songs ?? []) as Song[];
        if (incoming.length > 0) {
          setDiscoveredSongs((prev) => (prev.length > 0 ? prev : incoming));
          setCurrentSong((prev) => prev ?? incoming[0]);
        }
      })
      .catch(() => {
        // Sessizce geç
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const discover = async (nextMood: Mood) => {
    setMood(nextMood);
    setSearchResults([]);
    setLoading(true);
    setMessage(`${MOOD_META[nextMood].desc} kanalından parça seçiliyor...`);
    try {
      const data = await postMusic("/api/music/discover", { mood: nextMood });
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        setDiscoveredSongs((prev) => [
          picked,
          ...prev.filter((item) => item.trackId !== picked.trackId),
        ]);
        onPlay([picked], 0, { type: "mood", mood: nextMood });
        setMessage("");
      } else {
        setMessage("Bu kanalda uygun parça bulunamadı, farklı bir frekans dene.");
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

  const runSearch = async (targetQuery: string) => {
    const clean = targetQuery.trim();
    if (!clean) return;
    setLoading(true);
    setMessage("Aranıyor...");
    try {
      const data = await searchMusic(clean);
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        setCurrentSong(picked);
        setSearchResults((data.songs ?? [picked]) as Song[]);
        onPlay(data.songs ?? [picked], 0, { type: "search", query: clean });
        setMessage("");
      } else {
        setSearchResults([]);
        setMessage("Aramaya uygun parça bulunamadı.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Arama yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      setQuery(externalQuery);
      void runSearch(externalQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  const isFav = currentSong
    ? favorites.some((f) => f.trackId === currentSong.trackId)
    : false;

  return (
    <div className="radio-container">
      {/* Üst Arama & Rastgele Kanal Başlatıcı */}
      <div className="discover-top-controls">
        <form
          className="music-search"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch(query);
          }}
        >
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sanatçı, albüm veya parça ara (Duman, Sezen Aksu, Mor ve Ötesi, Mabel Matiz...)"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Bekle" : "Ara & Çal"}
          </button>
        </form>
        <button
          type="button"
          className="quick-shuffle-btn"
          onClick={playRandomNext}
          disabled={loading}
        >
          <Shuffle size={15} />
          <span>Rastgele Frekans</span>
        </button>
      </div>

      {/* Frekans / Mood Kategori Kartları */}
      <div className="discover-section-block">
        <div className="section-caption">
          <span>FREKANS & RUH HÂLİ KANALLARI</span>
          <span>8 STÜDYO İSTASYONU</span>
        </div>
        <div className="mood-grid">
          {MOODS.map((item) => {
            const meta = MOOD_META[item];
            const Icon = meta.icon;
            const isActive = mood === item;
            return (
              <button
                key={item}
                type="button"
                className={`mood-card mood-${item.toLowerCase()} ${isActive ? "active" : ""}`}
                onClick={() => void discover(item)}
                disabled={loading}
              >
                <div className="mood-card-top">
                  <span className="mood-icon-box">
                    <Icon size={16} />
                  </span>
                  <span className="mood-tag-code">{meta.tag}</span>
                </div>
                <div className="mood-card-Bottom">
                  <b>{meta.label}</b>
                  <small>{meta.desc}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="music-message-pill">
          <Radio size={13} />
          <span>{message}</span>
        </div>
      )}

      {/* Ortadaki Stüdyo Sahnesi / Öne Çıkan Canlı Radyo Kartı */}
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
              <img
                src={currentSong.artwork}
                alt={currentSong.title}
                className="now-playing-img"
              />
            ) : (
              <div className="now-playing-fallback">
                <Disc3 size={48} />
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
                <span className="live-dot" /> ON AIR
              </span>
              {mood && <span className="mood-tag">{MOOD_META[mood].desc}</span>}
              {currentSong.genre && <span className="mood-tag">{currentSong.genre}</span>}
              {currentSong.license && <span className="mood-tag">{currentSong.license}</span>}
            </div>
            <h2>{currentSong.title}</h2>
            <h3>{currentSong.artist}</h3>
            <p className="listen-rule-hint">
              15 saniye dinlenen parçalar otomatik arşivlenir ve tekrar önerilmez.
            </p>
            <div className="now-playing-actions">
              <button
                type="button"
                className="action-btn next-btn"
                onClick={() =>
                  onPlay(
                    [currentSong],
                    0,
                    mood ? { type: "mood", mood } : { type: "direct" }
                  )
                }
              >
                <Sparkles size={15} />
                <span>Şimdi Çal</span>
              </button>
              <button
                type="button"
                className={`action-btn ${isFav ? "fav-active" : ""}`}
                onClick={() => onFavorite(currentSong)}
                disabled={currentSong ? pendingFavorites?.has(currentSong.trackId) : false}
              >
                {currentSong && pendingFavorites?.has(currentSong.trackId) ? (
                  <Loader2 size={15} className="spin-fast" />
                ) : (
                  <Heart size={15} fill={isFav ? "currentColor" : "none"} />
                )}
                <span>{isFav ? "Favorilerde" : "Favorilere Ekle"}</span>
              </button>
              {onAddToQueue && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => onAddToQueue(currentSong)}
                >
                  <ListEnd size={16} />
                  <span>Sıraya Ekle</span>
                </button>
              )}
              <button
                type="button"
                className="action-btn"
                onClick={() => onAdd(currentSong)}
              >
                <ListPlus size={16} />
                <span>Listeye Ekle</span>
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={playRandomNext}
                disabled={loading}
              >
                <Shuffle size={15} />
                <span>{loading ? "Geçiliyor..." : "Sıradaki Parça"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="radio-placeholder">
          <div className="pulse-disc">
            <Radio size={28} />
          </div>
          <h3>Bir Frekans Seç</h3>
          <p>
            Yukarıdaki 8 kanaldan birini seç veya <b>Rastgele Frekans</b> butonuna dokun; yayın anında başlasın.
          </p>
        </div>
      )}

      {searchResults.length > 0 && (
        <section className="discover-search-results">
          <div className="section-caption">
            <span>ARAMA SONUÇLARI ({searchResults.length})</span>
            <span>&ldquo;{query}&rdquo;</span>
          </div>
          <SongGrid
            songs={searchResults}
            favorites={favorites}
            pendingFavorites={pendingFavorites}
            empty="Aramaya uygun parça bulunamadı."
            source={{ type: "search", query }}
            onPlay={(songs, idx, src) => {
              if (songs[idx]) setCurrentSong(songs[idx]);
              onPlay(songs, idx, src ?? { type: "search", query });
            }}
            onFavorite={onFavorite}
            onAddToQueue={onAddToQueue}
            onAdd={onAdd}
          />
        </section>
      )}

      {searchResults.length === 0 && discoveredSongs.length > 0 && (
        <section className="discover-search-results">
          <div className="section-caption">
            <span>KEŞFEDİLEN ŞARKILAR ({discoveredSongs.length})</span>
            <span>STÜDYO SEÇKİSİ</span>
          </div>
          <SongGrid
            songs={discoveredSongs}
            favorites={favorites}
            pendingFavorites={pendingFavorites}
            empty="Henüz parça keşfedilmedi."
            source={mood ? { type: "mood", mood } : { type: "gems", label: "Keşfet Seçkisi" }}
            onPlay={(songs, idx, src) => {
              if (songs[idx]) setCurrentSong(songs[idx]);
              onPlay(
                songs,
                idx,
                src ?? (mood ? { type: "mood", mood } : { type: "gems", label: "Keşfet Seçkisi" })
              );
            }}
            onFavorite={onFavorite}
            onAddToQueue={onAddToQueue}
            onAdd={onAdd}
          />
        </section>
      )}
    </div>
  );
}
