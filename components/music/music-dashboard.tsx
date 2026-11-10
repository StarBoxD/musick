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

const COPY: Record<Tab, { kicker: string; title: string }> = {
  discover: { kicker: "MOOD", title: "Bugün hangi ruh hâli?" },
  daily: { kicker: "DAILY VYBE", title: "Bugünün parçası." },
  match: { kicker: "VYBE MATCH", title: "Zevkine yakın, duymadığın parçalar." },
  gems: { kicker: "HIDDEN GEMS", title: "Hit listesinin dışında." },
  smart: { kicker: "SMART", title: "Favorilerinden kurulan listeler." },
  favorites: { kicker: "SAVED", title: "Sakladığın parçalar." },
  playlists: { kicker: "LISTS", title: "Kendi listelerin." },
};

export default function MusicDashboard({ userId, displayName }: { userId: string; displayName: string }) {
  const library = useLibrary(userId);
  const [tab, setTab] = useState<Tab>("discover");
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playlistName, setPlaylistName] = useState("");
  const [selected, setSelected] = useState("");
  const song = queue[index] ?? null;
  const play = (songs: Song[], nextIndex: number) => { setQueue(songs); setIndex(nextIndex); };
  const add = (track: Song) => {
    const playlistId = selected || library.activePlaylist;
    if (!playlistId) { library.setMessage("Önce bir playlist seç."); setTab("playlists"); return; }
    void library.addToPlaylist(playlistId, track);
  };

  return (
    <main className="music-app">
      <aside className="music-sidebar">
        <Link href="/" className="brand"><span className="brand-mark"><AudioLines size={20} /></span> VYBE<span className="lime">.</span></Link>
        <nav className="side-nav">
          <span className="side-label">KEŞİF</span>
          {TABS.slice(0, 5).map((item) => (
            <button key={item.id} className={tab === item.id ? "side-link active" : "side-link"} onClick={() => setTab(item.id)}>
              <span className="side-icon"><item.icon size={16} /></span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}
          <span className="side-label">KÜTÜPHANE</span>
          {TABS.slice(5).map((item) => (
            <button key={item.id} className={tab === item.id ? "side-link active" : "side-link"} onClick={() => setTab(item.id)}>
              <span className="side-icon"><item.icon size={16} /></span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-user">
            <span className="side-avatar">{displayName.trim().charAt(0).toUpperCase() || "V"}</span>
            <div className="side-user-text"><b>{displayName}</b><small>Private beta</small></div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <section className="music-main">
        <header className="music-topbar">
          <span className="eyebrow"><Sparkles size={13} /> {COPY[tab].kicker}</span>
          <div className="mobile-user">{displayName}<SignOutButton /></div>
        </header>
        <div className="music-heading"><div><h1>{COPY[tab].title}</h1><p>Türkçe özel radyo deneyimi. Bir moda tıkla, aralıksız rastgele çalsın.</p></div></div>
        {library.message && <p className="music-message">{library.message}</p>}
        {tab === "discover" && <DiscoverPanel favorites={library.favorites} onPlay={play} onFavorite={library.toggleFavorite} onAdd={add} />}
        {(tab === "daily" || tab === "match" || tab === "gems" || tab === "smart") && (
          <PersonalPanel key={tab} mode={tab} favorites={library.favorites} onPlay={play} onFavorite={library.toggleFavorite} onAdd={add} onSaveSmart={library.saveSmart} />
        )}
        {tab === "favorites" && <SongGrid songs={library.favorites} favorites={library.favorites} empty="Henüz favorin yok." onPlay={play} onFavorite={library.toggleFavorite} onAdd={add} />}
        {tab === "playlists" && (
          <div>
            <form className="create-list" onSubmit={(event) => { event.preventDefault(); if (playlistName.trim()) { void library.createPlaylist(playlistName.trim()); setPlaylistName(""); } }}>
              <input value={playlistName} onChange={(event) => setPlaylistName(event.target.value)} placeholder="Yeni playlist adı" maxLength={40} />
              <button>Oluştur</button>
            </form>
            <div className="playlist-tools">
              <select value={selected} onChange={(event) => { setSelected(event.target.value); library.setActivePlaylist(event.target.value); }}>
                <option value="">Liste seç</option>
                {library.playlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
              {library.activePlaylist && <button className="text-action" onClick={() => void library.deletePlaylist(library.activePlaylist)}>Listeyi sil</button>}
            </div>
            <SongGrid songs={library.playlistSongs} favorites={library.favorites} empty="Bir liste seç veya oluştur." onPlay={play} onFavorite={library.toggleFavorite} onAdd={add} onRemove={library.removeFromPlaylist} />
          </div>
        )}
      </section>
      <MiniPlayer song={song} onClose={() => setQueue([])} onPrev={() => setIndex((value) => Math.max(0, value - 1))} onNext={() => setIndex((value) => Math.min(queue.length - 1, value + 1))} />
    </main>
  );
}
