"use client";

import {
  Disc3,
  Heart,
  ListEnd,
  ListPlus,
  Loader2,
  Radio,
  Shuffle,
  Sparkles,
} from "lucide-react";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import { MOOD_META } from "@/components/music/discover/mood-grid";

type NowPlayingCardProps = {
  currentSong: Song | null;
  mood: Mood | null;
  isFav: boolean;
  isPendingFavorite: boolean;
  loading: boolean;
  onPlay: (songs: Song[], index: number, source?: PlaybackSource) => void;
  onFavorite: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAdd: (song: Song) => void;
  onNextRandom: () => void;
};

export default function NowPlayingCard({
  currentSong,
  mood,
  isFav,
  isPendingFavorite,
  loading,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAdd,
  onNextRandom,
}: NowPlayingCardProps) {
  if (!currentSong) {
    return (
      <div className="radio-placeholder">
        <div className="pulse-disc">
          <Radio size={28} />
        </div>
        <h3>Bir Frekans Seç</h3>
        <p>
          Yukarıdaki 8 kanaldan birini seç veya <b>Rastgele Frekans</b> butonuna dokun; yayın anında başlasın.
        </p>
      </div>
    );
  }

  return (
    <div className="now-playing-card">
      <div
        className="now-playing-ambient"
        style={
          currentSong.artwork
            ? { backgroundImage: `url(${currentSong.artwork})` }
            : undefined
        }
      />
      <div className="now-playing-cover-wrap">
        {currentSong.artwork ? (
          <img
            src={currentSong.artwork}
            alt={currentSong.title}
            className="now-playing-img"
          />
        ) : (
          <div className="now-playing-fallback">
            <Disc3 size={48} />
          </div>
        )}
        <div className="equalizer-bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="now-playing-details">
        <div className="live-badge-row">
          <span className="live-badge">
            <span className="live-dot" /> ON AIR
          </span>
          {mood && <span className="mood-tag">{MOOD_META[mood].desc}</span>}
          {currentSong.genre && <span className="mood-tag">{currentSong.genre}</span>}
          {currentSong.license && <span className="mood-tag">{currentSong.license}</span>}
        </div>
        <h2>{currentSong.title}</h2>
        <h3>{currentSong.artist}</h3>
        <p className="listen-rule-hint">
          15 saniye dinlenen parçalar otomatik arşivlenir ve tekrar önerilmez.
        </p>
        <div className="now-playing-actions">
          <button
            type="button"
            className="action-btn next-btn"
            onClick={() =>
              onPlay(
                [currentSong],
                0,
                mood ? { type: "mood", mood } : { type: "direct" }
              )
            }
          >
            <Sparkles size={15} />
            <span>Şimdi Çal</span>
          </button>
          <button
            type="button"
            className={`action-btn ${isFav ? "fav-active" : ""}`}
            onClick={() => onFavorite(currentSong)}
            disabled={isPendingFavorite}
          >
            {isPendingFavorite ? (
              <Loader2 size={15} className="spin-fast" />
            ) : (
              <Heart size={15} fill={isFav ? "currentColor" : "none"} />
            )}
            <span>{isFav ? "Favorilerde" : "Favorilere Ekle"}</span>
          </button>
          {onAddToQueue && (
            <button
              type="button"
              className="action-btn"
              onClick={() => onAddToQueue(currentSong)}
            >
              <ListEnd size={16} />
              <span>Sıraya Ekle</span>
            </button>
          )}
          <button
            type="button"
            className="action-btn"
            onClick={() => onAdd(currentSong)}
          >
            <ListPlus size={16} />
            <span>Listeye Ekle</span>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onNextRandom}
            disabled={loading}
          >
            <Shuffle size={15} />
            <span>{loading ? "Geçiliyor..." : "Sıradaki Parça"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
