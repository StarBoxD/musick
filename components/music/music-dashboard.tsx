"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AudioLines, Compass, Heart, ListMusic, Plus, Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { searchMusic } from "@/lib/music/itunes";
import type { Playlist, Song } from "@/types/music";
import SignOutButton from "@/components/sign-out-button";
import SongCard from "@/components/music/song-card";
import MiniPlayer from "@/components/music/mini-player";

type Props = { userId: string; displayName: string };

export default function MusicDashboard({ userId, displayName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"discover" | "favorites" | "playlists">("discover");
  const [query, setQuery] = useState("Tarkan");
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [activePlaylist, setActivePlaylist] = useState("");
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("favorites").select("song").eq("user_id", userId),
      supabase.from("playlists").select("id,name,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]).then(([favResult, listResult]) => {
      setFavorites((favResult.data || []).map((row) => row.song as Song));
      setPlaylists((listResult.data || []) as Playlist[]);
    });
  }, [supabase, userId]);

  useEffect(() => {
    if (!activePlaylist) { setPlaylistSongs([]); return; }
    supabase.from("playlist_tracks").select("song").eq("playlist_id", activePlaylist)
      .then(({ data }) => setPlaylistSongs((data || []).map((row) => row.song as Song)));
  }, [activePlaylist, supabase]);

  const runSearch = async (term = query) => {
    if (!term.trim()) return;
    setLoading(true); setMessage("");
    try { setSongs(await searchMusic(term)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Bir hata oluştu."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void runSearch("Tarkan"); }, []);

  const toggleFavorite = async (song: Song) => {
    const exists = favorites.some((item) => item.trackId === song.trackId);
    if (exists) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("track_id", song.trackId);
      if (!error) setFavorites((items) => items.filter((item) => item.trackId !== song.trackId));
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: userId, track_id: song.trackId, song });
      if (!error) setFavorites((items) => [song, ...items]);
    }
  };

  const createPlaylist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!playlistName.trim()) return;
    const { data, error } = await supabase.from("playlists").insert({ user_id: userId, name: playlistName.trim() }).select("id,name,created_at").single();
    if (error) { setMessage("Playlist oluşturulamadı. SQL şemasını çalıştırdığını kontrol et."); return; }
    setPlaylists((items) => [data as Playlist, ...items]);
    setPlaylistName(""); setActivePlaylist(data.id); setSelectedPlaylist(data.id); setTab("playlists");
  };

  const addToPlaylist = async (song: Song) => {
    if (!selectedPlaylist) { setMessage("Önce bir playlist oluştur."); setTab("playlists"); return; }
    const { error } = await supabase.from("playlist_tracks").upsert(
      { playlist_id: selectedPlaylist, track_id: song.trackId, song }, { onConflict: "playlist_id,track_id" }
    );
    setMessage(error ? "Şarkı listeye eklenemedi." : "Şarkı playlist'e eklendi.");
    if (!error && selectedPlaylist === activePlaylist) setPlaylistSongs((items) => [song, ...items.filter((item) => item.trackId !== song.trackId)]);
  };

  const visibleSongs = tab === "favorites" ? favorites : tab === "playlists" ? playlistSongs : songs;
  const title = tab === "discover" ? "Yeni sesler keşfet." : tab === "favorites" ? "Favorilerin." : "Senin listelerin.";

  return (
    <main className="music-app">
      <aside className="music-sidebar">
        <Link href="/" className="brand"><span className="brand-mark"><AudioLines size={20} /></span> VYBE<span className="lime">.</span></Link>
        <span className="side-label">MENÜ</span>
        <button className={tab === "discover" ? "side-link active" : "side-link"} onClick={() => setTab("discover")}><Compass size={18}/> Keşfet</button>
        <button className={tab === "favorites" ? "side-link active" : "side-link"} onClick={() => setTab("favorites")}><Heart size={18}/> Favoriler</button>
        <button className={tab === "playlists" ? "side-link active" : "side-link"} onClick={() => setTab("playlists")}><ListMusic size={18}/> Playlistler</button>
        <div className="sidebar-bottom"><span>{displayName}</span><SignOutButton /></div>
      </aside>

      <section className="music-main">
        <header className="music-topbar">
          <span className="eyebrow"><Sparkles size={13}/> YOUR PERSONAL SOUNDSPACE</span>
          <div className="mobile-user">{displayName}<SignOutButton /></div>
        </header>
        <div className="music-heading">
          <div><span className="side-label">VYBE / {tab.toUpperCase()}</span><h1>{title}</h1><p>Bugün hangi ritmi arıyorsun?</p></div>
          {tab === "playlists" && <form className="create-list" onSubmit={createPlaylist}><input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="Yeni playlist adı" maxLength={40}/><button aria-label="Playlist oluştur"><Plus size={18}/></button></form>}
        </div>

        {tab === "discover" && <>
          <form className="music-search" onSubmit={(e) => { e.preventDefault(); void runSearch(); }}><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Şarkı veya sanatçı ara..."/><button disabled={loading}>{loading ? "Aranıyor..." : "Ara"}</button></form>
          <div className="discover-chips">{["Türkçe Pop", "Pop Hits", "Hip-Hop", "Rock", "Electronic", "Indie"].map((genre) => <button key={genre} onClick={() => { setQuery(genre); void runSearch(genre); }}>{genre}</button>)}</div>
        </>}
        {tab === "playlists" && <div className="playlist-tools"><select value={selectedPlaylist} onChange={(e) => setSelectedPlaylist(e.target.value)}><option value="">Şarkı eklemek için liste seç</option>{playlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select><div className="playlist-tabs">{playlists.map((list) => <button className={activePlaylist === list.id ? "playlist-chip selected" : "playlist-chip"} key={list.id} onClick={() => setActivePlaylist(list.id)}>{list.name}</button>)}</div></div>}
        {message && <p className="music-message">{message}</p>}
        <div className="section-caption"><span>{tab === "favorites" ? "KAYDETTİĞİN PARÇALAR" : tab === "playlists" ? (playlists.find((item) => item.id === activePlaylist)?.name || "PLAYLIST SEÇ") : "SENİN İÇİN SEÇİLDİ"}</span><small>{visibleSongs.length} PARÇA</small></div>
        {visibleSongs.length ? <div className="song-grid">{visibleSongs.map((song) => <SongCard key={song.trackId} song={song} favorite={favorites.some((item) => item.trackId === song.trackId)} onPlay={setCurrentSong} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist}/>)}</div> : <div className="empty-state">{loading ? "Müzikler yükleniyor..." : tab === "favorites" ? "Henüz favori parçan yok. Keşfet bölümünden kalp simgesine dokun." : tab === "playlists" ? "Bir playlist oluştur veya listelerinden birini seç." : "Sonuç bulunamadı. Başka bir arama dene."}</div>}
      </section>
      <MiniPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
    </main>
  );
}
