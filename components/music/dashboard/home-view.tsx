"use client";

import { MOODS } from "@/lib/music/moods";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import type { useLibrary } from "@/components/music/use-library";
import { MOOD_META } from "@/components/music/discover-panel";
import SongGrid from "@/components/music/song-grid";
import type { Tab } from "@/components/music/dashboard/dashboard-types";
import HomeHeroCards from "@/components/music/dashboard/home-hero-cards";
import HomeCollectionsSummary from "@/components/music/dashboard/home-collections-summary";

type HomeViewProps = {
  displayName: string;
  featuredHeroSong: Song | null;
  dailySong: Song | null;
  homeSongs: Song[];
  homeLoading: boolean;
  library: ReturnType<typeof useLibrary>;
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  enqueue: (track: Song) => void;
  add: (track: Song) => void;
  setTab: (tab: Tab) => void;
  startMoodFromHome: (targetMood: Mood) => void;
};

export default function HomeView({
  displayName,
  featuredHeroSong,
  dailySong,
  homeSongs,
  homeLoading,
  library,
  play,
  enqueue,
  add,
  setTab,
  startMoodFromHome,
}: HomeViewProps) {
  const { favorites, pendingFavorites, playlists, toggleFavorite } = library;

  return (
    <div className="home-dashboard">
      <HomeHeroCards
        displayName={displayName}
        featuredHeroSong={featuredHeroSong}
        dailySong={dailySong}
        homeSongs={homeSongs}
        play={play}
        enqueue={enqueue}
        setTab={setTab}
        startMoodFromHome={startMoodFromHome}
      />

      <section className="home-section">
        <div className="section-caption">
          <span>RUH HÂLİ &amp; MÜZİK KEŞİF ALANLARI</span>
          <button
            type="button"
            className="text-action"
            onClick={() => setTab("discover")}
          >
            Tüm Frekanslar
          </button>
        </div>
        <div className="mood-grid">
          {MOODS.map((item) => {
            const meta = MOOD_META[item];
            const Icon = meta.icon;
            return (
              <button
                key={item}
                type="button"
                className={`mood-card mood-${item.toLowerCase()}`}
                onClick={() => startMoodFromHome(item)}
              >
                <div className="mood-card-top">
                  <span className="mood-icon-box">
                    <Icon size={16} />
                  </span>
                  <span className="mood-tag-code">{meta.tag}</span>
                </div>
                <div className="mood-card-Bottom">
                  <b>{meta.label}</b>
                  <small>{meta.desc}</small>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-caption">
          <span>ÖNE ÇIKAN &amp; KİŞİSELLEŞTİRİLMİŞ SEÇKİLER</span>
          <button
            type="button"
            className="text-action"
            onClick={() => setTab("gems")}
          >
            Tümünü Gör
          </button>
        </div>
        <SongGrid
          songs={homeSongs.length > 0 ? homeSongs : favorites}
          favorites={favorites}
          pendingFavorites={pendingFavorites}
          empty={
            homeLoading
              ? "Kişiselleştirilmiş müzik kartları hazırlanıyor..."
              : "Keşfet sekmesinden bir frekans seçerek müzik akışını başlat."
          }
          source={{ type: "gems", label: "Ana Dashboard Seçkisi" }}
          onPlay={play}
          onFavorite={toggleFavorite}
          onAddToQueue={enqueue}
          onAdd={add}
        />
      </section>

      <HomeCollectionsSummary
        favoritesCount={favorites.length}
        playlistsCount={playlists.length}
        setTab={setTab}
      />
    </div>
  );
}
