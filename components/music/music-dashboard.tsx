"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Song } from "@/types/music";
import DiscoverPanel, { type PlaybackSource } from "@/components/music/discover-panel";
import PersonalPanel from "@/components/music/personal-panel";
import MiniPlayer from "@/components/music/mini-player";
import { useLibrary } from "@/components/music/use-library";
import {
  COPY,
  MORE_MOBILE_TABS,
  PRIMARY_MOBILE_TABS,
  TABS,
  type Tab,
} from "@/components/music/dashboard/dashboard-types";
import { useViewportBottomSync } from "@/components/music/dashboard/use-viewport-bottom-sync";
import { usePlaybackQueue } from "@/components/music/dashboard/use-playback-queue";
import { useDashboardController, useToastNotification } from "@/components/music/dashboard/use-dashboard-controller";
import MusicSidebar from "@/components/music/dashboard/music-sidebar";
import MusicTopbar from "@/components/music/dashboard/music-topbar";
import HomeView from "@/components/music/dashboard/home-view";
import FavoritesView from "@/components/music/dashboard/favorites-view";
import PlaylistsView from "@/components/music/dashboard/playlists-view";
import MobileBottomNav from "@/components/music/dashboard/mobile-bottom-nav";
import PlaylistPickerModal from "@/components/music/dashboard/playlist-picker-modal";

export { COPY, MORE_MOBILE_TABS, PRIMARY_MOBILE_TABS, TABS, type Tab, type PlaybackSource };

export default function MusicDashboard({
  userId,
  displayName,
  initialTab = "home",
}: {
  userId: string;
  displayName: string;
  initialTab?: Tab;
}) {
  const library = useLibrary(userId);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [topbarSearch, setTopbarSearch] = useState("");
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [pickerSong, setPickerSong] = useState<Song | null>(null);
  const { toastNote, showToast } = useToastNotification();

  useViewportBottomSync(tab);

  const { queue, setQueue, index, setIndex, song, play, enqueue, fetchMoreSongs } =
    usePlaybackQueue({
      setMessage: library.setMessage,
      showToast,
    });

  const {
    homeSongs,
    dailySong,
    homeLoading,
    startMoodFromHome,
    handleToggleSongInPlaylist,
    handleCreatePlaylistAndAdd,
  } = useDashboardController({
    library,
    play,
    setTab,
    showToast,
  });

  const featuredHeroSong = song ?? dailySong ?? homeSongs[0] ?? library.favorites[0] ?? null;

  return (
    <main className="music-app" id="music-app">
      <MusicSidebar
        tab={tab}
        setTab={setTab}
        displayName={displayName}
        favoritesCount={library.favorites.length}
        playlists={library.playlists}
        activePlaylist={library.activePlaylist}
        setActivePlaylist={library.setActivePlaylist}
      />

      <section className="music-main" id="music-main">
        <MusicTopbar
          tab={tab}
          setTab={setTab}
          displayName={displayName}
          topbarSearch={topbarSearch}
          setTopbarSearch={setTopbarSearch}
          onQuickSearch={(q) => {
            setExternalSearchQuery(q);
            setTab("discover");
          }}
          onStartRandomMood={() => void startMoodFromHome("Chill")}
        />

        {library.message && <p className="music-message">{library.message}</p>}

        {tab === "home" && (
          <HomeView
            displayName={displayName}
            featuredHeroSong={featuredHeroSong}
            dailySong={dailySong}
            homeSongs={homeSongs}
            homeLoading={homeLoading}
            library={library}
            play={play}
            enqueue={enqueue}
            add={setPickerSong}
            setTab={setTab}
            startMoodFromHome={(m) => void startMoodFromHome(m)}
          />
        )}

        {tab === "discover" && (
          <DiscoverPanel
            favorites={library.favorites}
            pendingFavorites={library.pendingFavorites}
            externalQuery={externalSearchQuery}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAddToQueue={enqueue}
            onAdd={setPickerSong}
          />
        )}

        {(tab === "daily" || tab === "match" || tab === "gems" || tab === "smart") && (
          <PersonalPanel
            key={tab}
            mode={tab}
            favorites={library.favorites}
            pendingFavorites={library.pendingFavorites}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAddToQueue={enqueue}
            onAdd={setPickerSong}
            onSaveSmart={library.saveSmart}
          />
        )}

        {tab === "favorites" && (
          <FavoritesView
            favorites={library.favorites}
            pendingFavorites={library.pendingFavorites}
            play={play}
            toggleFavorite={library.toggleFavorite}
            enqueue={enqueue}
            add={setPickerSong}
          />
        )}

        {tab === "playlists" && (
          <PlaylistsView
            library={library}
            homeSongs={homeSongs}
            onToggleSongInPlaylist={(pid, ptitle, trk) =>
              void handleToggleSongInPlaylist(pid, ptitle, trk)
            }
            play={play}
            enqueue={enqueue}
            add={setPickerSong}
          />
        )}
      </section>

      {toastNote && (
        <div className="music-toast" role="status" aria-live="polite">
          <Check size={14} />
          <span>{toastNote}</span>
        </div>
      )}

      <MobileBottomNav tab={tab} setTab={setTab} />

      <PlaylistPickerModal
        pickerSong={pickerSong}
        playlists={library.playlists}
        isTrackInPlaylist={library.isTrackInPlaylist}
        onToggleSongInPlaylist={(pid, ptitle, trk) =>
          void handleToggleSongInPlaylist(pid, ptitle, trk)
        }
        onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
        onClose={() => setPickerSong(null)}
      />

      <MiniPlayer
        song={song}
        favoriteSource={library}
        hasPrev={index > 0}
        hasNext={index < queue.length - 1}
        onClose={() => setQueue([])}
        onPrev={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(queue.length - 1, value + 1))}
        onNeedMoreSongs={fetchMoreSongs}
      />
    </main>
  );
}
