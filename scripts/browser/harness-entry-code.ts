import { SAMPLE_SONGS_CODE } from "./sample-songs-code";

export function getHarnessEntryCode(): string {
  return `
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";
    import SongGrid from "./components/music/song-grid";
    import MusicDashboard from "./components/music/music-dashboard";

    ${SAMPLE_SONGS_CODE}

    function TestHarnessApp() {
      const [songs, setSongs] = useState(SAMPLE_SONGS);
      const [favorites, setFavorites] = useState([SAMPLE_SONGS[1]]);
      const [queue, setQueue] = useState([SAMPLE_SONGS[0]]);
      const [index, setIndex] = useState(0);
      const [playlistAdded, setPlaylistAdded] = useState([]);
      const [removedIds, setRemovedIds] = useState([]);
      const [lastToast, setLastToast] = useState("");

      const handlePlay = (newSongs, nextIdx) => {
        setQueue(newSongs);
        setIndex(nextIdx);
      };

      const handleFavorite = (song) => {
        setFavorites((prev) =>
          prev.some((f) => f.trackId === song.trackId)
            ? prev.filter((f) => f.trackId !== song.trackId)
            : [song, ...prev]
        );
      };

      const handleEnqueue = (track) => {
        setQueue((prev) => {
          if (prev.some((item) => item.trackId === track.trackId)) {
            setLastToast(\`"\${track.title}" zaten oynatma sırasında.\`);
            return prev;
          }
          setLastToast(\`"\${track.title}" sıraya eklendi.\`);
          return [...prev, track];
        });
      };

      const handleAddToPlaylist = (track) => {
        setPlaylistAdded((prev) => [...prev, track.trackId]);
        setLastToast(\`"\${track.title}" çalma listesine eklendi.\`);
      };

      const handleRemove = (track) => {
        setRemovedIds((prev) => [...prev, track.trackId]);
        setSongs((prev) => prev.filter((s) => s.trackId !== track.trackId));
      };

      window.__VYBE_TEST_STATE__ = {
        songs,
        favorites,
        queue,
        index,
        currentPlaying: queue[index] || null,
        playlistAdded,
        removedIds,
        lastToast,
        resetSongs: () => {
          setSongs(SAMPLE_SONGS);
          setLastToast("");
        },
      };

      return (
        <div>
          <SongGrid
            songs={songs}
            favorites={favorites}
            empty="Parça yok"
            source={{ type: "gems", label: "Alternatif" }}
            onPlay={handlePlay}
            onFavorite={handleFavorite}
            onAddToQueue={handleEnqueue}
            onAdd={handleAddToPlaylist}
            onRemove={handleRemove}
          />
          {lastToast && (
            <div className="music-toast" id="test-toast" role="status">
              <span>{lastToast}</span>
            </div>
          )}
        </div>
      );
    }

    const rootEl = document.getElementById("react-song-grid-root");
    if (rootEl) {
      const root = createRoot(rootEl);
      root.render(<TestHarnessApp />);
    }

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const urlStr = typeof input === "string" ? input : input.url || "";
      if (urlStr.includes("/api/music/daily")) {
        return new Response(JSON.stringify({ song: SAMPLE_SONGS[0] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/api/music/smart")) {
        return new Response(
          JSON.stringify({
            suggestions: [
              { name: "Anadolu & Alternatif Seçki", songs: SAMPLE_SONGS.slice(0, 3) },
              { name: "Gece Frekansı", songs: SAMPLE_SONGS.slice(2, 5) },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/music/")) {
        return new Response(JSON.stringify({ songs: SAMPLE_SONGS, exhausted: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return origFetch(input, init);
    };

    window.__MOUNT_FULL_DASHBOARD__ = (initialTab = "home") => {
      try {
        Object.defineProperty(HTMLMediaElement.prototype, "src", {
          configurable: true,
          get() { return this._mockSrc || ""; },
          set(v) { this._mockSrc = v; },
        });
        Object.defineProperty(HTMLMediaElement.prototype, "duration", {
          configurable: true,
          get() { return 214; },
        });
        Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
          configurable: true,
          get() { return this._mockTime ?? 68; },
          set(v) { this._mockTime = v; },
        });
        HTMLMediaElement.prototype.load = function () {
          setTimeout(() => {
            this.dispatchEvent(new Event("loadedmetadata"));
            this.dispatchEvent(new Event("timeupdate"));
          }, 10);
        };
        HTMLMediaElement.prototype.play = function () {
          this.dispatchEvent(new Event("loadedmetadata"));
          this.dispatchEvent(new Event("timeupdate"));
          return Promise.resolve();
        };
      } catch {}
      document.body.innerHTML = '<div id="full-dashboard-mount"></div>';
      const mountEl = document.getElementById("full-dashboard-mount");
      if (mountEl) {
        const dashRoot = createRoot(mountEl);
        dashRoot.render(
          <MusicDashboard userId="usr-vybe-test" displayName="Efe" initialTab={initialTab} />
        );
      }
    };
  `;
}
