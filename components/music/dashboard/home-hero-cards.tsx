"use client";

import {
  ArrowRight,
  Disc3,
  ListEnd,
  Play,
  Radio,
  SunMedium,
} from "lucide-react";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import type { Tab } from "@/components/music/dashboard/dashboard-types";

type HomeHeroCardsProps = {
  displayName: string;
  featuredHeroSong: Song | null;
  dailySong: Song | null;
  homeSongs: Song[];
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  enqueue: (track: Song) => void;
  setTab: (tab: Tab) => void;
  startMoodFromHome: (targetMood: Mood) => void;
};

export default function HomeHeroCards({
  displayName,
  featuredHeroSong,
  dailySong,
  homeSongs,
  play,
  enqueue,
  setTab,
  startMoodFromHome,
}: HomeHeroCardsProps) {
  return (
    <div className="home-hero-grid">
      <div className="home-welcome-card">
        {featuredHeroSong?.artwork && (
          <div
            className="home-welcome-ambient"
            style={{ backgroundImage: `url(${featuredHeroSong.artwork})` }}
          />
        )}
        <div className="home-welcome-content">
          <div className="home-welcome-badge-row">
            <span className="live-badge">
              <span className="live-dot" /> HOŞ GELDİN, {displayName.toUpperCase()}
            </span>
            <span className="mood-tag">KESİNTİSİZ STÜDYO AKIŞI</span>
          </div>
          <h2>
            {featuredHeroSong ? featuredHeroSong.title : "Kendi Frekansını Keşfet"}
          </h2>
          <p className="home-welcome-desc">
            {featuredHeroSong
              ? `${featuredHeroSong.artist} · Öne çıkan stüdyo kaydı anında dinlemeye hazır.`
              : "Bağımsız Türkçe sahneden seçkiler, akıllı listeler ve canlı frekans kanalları."}
          </p>
          <div className="home-welcome-actions">
            <button
              type="button"
              className="action-btn next-btn"
              onClick={() => {
                if (featuredHeroSong) {
                  play(
                    [
                      featuredHeroSong,
                      ...homeSongs.filter((s) => s.trackId !== featuredHeroSong.trackId),
                    ],
                    0,
                    { type: "gems", label: "Öne Çıkan Seçki" }
                  );
                } else {
                  startMoodFromHome("Chill");
                }
              }}
            >
              <Play size={15} fill="currentColor" />
              <span>Hemen Dinle</span>
            </button>
            {featuredHeroSong && (
              <button
                type="button"
                className="action-btn"
                onClick={() => enqueue(featuredHeroSong)}
              >
                <ListEnd size={15} />
                <span>Sıraya Ekle</span>
              </button>
            )}
            <button
              type="button"
              className="action-btn"
              onClick={() => setTab("discover")}
            >
              <Radio size={15} />
              <span>Canlı Frekanslar</span>
            </button>
          </div>
        </div>

        <div className="home-welcome-cover">
          {featuredHeroSong?.artwork ? (
            <img src={featuredHeroSong.artwork} alt={featuredHeroSong.title} />
          ) : (
            <div className="home-welcome-cover-fallback">
              <Disc3 size={52} />
            </div>
          )}
        </div>
      </div>

      <div className="home-daily-card">
        <div className="home-daily-top">
          <span className="eyebrow">
            <SunMedium size={13} /> GÜNÜN PARÇASI
          </span>
          <button
            type="button"
            className="text-action"
            onClick={() => setTab("daily")}
          >
            Detay <ArrowRight size={12} />
          </button>
        </div>

        {dailySong ? (
          <div className="home-daily-body">
            <button
              type="button"
              className="home-daily-cover-btn"
              onClick={() => play([dailySong], 0, { type: "daily", label: "Günün Parçası" })}
              aria-label={`${dailySong.title} çal`}
            >
              {dailySong.artwork ? (
                <img src={dailySong.artwork} alt={dailySong.title} />
              ) : (
                <span className="home-daily-fallback">
                  <Disc3 size={34} />
                </span>
              )}
              <span className="cover-play-badge">
                <Play size={16} fill="currentColor" />
              </span>
            </button>
            <div className="home-daily-meta">
              <strong title={dailySong.title}>{dailySong.title}</strong>
              <span title={dailySong.artist}>{dailySong.artist}</span>
              <div className="home-daily-actions">
                <button
                  type="button"
                  className="action-btn next-btn"
                  onClick={() => play([dailySong], 0, { type: "daily", label: "Günün Parçası" })}
                >
                  <Play size={14} fill="currentColor" />
                  <span>Oynat</span>
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => enqueue(dailySong)}
                >
                  <ListEnd size={14} />
                  <span>Sıraya</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="home-daily-empty">
            <Disc3 size={28} />
            <span>Günün özel seçkisi için Günlük Parça sekmesine göz at.</span>
            <button type="button" className="action-btn" onClick={() => setTab("daily")}>
              Günün Parçasını Aç
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
