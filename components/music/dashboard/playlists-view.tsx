"use client";

import { useState } from "react";
import { FolderPlus, ListMusic, Trash2 } from "lucide-react";
import type { PlaybackSource, Song } from "@/types/music";
import type { useLibrary } from "@/components/music/use-library";
import SongGrid from "@/components/music/song-grid";
import AlbumAdderPanel from "@/components/music/dashboard/album-adder-panel";
import ActivePlaylistBanner from "@/components/music/dashboard/active-playlist-banner";

type PlaylistsViewProps = {
  library: ReturnType<typeof useLibrary>;
  homeSongs: Song[];
  onToggleSongInPlaylist: (playlistId: string, playlistTitle: string, track: Song) => void;
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  enqueue: (track: Song) => void;
  add: (track: Song) => void;
};

export default function PlaylistsView({
  library,
  homeSongs,
  onToggleSongInPlaylist,
  play,
  enqueue,
  add,
}: PlaylistsViewProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [showAlbumAdder, setShowAlbumAdder] = useState(false);

  const {
    playlists,
    activePlaylist,
    setActivePlaylist,
    playlistSongs,
    favorites,
    pendingFavorites,
    isTrackInPlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    removeFromPlaylist,
    toggleFavorite,
  } = library;

  const activePlaylistObj = playlists.find((p) => p.id === activePlaylist) ?? null;

  return (
    <div className="playlists-studio">
      <div className="playlists-header-bar">
        <form
          id="playlist-form"
          className="playlist-create-bar"
          onSubmit={(event) => {
            event.preventDefault();
            if (playlistName.trim()) {
              void createPlaylist(playlistName.trim());
              setPlaylistName("");
            }
          }}
        >
          <FolderPlus size={17} />
          <input
            id="test-input"
            type="text"
            value={playlistName}
            onChange={(event) => setPlaylistName(event.target.value)}
            placeholder="Yeni liste adı yaz (örn. Gece Sürüşü)..."
            maxLength={40}
          />
          <button type="submit" disabled={!playlistName.trim()}>
            Oluştur
          </button>
        </form>
      </div>

      {playlists.length > 0 ? (
        <div className="playlist-cards-row">
          {playlists.map((list) => {
            const isSelected = activePlaylist === list.id;
            return (
              <div
                key={list.id}
                className={isSelected ? "playlist-pill-card active" : "playlist-pill-card"}
                onClick={() => setActivePlaylist(list.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActivePlaylist(list.id);
                }}
              >
                <div className="playlist-pill-icon">
                  <ListMusic size={16} />
                </div>
                <div className="playlist-pill-info">
                  <strong>{list.name}</strong>
                  <small>{isSelected ? "Seçili koleksiyon" : "Açmak için dokun"}</small>
                </div>
                {isSelected && (
                  <button
                    type="button"
                    className="playlist-pill-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deletePlaylist(list.id);
                    }}
                    title="Listeyi sil"
                    aria-label="Listeyi sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          Henüz bir çalma listen yok. Yukarıdan bir isim yazıp ilk listeni oluştur.
        </div>
      )}

      {activePlaylistObj && (
        <div className="active-playlist-section">
          <ActivePlaylistBanner
            activePlaylistObj={activePlaylistObj}
            playlistSongs={playlistSongs}
            showAlbumAdder={showAlbumAdder}
            setShowAlbumAdder={setShowAlbumAdder}
            play={play}
            renamePlaylist={renamePlaylist}
            deletePlaylist={deletePlaylist}
          />

          {showAlbumAdder && (
            <AlbumAdderPanel
              activePlaylistObj={activePlaylistObj}
              homeSongs={homeSongs}
              favorites={favorites}
              isTrackInPlaylist={isTrackInPlaylist}
              onToggleSongInPlaylist={onToggleSongInPlaylist}
              onClose={() => setShowAlbumAdder(false)}
            />
          )}

          <SongGrid
            songs={playlistSongs}
            favorites={favorites}
            pendingFavorites={pendingFavorites}
            empty="Bu listede henüz parça yok. Radyoda veya aramada beğendiğin şarkılarda üç nokta menüsünden 'Çalma listesine ekle' seçeneğine dokun."
            source={{
              type: "playlist",
              playlistId: activePlaylistObj.id,
              label: activePlaylistObj.name,
            }}
            onPlay={(songs, idx, src) =>
              play(
                songs,
                idx,
                src ?? {
                  type: "playlist",
                  playlistId: activePlaylistObj.id,
                  label: activePlaylistObj.name,
                }
              )
            }
            onFavorite={toggleFavorite}
            onAddToQueue={enqueue}
            onAdd={add}
            onRemove={removeFromPlaylist}
          />
        </div>
      )}
    </div>
  );
}
