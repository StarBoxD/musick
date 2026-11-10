"use client";

import { useState } from "react";
import { Check, Disc3, Plus, Search, X } from "lucide-react";
import { postMusic } from "@/lib/music/audius";
import type { Playlist, Song } from "@/types/music";

type AlbumAdderPanelProps = {
  activePlaylistObj: Playlist;
  homeSongs: Song[];
  favorites: Song[];
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  onToggleSongInPlaylist: (playlistId: string, playlistTitle: string, track: Song) => void;
  onClose: () => void;
};

export default function AlbumAdderPanel({
  activePlaylistObj,
  homeSongs,
  favorites,
  isTrackInPlaylist,
  onToggleSongInPlaylist,
  onClose,
}: AlbumAdderPanelProps) {
  const [adderQuery, setAdderQuery] = useState("");
  const [adderSource, setAdderSource] = useState<"recommended" | "favorites" | "search">(
    "recommended"
  );
  const [adderSearchResults, setAdderSearchResults] = useState<Song[]>([]);
  const [adderSearching, setAdderSearching] = useState(false);

  const handleSearchAlbumAdder = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setAdderSearching(true);
    setAdderSource("search");
    try {
      const data = await postMusic("/api/music/search", { query: q });
      const results = Array.isArray(data?.songs) ? (data.songs as Song[]) : [];
      setAdderSearchResults(results);
    } catch {
      setAdderSearchResults([]);
    } finally {
      setAdderSearching(false);
    }
  };

  const candidates =
    adderSource === "search"
      ? adderSearchResults
      : adderSource === "favorites"
      ? favorites
      : homeSongs;

  return (
    <div className="album-adder-panel" id="album-adder-panel">
      <div className="album-adder-header">
        <div>
          <span className="eyebrow">ALBÜM İÇERİĞİNİ DÜZENLE</span>
          <h3>&ldquo;{activePlaylistObj.name}&rdquo; koleksiyonuna şarkı ekle</h3>
        </div>
        <button
          type="button"
          className="icon-action"
          onClick={onClose}
          aria-label="Paneli kapat"
        >
          <X size={16} />
        </button>
      </div>

      <form
        className="album-adder-search"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSearchAlbumAdder(adderQuery);
        }}
      >
        <Search size={16} />
        <input
          type="search"
          value={adderQuery}
          onChange={(e) => setAdderQuery(e.target.value)}
          placeholder="İstediğin şarkıyı veya sanatçıyı ara (örn. Duman, Sezen Aksu, Mor ve Ötesi)..."
          aria-label="Koleksiyona eklenecek şarkıyı ara"
        />
        <button type="submit" disabled={adderSearching || !adderQuery.trim()}>
          {adderSearching ? "Aranıyor..." : "Ara"}
        </button>
      </form>

      <div className="album-adder-tabs">
        <button
          type="button"
          className={adderSource === "recommended" ? "album-adder-tab active" : "album-adder-tab"}
          onClick={() => setAdderSource("recommended")}
        >
          Önerilen Şarkılar ({homeSongs.length})
        </button>
        <button
          type="button"
          className={adderSource === "favorites" ? "album-adder-tab active" : "album-adder-tab"}
          onClick={() => setAdderSource("favorites")}
        >
          Favorilerim ({favorites.length})
        </button>
        {adderSearchResults.length > 0 && (
          <button
            type="button"
            className={adderSource === "search" ? "album-adder-tab active" : "album-adder-tab"}
            onClick={() => setAdderSource("search")}
          >
            Arama Sonuçları ({adderSearchResults.length})
          </button>
        )}
      </div>

      <div className="album-adder-list">
        {candidates.length === 0 ? (
          <div className="album-adder-empty">
            {adderSearching
              ? "Şarkılar aranıyor..."
              : "Burada henüz şarkı yok. Yukarıdaki arama çubuğundan istediğin şarkıyı arayabilirsin."}
          </div>
        ) : (
          candidates.slice(0, 12).map((candidate) => {
            const inCurrentAlbum = isTrackInPlaylist(
              activePlaylistObj.id,
              candidate.trackId
            );
            return (
              <div key={candidate.trackId} className="album-adder-row">
                <div className="album-adder-song">
                  {candidate.artwork ? (
                    <img src={candidate.artwork} alt={candidate.title} />
                  ) : (
                    <div className="album-adder-fallback">
                      <Disc3 size={18} />
                    </div>
                  )}
                  <div className="album-adder-meta">
                    <strong>{candidate.title}</strong>
                    <span>{candidate.artist}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={inCurrentAlbum ? "album-adder-btn is-added" : "album-adder-btn"}
                  onClick={() =>
                    onToggleSongInPlaylist(
                      activePlaylistObj.id,
                      activePlaylistObj.name,
                      candidate
                    )
                  }
                >
                  {inCurrentAlbum ? (
                    <>
                      <Check size={14} />
                      <span>Albümde</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Albüme Ekle</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
