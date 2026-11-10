"use client";

import type { Mood, PlaybackSource, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

type DiscoverResultsProps = {
  query: string;
  mood: Mood | null;
  searchResults: Song[];
  discoveredSongs: Song[];
  favorites: Song[];
  pendingFavorites?: Set<string>;
  onSelectCurrentSong: (song: Song) => void;
  onPlay: (songs: Song[], index: number, source?: PlaybackSource) => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAdd: (song: Song) => void;
};

export default function DiscoverResults({
  query,
  mood,
  searchResults,
  discoveredSongs,
  favorites,
  pendingFavorites,
  onSelectCurrentSong,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAdd,
}: DiscoverResultsProps) {
  return (
    <>
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
              if (songs[idx]) onSelectCurrentSong(songs[idx]);
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
              if (songs[idx]) onSelectCurrentSong(songs[idx]);
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
    </>
  );
}
