"use client";

import {
  Heart,
  ListEnd,
  ListPlus,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { Song } from "@/types/music";
import { useSongMenu } from "@/components/music/song-card/use-song-menu";

export type SongMenuProps = {
  song: Song;
  favorite: boolean;
  isPendingFavorite: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onRemove?: (song: Song) => void;
};

export default function SongMenu({
  song,
  favorite,
  isPendingFavorite,
  menuOpen,
  setMenuOpen,
  onFavorite,
  onAddToQueue,
  onAddToPlaylist,
  onRemove,
}: SongMenuProps) {
  const { openUpward, menuWrapRef, triggerRef, menuRef, toggleMenu } = useSongMenu(
    menuOpen,
    setMenuOpen
  );

  return (
    <div className="song-menu-wrap" ref={menuWrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`song-menu-trigger icon-action ${menuOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label={`${song.title} seçenekleri`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Şarkı seçenekleri"
      >
        {isPendingFavorite ? (
          <Loader2 size={18} className="spin-fast" />
        ) : (
          <MoreHorizontal size={20} />
        )}
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className={`song-dropdown-menu ${openUpward ? "open-up" : "open-down"}`}
          role="menu"
          aria-label={`${song.title} işlemleri`}
        >
          <button
            type="button"
            role="menuitem"
            className={`song-menu-item ${favorite ? "is-favorite" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (isPendingFavorite) return;
              onFavorite(song);
              setMenuOpen(false);
            }}
            disabled={isPendingFavorite}
          >
            {isPendingFavorite ? (
              <Loader2 size={16} className="spin-fast" />
            ) : (
              <Heart size={16} fill={favorite ? "currentColor" : "none"} />
            )}
            <span>
              {isPendingFavorite
                ? "İşleniyor..."
                : favorite
                ? "Favorilerden çıkar"
                : "Favorilere ekle"}
            </span>
          </button>

          {onAddToQueue && (
            <button
              type="button"
              role="menuitem"
              className="song-menu-item"
              onClick={(event) => {
                event.stopPropagation();
                onAddToQueue(song);
                setMenuOpen(false);
              }}
            >
              <ListEnd size={16} />
              <span>Sıraya ekle</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className="song-menu-item"
            onClick={(event) => {
              event.stopPropagation();
              onAddToPlaylist(song);
              setMenuOpen(false);
            }}
          >
            <ListPlus size={16} />
            <span>Çalma listesine ekle</span>
          </button>

          {onRemove && (
            <>
              <div className="song-menu-divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="song-menu-item is-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(song);
                  setMenuOpen(false);
                }}
              >
                <Trash2 size={16} />
                <span>Listeden çıkar</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
