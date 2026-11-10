"use client";

import { useEffect, useState } from "react";
import { Radio, Search, Shuffle } from "lucide-react";
import { postMusic, searchMusic } from "@/lib/music/audius";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import MoodGrid, { MOOD_META } from "@/components/music/discover/mood-grid";
import NowPlayingCard from "@/components/music/discover/now-playing-card";
import DiscoverResults from "@/components/music/discover/discover-results";

export { MOOD_META };
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

  const isFav = currentSong ? favorites.some((f) => f.trackId === currentSong.trackId) : false;
  const isPendingFav = currentSong ? Boolean(pendingFavorites?.has(currentSong.trackId)) : false;

  return (
    <div className="radio-container">
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
        <button type="button" className="quick-shuffle-btn" onClick={playRandomNext} disabled={loading}>
          <Shuffle size={15} />
          <span>Rastgele Frekans</span>
        </button>
      </div>

      <MoodGrid activeMood={mood} loading={loading} onSelectMood={(item) => void discover(item)} />

      {message && (
        <div className="music-message-pill">
          <Radio size={13} />
          <span>{message}</span>
        </div>
      )}

      <NowPlayingCard
        currentSong={currentSong}
        mood={mood}
        isFav={isFav}
        isPendingFavorite={isPendingFav}
        loading={loading}
        onPlay={onPlay}
        onFavorite={onFavorite}
        onAddToQueue={onAddToQueue}
        onAdd={onAdd}
        onNextRandom={playRandomNext}
      />

      <DiscoverResults
        query={query}
        mood={mood}
        searchResults={searchResults}
        discoveredSongs={discoveredSongs}
        favorites={favorites}
        pendingFavorites={pendingFavorites}
        onSelectCurrentSong={setCurrentSong}
        onPlay={onPlay}
        onFavorite={onFavorite}
        onAddToQueue={onAddToQueue}
        onAdd={onAdd}
      />
    </div>
  );
}
