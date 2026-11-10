"use client";

import {
  ChevronDown,
  Disc3,
  Heart,
  Loader2,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import type { Song } from "@/types/music";

type HeaderProps = {
  onCollapse: () => void;
  onClose: () => void;
};

export function PlayerExpandedHeader({ onCollapse, onClose }: HeaderProps) {
  return (
    <div className="player-expanded-header">
      <button
        type="button"
        className="icon-action player-collapse-btn"
        onClick={onCollapse}
        aria-label="Tam ekran oynatıcıyı küçült"
        title="Küçült"
      >
        <ChevronDown size={22} />
      </button>
      <span className="player-expanded-kicker">ŞİMDİ ÇALIYOR</span>
      <button
        type="button"
        className="icon-action player-close-btn"
        onClick={onClose}
        aria-label="Oynatıcıyı Kapat"
        title="Kapat"
      >
        <X size={18} />
      </button>
    </div>
  );
}

type TrackInfoProps = {
  song: Song;
  onMobileToggleExpand: () => void;
};

export function PlayerTrackInfo({ song, onMobileToggleExpand }: TrackInfoProps) {
  return (
    <>
      {song.artwork ? (
        <img
          src={song.artwork}
          alt={song.title}
          className="player-artwork"
          onClick={onMobileToggleExpand}
        />
      ) : (
        <span className="player-fallback" onClick={onMobileToggleExpand}>
          <Disc3 size={22} />
        </span>
      )}

      <div className="player-track" onClick={onMobileToggleExpand}>
        <strong title={song.title}>{song.title}</strong>
        <span title={song.artist}>{song.artist}</span>
      </div>
    </>
  );
}

type TransportProps = {
  playing: boolean;
  loading: boolean;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
};

export function PlayerTransport({
  playing,
  loading,
  onPrev,
  onTogglePlay,
  onNext,
}: TransportProps) {
  return (
    <div className="player-transport">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Önceki Şarkı"
        title="Önceki (3s sonrası başa sarar)"
      >
        <SkipBack size={16} />
      </button>
      <button
        type="button"
        className="player-control"
        onClick={onTogglePlay}
        aria-label={playing ? "Duraklat" : "Oynat"}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={18} className="spin-fast" />
        ) : playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Sonraki Şarkı"
        title="Sonraki Parça"
      >
        <SkipForward size={16} />
      </button>
    </div>
  );
}

type FavoriteButtonProps = {
  active: boolean;
  pending: boolean;
  onToggle: () => void;
};

export function PlayerFavoriteButton({ active, pending, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`icon-action player-fav-btn ${active ? "is-active" : ""}`}
      onClick={onToggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      title={active ? "Favorilerden çıkar" : "Favorilere ekle"}
    >
      {pending ? <Loader2 size={16} className="spin-fast" /> : <Heart size={17} fill={active ? "currentColor" : "none"} />}
    </button>
  );
}

type ActionButtonsProps = {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
};

export function PlayerActionButtons({
  expanded,
  onExpand,
  onClose,
}: ActionButtonsProps) {
  if (expanded) return null;
  return (
    <>
      <button
        type="button"
        className="icon-action player-expand-btn"
        onClick={onExpand}
        aria-label="Tam ekran oynatıcıyı aç"
        title="Tam Ekran Oynatıcı"
      >
        <Maximize2 size={15} />
      </button>
      <button
        type="button"
        className="icon-action player-close-btn"
        onClick={onClose}
        aria-label="Oynatıcıyı Kapat"
        title="Kapat"
      >
        <X size={18} />
      </button>
    </>
  );
}
