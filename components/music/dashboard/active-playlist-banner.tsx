"use client";

import { useState } from "react";
import { Check, Edit2, Play, Plus, Trash2, X } from "lucide-react";
import type { PlaybackSource, Playlist, Song } from "@/types/music";

type ActivePlaylistBannerProps = {
  activePlaylistObj: Playlist;
  playlistSongs: Song[];
  showAlbumAdder: boolean;
  setShowAlbumAdder: (updater: (prev: boolean) => boolean) => void;
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  renamePlaylist: (id: string, newName: string) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<void>;
};

export default function ActivePlaylistBanner({
  activePlaylistObj,
  playlistSongs,
  showAlbumAdder,
  setShowAlbumAdder,
  play,
  renamePlaylist,
  deletePlaylist,
}: ActivePlaylistBannerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <div className="active-playlist-banner">
      <div>
        <span className="eyebrow">AKTİF KOLEKSİYON</span>
        {editingId === activePlaylistObj.id ? (
          <div className="playlist-rename-row">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Yeni liste adı"
              autoFocus
              className="playlist-rename-input"
            />
            <button
              type="button"
              className="icon-action"
              onClick={async () => {
                if (editTitle.trim()) {
                  const ok = await renamePlaylist(activePlaylistObj.id, editTitle.trim());
                  if (ok) setEditingId(null);
                }
              }}
              title="Kaydet"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              className="icon-action"
              onClick={() => setEditingId(null)}
              title="İptal"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <h2>{activePlaylistObj.name}</h2>
        )}
        <small>{playlistSongs.length} parça</small>
      </div>

      <div className="active-playlist-actions">
        {playlistSongs.length > 0 && (
          <button
            type="button"
            className="action-btn next-btn"
            onClick={() =>
              play(playlistSongs, 0, {
                type: "playlist",
                playlistId: activePlaylistObj.id,
                label: activePlaylistObj.name,
              })
            }
          >
            <Play size={15} fill="currentColor" />
            <span>Tümünü Oynat</span>
          </button>
        )}
        <button
          id="btn-toggle-album-adder"
          type="button"
          className={showAlbumAdder ? "action-btn next-btn" : "action-btn"}
          onClick={() => setShowAlbumAdder((prev) => !prev)}
        >
          <Plus size={15} />
          <span>{showAlbumAdder ? "Şarkı Seçiciyi Kapat" : "Şarkı Ekle"}</span>
        </button>
        {editingId !== activePlaylistObj.id && (
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              setEditingId(activePlaylistObj.id);
              setEditTitle(activePlaylistObj.name);
            }}
            title="Listeyi yeniden adlandır"
          >
            <Edit2 size={15} />
            <span>Yeniden Adlandır</span>
          </button>
        )}
        <button
          type="button"
          className="action-btn"
          onClick={() => void deletePlaylist(activePlaylistObj.id)}
        >
          <Trash2 size={15} />
          <span>Listeyi Sil</span>
        </button>
      </div>
    </div>
  );
}
