"use client";

import type { Song } from "@/types/music";
import SongCard from "@/components/music/song-card";

type Props = {
  songs: Song[];
  favorites: Song[];
  pendingFavorites?: Set<string>;
  empty: string;
  onPlay: (songs: Song[], index: number) => void;
  onFavorite: (song: Song) => void;
  onAdd: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongGrid({
  songs,
  favorites,
  pendingFavorites,
  empty,
  onPlay,
  onFavorite,
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
          onPlay={() => onPlay(songs, index)}
          onFavorite={onFavorite}
          onAddToPlaylist={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
