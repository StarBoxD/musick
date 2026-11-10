"use client";

import { Heart, Play } from "lucide-react";
import type { PlaybackSource, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

type FavoritesViewProps = {
  favorites: Song[];
  pendingFavorites: Set<string>;
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  toggleFavorite: (song: Song) => void;
  enqueue: (track: Song) => void;
  add: (track: Song) => void;
};

export default function FavoritesView({
  favorites,
  pendingFavorites,
  play,
  toggleFavorite,
  enqueue,
  add,
}: FavoritesViewProps) {
  return (
    <div className="favorites-wrap">
      <div className="collection-hero-banner">
        <div className="collection-hero-left">
          <div className="collection-hero-emblem">
            <Heart size={28} fill="currentColor" />
          </div>
          <div className="collection-hero-text">
            <span className="eyebrow">FAVORİ KOLEKSİYONU</span>
            <h2>Beğendiğin Şarkılar</h2>
            <small>
              {favorites.length > 0
                ? `${favorites.length} parça kütüphanende kayıtlı`
                : "Beğendiğin parçaları üç nokta menüsünden buraya ekleyebilirsin"}
            </small>
          </div>
        </div>
        {favorites.length > 0 && (
          <div className="collection-hero-actions">
            <button
              type="button"
              className="action-btn next-btn"
              onClick={() =>
                play(favorites, 0, {
                  type: "favorites",
                  label: "Favoriler",
                })
              }
            >
              <Play size={15} fill="currentColor" />
              <span>Tümünü Oynat</span>
            </button>
          </div>
        )}
      </div>

      <SongGrid
        songs={favorites}
        favorites={favorites}
        pendingFavorites={pendingFavorites}
        empty="Henüz favorilere eklenmiş bir parça yok."
        source={{ type: "favorites", label: "Favoriler" }}
        onPlay={play}
        onFavorite={toggleFavorite}
        onAddToQueue={enqueue}
        onAdd={add}
      />
    </div>
  );
}
