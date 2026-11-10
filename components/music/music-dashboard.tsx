"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioLines, Compass, Gem, Heart, ListMusic, Sparkles, SunMedium, Wand2 } from "lucide-react";
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
  { id: "discover", label: "Keşfet", icon: Compass },
  { id: "daily", label: "Günlük", icon: SunMedium },
  { id: "match", label: "Eşleşme", icon: Sparkles },
  { id: "gems", label: "Gizli", icon: Gem },
  { id: "smart", label: "Akıllı", icon: Wand2 },
  { id: "favorites", label: "Favoriler", icon: Heart },
  { id: "playlists", label: "Listeler", icon: ListMusic },
];

const COPY: Record<Tab, { kicker: string; title: string; subtitle: string }> = {
  discover: {
    kicker: "TÜRKÇE ÖZEL RADYO",
    title: "Bugün hangi ruh hâli?",
    subtitle: "Bir moda dokun; liste kalabalığı olmadan şarkı anında çalmaya başlasın.",
  },
  daily: {
    kicker: "GÜNÜN FREKANSI",
    title: "Bugünün özel parçası.",
    subtitle: "Her gün senin için seçilen tek bir Türkçe parça.",
  },
  match: {
    kicker: "VYBE EŞLEŞME",
    title: "Zevkine yakın sesler.",
    subtitle: "Favorilediğin sanatçılara göre hiç duymadığın parçalar.",
  },
  gems: {
    kicker: "GİZLİ HAZİNELER",
    title: "Ana akımın ötesinde.",
    subtitle: "Bağımsız ve alternatif Türkçe sahneden seçkiler.",
  },
  smart: {
    kicker: "AKILLI LİSTELER",
    title: "Sana özel kurulan listeler.",
    subtitle: "Favorilerinden otomatik derlenen ruh hâli listeleri.",
  },
  favorites: {
    kicker: "KOLEKSİYON",
    title: "Favorilediğin parçalar.",
    subtitle: "Kalp bıraktığın tüm şarkılar burada saklanır.",
  },
  playlists: {
    kicker: "PLAYLİSTLER",
    title: "Kendi listelerin.",
    subtitle: "Özel çalma listelerini oluştur ve yönet.",
  },
};

export default function MusicDashboard({ userId, displayName }: { userId: string; displayName: string }) {
  const library = useLibrary(userId);
  const [tab, setTab] = useState<Tab>("discover");
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playlistName, setPlaylistName] = useState("");
  const [selected, setSelected] = useState("");
  const song = queue[index] ?? null;
  const play = (songs: Song[], nextIndex: number) => {
    setQueue(songs);
    setIndex(nextIndex);
  };
  const add = (track: Song) => {
    const playlistId = selected || library.activePlaylist;
    if (!playlistId) {
      library.setMessage("Önce bir playlist seç.");
      setTab("playlists");
      return;
    }
    void library.addToPlaylist(playlistId, track);
  };

  return (
    <main className="music-app">
      {/* PC Yüzen Cam Kenar Çubuğu (Scrollbar'sız) */}
      <aside className="music-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <AudioLines size={19} />
            </span>
            VYBE<span className="lime">.</span>
          </Link>
          <span className="beta-tag">PRO</span>
        </div>

        <nav className="side-nav" aria-label="Ana menü">
          <span className="side-label">RADYO &amp; KEŞİF</span>
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
          <span className="side-label">KÜTÜPHANEM</span>
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
              <small>Özel Üye</small>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <section className="music-main">
        <header className="music-topbar">
          <div className="topbar-left">
            <Link href="/" className="mobile-brand">
              <span className="brand-mark">
                <AudioLines size={17} />
              </span>
              VYBE<span className="lime">.</span>
            </Link>
            <span className="eyebrow">
              <Sparkles size={13} /> {COPY[tab].kicker}
            </span>
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
            empty="Henüz favorilediğin bir şarkı yok."
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAdd={add}
          />
        )}
        {tab === "playlists" && (
          <div>
            <form
              className="create-list"
              onSubmit={(event) => {
                event.preventDefault();
                if (playlistName.trim()) {
                  void library.createPlaylist(playlistName.trim());
                  setPlaylistName("");
                }
              }}
            >
              <input
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Yeni playlist adı..."
                maxLength={40}
              />
              <button>Oluştur</button>
            </form>
            <div className="playlist-tools">
              <select
                value={selected}
                onChange={(event) => {
                  setSelected(event.target.value);
                  library.setActivePlaylist(event.target.value);
                }}
              >
                <option value="">Liste seç</option>
                {library.playlists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              {library.activePlaylist && (
                <button
                  className="text-action"
                  onClick={() => void library.deletePlaylist(library.activePlaylist)}
                >
                  Listeyi sil
                </button>
              )}
            </div>
            <SongGrid
              songs={library.playlistSongs}
              favorites={library.favorites}
              empty="Bir liste seç veya yeni oluştur."
              onPlay={play}
              onFavorite={library.toggleFavorite}
              onAdd={add}
              onRemove={library.removeFromPlaylist}
            />
          </div>
        )}
      </section>

      {/* Telefon İçin Sabit Alt Uygulama Navigasyonu (Native App Bottom Tab Bar) */}
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
