"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  Compass,
  FolderPlus,
  Gem,
  Heart,
  ListMusic,
  Play,
  Sparkles,
  SunMedium,
  Trash2,
  Wand2,
} from "lucide-react";
import type { Song } from "@/types/music";
import SignOutButton from "@/components/sign-out-button";
import DiscoverPanel from "@/components/music/discover-panel";
import PersonalPanel from "@/components/music/personal-panel";
import SongGrid from "@/components/music/song-grid";
import MiniPlayer from "@/components/music/mini-player";
import { useLibrary } from "@/components/music/use-library";
import InstallAppButton from "@/components/pwa/install-app-button";

type Tab = "discover" | "daily" | "match" | "gems" | "smart" | "favorites" | "playlists";
const TABS: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: "discover", label: "Radyo", icon: Compass },
  { id: "daily", label: "Günlük", icon: SunMedium },
  { id: "match", label: "Eşleşme", icon: Sparkles },
  { id: "gems", label: "Alternatif", icon: Gem },
  { id: "smart", label: "Akıllı", icon: Wand2 },
  { id: "favorites", label: "Favoriler", icon: Heart },
  { id: "playlists", label: "Listeler", icon: ListMusic },
];

const COPY: Record<Tab, { kicker: string; title: string; subtitle: string }> = {
  discover: {
    kicker: "CANLI FREKANS",
    title: "Hangi frekanstasın?",
    subtitle: "Bir kanal seç; liste kalabalığı olmadan parça anında çalmaya başlasın.",
  },
  daily: {
    kicker: "GÜNÜN SEÇKİSİ",
    title: "Bugünün parçası.",
    subtitle: "Her gün senin için seçilen tek bir Türkçe kayıt.",
  },
  match: {
    kicker: "ZEVK ANALİZİ",
    title: "Frekansına yakın sesler.",
    subtitle: "Favorilediğin sanatçılara göre hiç dinlemediğin parçalar.",
  },
  gems: {
    kicker: "ALTERNATİF SAHNE",
    title: "Ana akımın ötesinde.",
    subtitle: "Bağımsız ve alternatif Türkçe sahneden seçkiler.",
  },
  smart: {
    kicker: "OTOMATİK KURGU",
    title: "Akıllı listeler.",
    subtitle: "Favorilerinden otomatik derlenen dinamik listeler.",
  },
  favorites: {
    kicker: "ARŞİV",
    title: "Favoriler.",
    subtitle: "Kaydettiğin tüm parçalar burada tutulur.",
  },
  playlists: {
    kicker: "KOLEKSİYONLAR",
    title: "Çalma listelerin.",
    subtitle: "Kendi listelerini oluştur, düzenle ve kesintisiz dinle.",
  },
};

export default function MusicDashboard({ userId, displayName }: { userId: string; displayName: string }) {
  const library = useLibrary(userId);
  const [tab, setTab] = useState<Tab>("discover");
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playlistName, setPlaylistName] = useState("");
  const song = queue[index] ?? null;

  const play = (songs: Song[], nextIndex: number) => {
    setQueue(songs);
    setIndex(nextIndex);
  };

  const activePlaylistObj = library.playlists.find((p) => p.id === library.activePlaylist) ?? null;

  const add = (track: Song) => {
    const playlistId = library.activePlaylist || library.playlists[0]?.id || "";
    if (!playlistId) {
      library.setMessage("Önce yeni bir çalma listesi oluştur.");
      setTab("playlists");
      return;
    }
    if (!library.activePlaylist) {
      library.setActivePlaylist(playlistId);
    }
    void library.addToPlaylist(playlistId, track);
  };

  return (
    <main className="music-app">
      {/* Sol Kenar Çubuğu */}
      <aside className="music-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <AudioLines size={18} />
            </span>
            VYBE<span className="lime">.</span>
          </Link>
          <span className="beta-tag">STUDIO</span>
        </div>

        <nav className="side-nav" aria-label="Ana menü">
          <span className="side-label">KEŞİF</span>
          {TABS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "side-link active" : "side-link"}
              onClick={() => setTab(item.id)}
            >
              <span className="side-icon">
                <item.icon size={16} />
              </span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}
          <span className="side-label">KÜTÜPHANE</span>
          {TABS.slice(5).map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "side-link active" : "side-link"}
              onClick={() => setTab(item.id)}
            >
              <span className="side-icon">
                <item.icon size={16} />
              </span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-pwa-slot">
          <InstallAppButton />
        </div>

        <div className="sidebar-bottom">
          <div className="side-user">
            <span className="side-avatar">{displayName.trim().charAt(0).toUpperCase() || "V"}</span>
            <div className="side-user-text">
              <b>{displayName}</b>
              <small>Üye</small>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* İçerik Alanı (Kendi İçinde Temiz Kaydırma) */}
      <section className="music-main">
        <header className="music-topbar">
          <div className="topbar-left">
            <Link href="/" className="mobile-brand">
              <span className="brand-mark">
                <AudioLines size={16} />
              </span>
              VYBE<span className="lime">.</span>
            </Link>
            <span className="eyebrow">{COPY[tab].kicker}</span>
          </div>
          <div className="topbar-right">
            <InstallAppButton compact />
            <div className="mobile-user">
              <span className="side-avatar mobile-avatar">
                {displayName.trim().charAt(0).toUpperCase() || "V"}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>

        <div className="music-heading">
          <div>
            <h1>{COPY[tab].title}</h1>
            <p>{COPY[tab].subtitle}</p>
          </div>
        </div>

        {library.message && <p className="music-message">{library.message}</p>}

        {tab === "discover" && (
          <DiscoverPanel
            favorites={library.favorites}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAdd={add}
          />
        )}

        {(tab === "daily" || tab === "match" || tab === "gems" || tab === "smart") && (
          <PersonalPanel
            key={tab}
            mode={tab}
            favorites={library.favorites}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAdd={add}
            onSaveSmart={library.saveSmart}
          />
        )}

        {tab === "favorites" && (
          <SongGrid
            songs={library.favorites}
            favorites={library.favorites}
            empty="Henüz favorilere eklenmiş bir parça yok."
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAdd={add}
          />
        )}

        {tab === "playlists" && (
          <div className="playlists-studio">
            {/* Üst Liste Oluşturma ve Hızlı Seçim Barı */}
            <div className="playlists-header-bar">
              <form
                className="playlist-create-bar"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (playlistName.trim()) {
                    void library.createPlaylist(playlistName.trim());
                    setPlaylistName("");
                  }
                }}
              >
                <FolderPlus size={17} />
                <input
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

            {/* Modern Liste Kartları / Sekmeleri (2000'lerden kalma <select> kaldırıldı) */}
            {library.playlists.length > 0 ? (
              <div className="playlist-cards-row">
                {library.playlists.map((list) => {
                  const isSelected = library.activePlaylist === list.id;
                  return (
                    <div
                      key={list.id}
                      className={isSelected ? "playlist-pill-card active" : "playlist-pill-card"}
                      onClick={() => library.setActivePlaylist(list.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") library.setActivePlaylist(list.id);
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
                            void library.deletePlaylist(list.id);
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

            {/* Seçili Listenin Başlığı ve İçeriği */}
            {activePlaylistObj && (
              <div className="active-playlist-section">
                <div className="active-playlist-banner">
                  <div>
                    <span className="eyebrow">AKTİF KOLEKSİYON</span>
                    <h2>{activePlaylistObj.name}</h2>
                    <small>{library.playlistSongs.length} parça</small>
                  </div>
                  <div className="active-playlist-actions">
                    {library.playlistSongs.length > 0 && (
                      <button
                        type="button"
                        className="action-btn next-btn"
                        onClick={() => play(library.playlistSongs, 0)}
                      >
                        <Play size={15} fill="currentColor" />
                        <span>Tümünü Oynat</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => void library.deletePlaylist(activePlaylistObj.id)}
                    >
                      <Trash2 size={15} />
                      <span>Listeyi Sil</span>
                    </button>
                  </div>
                </div>

                <SongGrid
                  songs={library.playlistSongs}
                  favorites={library.favorites}
                  empty="Bu listede henüz parça yok. Radyoda veya aramada beğendiğin şarkılarda 'Listeye Ekle' butonuna bas."
                  onPlay={play}
                  onFavorite={library.toggleFavorite}
                  onAdd={add}
                  onRemove={library.removeFromPlaylist}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Telefon ve Tablet İçin Alt Navigasyon Barı */}
      <nav className="mobile-bottom-nav" aria-label="Mobil alt menü">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "mobile-tab active" : "mobile-tab"}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <MiniPlayer
        song={song}
        onClose={() => setQueue([])}
        onPrev={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(queue.length - 1, value + 1))}
      />
    </main>
  );
}
