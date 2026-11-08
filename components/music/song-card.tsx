import { Heart, ListPlus, Play } from "lucide-react";
import type { Song } from "@/types/music";

type Props = {
  song: Song;
  favorite: boolean;
  onPlay: (song: Song) => void;
  onFavorite: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
};

export default function SongCard({ song, favorite, onPlay, onFavorite, onAddToPlaylist }: Props) {
  return (
    <article className="song-card">
      <button className="song-cover" onClick={() => onPlay(song)} aria-label={`${song.title} çal`}>
        {song.artwork ? <img src={song.artwork} alt="" /> : <span>V.</span>}
        <span className="cover-play"><Play size={18} fill="currentColor" /></span>
      </button>
      <div className="song-info">
        <strong title={song.title}>{song.title}</strong>
        <span title={song.artist}>{song.artist}</span>
        <small>{song.album}</small>
      </div>
      <div className="song-actions">
        <button onClick={() => onFavorite(song)} aria-label="Favorilere ekle" className={favorite ? "icon-action is-favorite" : "icon-action"}>
          <Heart size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
        <button onClick={() => onAddToPlaylist(song)} aria-label="Playlist'e ekle" className="icon-action">
          <ListPlus size={18} />
        </button>
      </div>
    </article>
  );
}
