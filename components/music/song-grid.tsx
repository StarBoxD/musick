"use client";

import type { PlaybackSource, Song } from "@/types/music";
import SongCard from "@/components/music/song-card";

type Props = {
  songs: Song[];
  favorites: Song[];
  pendingFavorites?: Set<string>;
  empty: string;
  source?: PlaybackSource;
  onPlay: (songs: Song[], index: number, source?: PlaybackSource) => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAdd: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongGrid({
  songs,
  favorites,
  pendingFavorites,
  empty,
  source,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAdd,
  onRemove,
}: Props) {
  if (!songs.length) return <div className="empty-state">{empty}</div>;
  return (
    <div className="song-grid">
      {songs.map((song, index) => (
        <SongCard
          key={song.trackId}
          song={song}
          favorite={favorites.some((item) => item.trackId === song.trackId)}
          isPendingFavorite={pendingFavorites?.has(song.trackId)}
          onPlay={() => onPlay(songs, index, source)}
          onFavorite={onFavorite}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
