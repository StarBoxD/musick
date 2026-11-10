"use client";

import { useEffect, useState } from "react";
import { Disc3, Play } from "lucide-react";
import type { Song } from "@/types/music";
import SongMenu from "@/components/music/song-card/song-menu";

type Props = {
  song: Song;
  favorite: boolean;
  isPendingFavorite?: boolean;
  onPlay: () => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongCard({
  song,
  favorite,
  isPendingFavorite = false,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAddToPlaylist,
  onRemove,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [song.artwork]);

  const handlePlay = () => {
    onPlay();
  };

  const coverUrl = song.artwork && !imgError ? song.artwork : "";

  return (
    <article
      className={`song-card ${menuOpen ? "is-menu-open" : ""}`}
      data-track-id={song.trackId}
    >
      <button
        type="button"
        className="song-cover-wrap"
        onClick={handlePlay}
        aria-label={`${song.title} şarkısını çal`}
      >
        {coverUrl ? (
          <img
            className="song-cover"
            src={coverUrl}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="song-cover song-cover-fallback" aria-hidden="true">
            <span className="song-cover-fallback-disc">
              <Disc3 size={34} />
            </span>
          </span>
        )}
        <span className="cover-play-badge" aria-hidden="true">
          <Play size={18} fill="currentColor" />
        </span>
      </button>

      <div
        className="song-info"
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        aria-label={`${song.title} - ${song.artist} oynat`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handlePlay();
          }
        }}
      >
        <div className="song-title" title={song.title}>
          {song.title}
        </div>

        <div className="song-artist" title={song.artist}>
          {song.artist}
        </div>
      </div>

      <SongMenu
        song={song}
        favorite={favorite}
        isPendingFavorite={isPendingFavorite}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onFavorite={onFavorite}
        onAddToQueue={onAddToQueue}
        onAddToPlaylist={onAddToPlaylist}
        onRemove={onRemove}
      />
    </article>
  );
}
