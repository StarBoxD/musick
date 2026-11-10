"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Disc3,
  Heart,
  ListEnd,
  ListPlus,
  Loader2,
  MoreHorizontal,
  Play,
  Trash2,
} from "lucide-react";
import type { Song } from "@/types/music";

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

const MENU_OPEN_EVENT = "vybe:song-menu-open";

type SongMenuProps = {
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

function SongMenu({
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
  const menuId = useId();
  const [openUpward, setOpenUpward] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Aynı anda yalnızca tek bir şarkı kartının menüsü açık olabilir
  useEffect(() => {
    const handleOtherMenuOpen = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail !== menuId) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(MENU_OPEN_EVENT, handleOtherMenuOpen);
    return () => {
      window.removeEventListener(MENU_OPEN_EVENT, handleOtherMenuOpen);
    };
  }, [menuId, setMenuOpen]);

  // Dışarı tıklama, Escape tuşu ve yön tuşlarıyla menü kontrolü
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuWrapRef.current && target && !menuWrapRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const items = menuRef.current
          ? Array.from(
              menuRef.current.querySelectorAll<HTMLButtonElement>(
                'button[role="menuitem"]:not([disabled])'
              )
            )
          : [];
        if (!items.length) return;
        event.preventDefault();
        const activeEl = document.activeElement as HTMLButtonElement | null;
        const currentIdx = items.indexOf(activeEl!);
        if (event.key === "ArrowDown") {
          const nextIdx = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
          items[nextIdx]?.focus();
        } else {
          const prevIdx = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
          items[prevIdx]?.focus();
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, setMenuOpen]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    // Ekranın alt sınırına veya mini oynatıcıya yakınsa menüyü yukarı doğru aç
    if (triggerRef.current && typeof window !== "undefined") {
      const rect = triggerRef.current.getBoundingClientRect();
      const bottomReserved = window.innerWidth <= 768 ? 148 : 96;
      const spaceBelow = window.innerHeight - rect.bottom - bottomReserved;
      setOpenUpward(spaceBelow < 210 && rect.top > 220);
    }

    window.dispatchEvent(new CustomEvent<string>(MENU_OPEN_EVENT, { detail: menuId }));
    setMenuOpen(true);
  };

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
