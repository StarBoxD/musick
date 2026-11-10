"use client";

import { Heart, ListPlus, Music, Play, Trash2 } from "lucide-react";
import type { Song } from "@/types/music";

type Props = {
  song: Song;
  favorite: boolean;
  onPlay: () => void;
  onFavorite: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongCard({
  song,
  favorite,
  onPlay,
  onFavorite,
  onAddToPlaylist,
  onRemove,
}: Props) {
  return (
    <article className="song-card">
      <button className="song-cover" onClick={onPlay} aria-label={`${song.title} çal`}>
        {song.artwork ? (
          <img src={song.artwork} alt="" />
        ) : (
          <span className="song-cover-fallback">
            <Music size={28} />
          </span>
        )}
        <span className="cover-play">
          <Play size={20} fill="currentColor" />
        </span>
      </button>
      <div className="song-body">
        <div className="song-info">
          <strong title={song.title}>{song.title}</strong>
          <span title={song.artist}>{song.artist}</span>
          <small>{song.genre || "Müzik"} · {song.license || "Audius"}</small>
        </div>
        <div className="song-actions">
          <button
            onClick={() => onFavorite(song)}
            aria-label="Favori"
            className={favorite ? "icon-action is-favorite" : "icon-action"}
            title="Favorilere ekle"
          >
            <Heart size={16} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onAddToPlaylist(song)}
            aria-label="Listeye ekle"
            className="icon-action"
            title="Aktif listeye ekle"
          >
            <ListPlus size={17} />
          </button>
          {onRemove && (
            <button
              onClick={() => onRemove(song)}
              aria-label="Listeden çıkar"
              className="icon-action"
              title="Listeden çıkar"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
