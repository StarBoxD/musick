"use client";

import { useEffect, useState } from "react";
import { Check, Disc3, FolderPlus, ListMusic, Plus, X } from "lucide-react";
import type { Playlist, Song } from "@/types/music";

type PlaylistPickerModalProps = {
  pickerSong: Song | null;
  playlists: Playlist[];
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  onToggleSongInPlaylist: (playlistId: string, playlistTitle: string, track: Song) => void;
  onCreatePlaylistAndAdd: (name: string, track: Song) => Promise<void>;
  onClose: () => void;
};

export default function PlaylistPickerModal({
  pickerSong,
  playlists,
  isTrackInPlaylist,
  onToggleSongInPlaylist,
  onCreatePlaylistAndAdd,
  onClose,
}: PlaylistPickerModalProps) {
  const [pickerNewName, setPickerNewName] = useState("");

  useEffect(() => {
    setPickerNewName("");
  }, [pickerSong]);

  useEffect(() => {
    if (!pickerSong) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pickerSong, onClose]);

  if (!pickerSong) return null;

  return (
    <div
      className="playlist-picker-backdrop"
      id="playlist-picker-backdrop"
      onClick={onClose}
    >
      <div
        className="playlist-picker-modal"
        id="playlist-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Albüm veya koleksiyon seç"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="playlist-picker-header">
          <div>
            <span className="eyebrow">KOLEKSİYONA EKLE</span>
            <h3>Hangi albüme eklensin?</h3>
          </div>
          <button
            type="button"
            className="icon-action"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        <div className="playlist-picker-song">
          {pickerSong.artwork ? (
            <img src={pickerSong.artwork} alt={pickerSong.title} />
          ) : (
            <div className="playlist-picker-fallback">
              <Disc3 size={20} />
            </div>
          )}
          <div className="playlist-picker-song-meta">
            <strong>{pickerSong.title}</strong>
            <span>{pickerSong.artist}</span>
          </div>
        </div>

        <form
          className="playlist-picker-create"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pickerNewName.trim()) return;
            const targetName = pickerNewName.trim();
            setPickerNewName("");
            void onCreatePlaylistAndAdd(targetName, pickerSong);
          }}
        >
          <FolderPlus size={16} />
          <input
            type="text"
            value={pickerNewName}
            onChange={(e) => setPickerNewName(e.target.value)}
            placeholder="Yeni albüm / liste oluştur ve ekle..."
            maxLength={40}
          />
          <button type="submit" disabled={!pickerNewName.trim()}>
            Oluştur &amp; Ekle
          </button>
        </form>

        <div className="playlist-picker-list">
          {playlists.length === 0 ? (
            <div className="playlist-picker-empty">
              Henüz bir albümün yok. Yukarıdan yeni bir isim yazıp anında oluşturabilir ve bu şarkıyı ekleyebilirsin.
            </div>
          ) : (
            playlists.map((pl) => {
              const alreadyAdded = isTrackInPlaylist(pl.id, pickerSong.trackId);
              return (
                <button
                  key={pl.id}
                  type="button"
                  className={
                    alreadyAdded ? "playlist-picker-item is-added" : "playlist-picker-item"
                  }
                  onClick={() => onToggleSongInPlaylist(pl.id, pl.name, pickerSong)}
                >
                  <span className="playlist-picker-item-icon">
                    <ListMusic size={16} />
                  </span>
                  <span className="playlist-picker-item-info">
                    <strong>{pl.name}</strong>
                    <small>
                      {alreadyAdded
                        ? "Bu albümde mevcut (Çıkarmak için dokun)"
                        : "Bu albüme eklemek için dokun"}
                    </small>
                  </span>
                  <span className="playlist-picker-item-badge">
                    {alreadyAdded ? (
                      <>
                        <Check size={14} />
                        <span>Eklendi</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Ekle</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
