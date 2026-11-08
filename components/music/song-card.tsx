"use client";

import { Heart, ListPlus, Play, Trash2 } from "lucide-react";
import type { Song } from "@/types/music";

type Props = {
  song: Song;
  favorite: boolean;
  onPlay: () => void;
  onFavorite: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongCard({ song, favorite, onPlay, onFavorite, onAddToPlaylist, onRemove }: Props) {
  return (
    <article className="song-card">
      <button className="song-cover" onClick={onPlay} aria-label={`${song.title} çal`}>
        {song.artwork ? <img src={song.artwork} alt="" /> : <span>V.</span>}
        <span className="cover-play"><Play size={22} fill="currentColor" /></span>
      </button>
      <div className="song-body">
        <div className="song-info">
          <strong title={song.title}>{song.title}</strong>
          <a className="song-attribution" href={song.sourceUrl} target="_blank" rel="noreferrer">{song.artist} · Audius</a>
          <small>{song.genre} · {song.license}</small>
        </div>
        <div className="song-actions">
          <button onClick={() => onFavorite(song)} aria-label="Favori" className={favorite ? "icon-action is-favorite" : "icon-action"}>
            <Heart size={17} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button onClick={() => onAddToPlaylist(song)} aria-label="Playlist'e ekle" className="icon-action"><ListPlus size={18} /></button>
          {onRemove && <button onClick={() => onRemove(song)} aria-label="Listeden çıkar" className="icon-action"><Trash2 size={16} /></button>}
        </div>
      </div>
    </article>
  );
}
