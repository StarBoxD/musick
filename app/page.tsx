"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AudioLines, Disc3, Heart, Home, Library, ListMusic, Menu, Music2,
  Pause, Play, Plus, Search, SkipBack, SkipForward, Shuffle, Sparkles,
  Volume2, X, Radio, Clock3, Headphones, Check, MoreHorizontal
} from "lucide-react";
import { songs, type Song } from "@/lib/songs";

type Playlist = { id: string; name: string; songIds: string[] };

const initialPlaylists: Playlist[] = [
  { id: "p1", name: "Gece Yolculuğu", songIds: ["s3", "s11", "s7"] },
  { id: "p2", name: "Türkçe Rock", songIds: ["s2", "s4", "s6", "s9"] }
];

export default function HomePage() {
  const [activeSong, setActiveSong] = useState<Song>(songs[0]);
  const [playing, setPlaying] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [activeView, setActiveView] = useState("home");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [volume, setVolume] = useState(72);
  const [showCreate, setShowCreate] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [queue, setQueue] = useState<Song[]>(songs);
  const [history, setHistory] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const f = localStorage.getItem("vybe:favorites");
      const p = localStorage.getItem("vybe:playlists");
      const h = localStorage.getItem("vybe:history");
      if (f) setFavorites(JSON.parse(f));
      if (p) setPlaylists(JSON.parse(p));
      if (h) setHistory(JSON.parse(h));
    } catch { /* Bozuk yerel veri uygulamayı durdurmasın. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("vybe:favorites", JSON.stringify(favorites));
    localStorage.setItem("vybe:playlists", JSON.stringify(playlists));
    localStorage.setItem("vybe:history", JSON.stringify(history));
  }, [favorites, playlists, history, hydrated]);

  const visibleSongs = useMemo(() => {
    let list = activeView === "favorites" ? songs.filter(s => favorites.includes(s.id))
      : activeView === "history" ? history.map(id => songs.find(s => s.id === id)).filter((s): s is Song => Boolean(s))
      : activeView.startsWith("playlist:") ? songs.filter(s => playlists.find(p => p.id === activeView.slice(9))?.songIds.includes(s.id))
      : songs;
    if (filter !== "Tümü") list = list.filter(s => s.genre === filter || s.mood === filter);
    if (query.trim()) list = list.filter(s => `${s.title} ${s.artist} ${s.album} ${s.genre}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));
    return list;
  }, [activeView, favorites, history, playlists, filter, query]);

  const play = (song: Song) => {
    setActiveSong(song);
    setPlaying(true);
    setHistory(prev => [song.id, ...prev.filter(id => id !== song.id)].slice(0, 20));
  };
  const next = () => {
    const list = queue.length ? queue : songs;
    const index = list.findIndex(s => s.id === activeSong.id);
    play(list[(index + 1) % list.length]);
  };
  const previous = () => {
    const list = queue.length ? queue : songs;
    const index = list.findIndex(s => s.id === activeSong.id);
    play(list[(index - 1 + list.length) % list.length]);
  };
  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const shufflePlay = () => {
    const pool = visibleSongs.length ? visibleSongs : songs;
    const options = pool.filter(s => s.id !== activeSong.id);
    play(options[Math.floor(Math.random() * options.length)] || pool[0]);
  };
  const createPlaylist = () => {
    const name = playlistName.trim();
    if (!name) return;
    setPlaylists(prev => [...prev, { id: `p${Date.now()}`, name, songIds: [] }]);
    setPlaylistName("");
    setShowCreate(false);
  };
  const addToPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, songIds: p.songIds.includes(songId) ? p.songIds : [...p.songIds, songId] } : p));
  };
  const title = activeView === "favorites" ? "Favorilerin" : activeView === "history" ? "Son dinlediklerin" : activeView.startsWith("playlist:") ? playlists.find(p => p.id === activeView.slice(9))?.name || "Playlist" : "Sesini bul.";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><AudioLines size={22}/></span><span>VYBE<span className="brand-dot">.</span></span></div>
        <div className="side-label">MENÜ</div>
        <nav className="nav-list">
          <button className={activeView === "home" ? "nav-item active" : "nav-item"} onClick={() => {setActiveView("home");setMobileMenu(false)}}><Home size={18}/> Keşfet</button>
          <button className={activeView === "favorites" ? "nav-item active" : "nav-item"} onClick={() => {setActiveView("favorites");setMobileMenu(false)}}><Heart size={18}/> Favoriler <span className="nav-count">{favorites.length}</span></button>
          <button className={activeView === "history" ? "nav-item active" : "nav-item"} onClick={() => {setActiveView("history");setMobileMenu(false)}}><Clock3 size={18}/> Geçmiş</button>
        </nav>
        <div className="side-divider"/>
        <div className="library-heading"><span className="side-label">KÜTÜPHANEM</span><button className="icon-button tiny" onClick={() => setShowCreate(true)} aria-label="Playlist oluştur"><Plus size={17}/></button></div>
        <nav className="nav-list playlist-nav">
          {playlists.map(p => <button key={p.id} className={activeView === `playlist:${p.id}` ? "nav-item active" : "nav-item"} onClick={() => {setActiveView(`playlist:${p.id}`);setMobileMenu(false)}}><ListMusic size={17}/><span className="nav-truncate">{p.name}</span></button>)}
          {playlists.length === 0 && <p className="empty-small">Henüz playlist yok.</p>}
        </nav>
        <div className="sidebar-bottom"><div className="mini-note"><Sparkles size={16}/><span>Kendi ritmini keşfet.</span></div><span className="version">VYBE PLAYER · 1.0</span></div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Menüyü kapat"/>}

      <section className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Menüyü aç"><Menu/></button>
          <div className="search-wrap"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Şarkı, sanatçı veya albüm ara..." /><kbd>⌘ K</kbd></div>
          <div className="topbar-right"><span className="online-dot"/> <span className="topbar-caption">YOUR SOUND. YOUR SPACE.</span><div className="avatar">V</div></div>
        </header>

        <div className="content">
          {activeView === "home" && <>
            <section className="hero">
              <div className="hero-glow"/>
              <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> BUGÜNÜN FREKANSI</div><h1>Ruhunun<br/><em>sesini</em> bul.</h1><p>Yeni favorin belki de bir sonraki şarkıda saklı. Keşfet, hisset, tekrar et.</p><div className="hero-actions"><button className="primary-button" onClick={shufflePlay}><Shuffle size={17}/> Benim için keşfet</button><button className="text-button" onClick={() => {setFilter("Tümü");setQuery("");document.getElementById("discover")?.scrollIntoView({behavior:"smooth"})}}>Koleksiyona göz at <span>↗</span></button></div></div>
              <div className="hero-art"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-disc"><div className="disc-center"><AudioLines size={34}/></div></div><div className="floating-tag tag-top"><span className="tag-pulse"/> NOW FEELING</div><div className="floating-tag tag-bottom"><span>✳</span> GOOD VIBRATIONS</div></div>
              <div className="hero-index">01 <span>/</span> 04</div>
            </section>

            <section className="quick-stats">
              <div className="stat"><span className="stat-icon"><Headphones size={17}/></span><div><strong>{songs.length}</strong><small>KEŞFEDİLECEK PARÇA</small></div></div>
              <div className="stat"><span className="stat-icon pink"><Heart size={17}/></span><div><strong>{favorites.length}</strong><small>FAVORİ PARÇAN</small></div></div>
              <div className="stat"><span className="stat-icon green"><Radio size={17}/></span><div><strong>∞</strong><small>YENİ KEŞİF</small></div></div>
            </section>
          </>}

          <section className="section-block" id="discover">
            <div className="section-heading"><div><div className="eyebrow muted-eyebrow">{activeView === "home" ? "SENİN İÇİN SEÇTİK" : "KÜTÜPHANEN"}</div><h2>{title}</h2></div>
              {activeView === "home" && <button className="see-all" onClick={() => setFilter("Tümü")}>Tümünü gör <span>↗</span></button>}
            </div>
            {activeView === "home" && <div className="filter-row">{["Tümü","Pop","Rock","Alternative","Anadolu Rock","Enerjik","Gece","Sakin"].map(f => <button key={f} className={filter === f ? "filter-chip selected" : "filter-chip"} onClick={() => setFilter(f)}>{f}</button>)}</div>}
            {visibleSongs.length ? <div className="track-grid">{visibleSongs.map((song, i) => <article className="track-card" key={song.id}>
              <div className={`cover cover-${song.color}`} onClick={() => play(song)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && play(song)}>
                <span className="cover-number">{String(i + 1).padStart(2,"0")}</span><span className="cover-orbit"/><span className="cover-glyph">{song.genre === "Rock" ? "✳" : song.genre === "Pop" ? "◉" : "✦"}</span><span className="cover-word">{song.album}</span>
                <button className="cover-play" onClick={e => {e.stopPropagation();play(song)}} aria-label={`${song.title} çal`}><Play size={18} fill="currentColor"/></button>
                <button className={`cover-heart ${favorites.includes(song.id) ? "liked" : ""}`} onClick={e => {e.stopPropagation();toggleFavorite(song.id)}} aria-label="Favorilere ekle"><Heart size={16} fill={favorites.includes(song.id) ? "currentColor" : "none"}/></button>
              </div>
              <div className="track-meta"><div className="track-title-row"><div><h3>{song.title}</h3><p>{song.artist}</p></div><button className="more-button" onClick={() => toggleFavorite(song.id)} aria-label="Favorilere ekle"><MoreHorizontal size={19}/></button></div>
                <div className="track-foot"><span>{song.genre}</span><span className="track-dot"/> <span>{song.mood}</span><div className="add-menu"><select aria-label="Playlist'e ekle" value="" onChange={e => {if(e.target.value) addToPlaylist(e.target.value,song.id)}}><option value="">+ Listeye ekle</option>{playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
              </div>
            </article>)}</div> : <div className="empty-state"><Music2 size={28}/><h3>Burada henüz bir şey yok.</h3><p>Aramanı veya filtrelerini değiştirmeyi dene.</p></div>}
          </section>

          {activeView === "home" && <section className="bottom-feature"><div className="feature-icon"><Disc3 size={30}/></div><div><div className="eyebrow muted-eyebrow">KÜÇÜK BİR HATIRLATMA</div><h3>Müzik sadece dinlenmez, yaşanır.</h3><p>Kendi listeni oluştur ve anlarına bir soundtrack seç.</p></div><button className="outline-button" onClick={() => setShowCreate(true)}>Playlist oluştur <Plus size={16}/></button></section>}
          <footer className="footer"><span>VYBE<span className="brand-dot">.</span> — Find your frequency.</span><span>BU SAYFA SENİN RİTMİNDE.</span></footer>
        </div>
      </section>

      <aside className="now-playing-panel">
        <div className="panel-top"><span className="side-label">ŞİMDİ ÇALIYOR</span><button className="icon-button tiny" aria-label="Panel seçenekleri"><MoreHorizontal size={19}/></button></div>
        <div className={`now-cover cover-${activeSong.color}`}><span className="cover-orbit"/><span className="now-cover-glyph">✳</span><div className="now-cover-label">VYBE SESSION<br/><b>{activeSong.album}</b></div><div className="now-cover-eq"><i/><i/><i/><i/><i/></div></div>
        <div className="now-song"><div><h2>{activeSong.title}</h2><p>{activeSong.artist}</p></div><button className={`heart-button ${favorites.includes(activeSong.id) ? "liked" : ""}`} onClick={() => toggleFavorite(activeSong.id)} aria-label="Favorilere ekle"><Heart size={20} fill={favorites.includes(activeSong.id) ? "currentColor" : "none"}/></button></div>
        <div className="player-progress"><div className="progress-label"><span>VYBE PLAYER</span><span>YOUTUBE</span></div><div className="progress-track"><span style={{width: playing ? "36%" : "0%"}}/></div><div className="time-label"><span>--:--</span><span>--:--</span></div></div>
        <div className="player-controls"><button className="control-button" onClick={shufflePlay} aria-label="Karıştır"><Shuffle size={17}/></button><button className="control-button" onClick={previous} aria-label="Önceki"><SkipBack size={20} fill="currentColor"/></button><button className="main-play" onClick={() => setPlaying(!playing)} aria-label={playing ? "Duraklat" : "Oynat"}>{playing ? <Pause size={21} fill="currentColor"/> : <Play size={21} fill="currentColor"/>}</button><button className="control-button" onClick={next} aria-label="Sonraki"><SkipForward size={20} fill="currentColor"/></button><button className="control-button" onClick={() => toggleFavorite(activeSong.id)} aria-label="Favorile"><Heart size={17}/></button></div>
        <div className="volume-row"><Volume2 size={17}/><input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Ses seviyesi"/><span>{volume}%</span></div>
        <div className="queue-heading"><span>SIRADAKİLER</span><button onClick={() => setQueue(songs)}>Sırayı sıfırla</button></div>
        <div className="queue-list">{queue.filter(s => s.id !== activeSong.id).slice(0,5).map((s,i) => <button className="queue-item" key={s.id} onClick={() => play(s)}><span className="queue-index">{String(i+1).padStart(2,"0")}</span><span className={`queue-thumb cover-${s.color}`}>✳</span><span className="queue-info"><b>{s.title}</b><small>{s.artist}</small></span><Play size={14}/></button>)}</div>
        <div className="youtube-player"><div className="youtube-label"><span className="online-dot"/> OYNATMA PENCERESİ</div><iframe key={`${activeSong.videoId}-${playing}`} src={`https://www.youtube-nocookie.com/embed/${activeSong.videoId}?autoplay=${playing ? 1 : 0}&enablejsapi=1&rel=0`} title={`${activeSong.title} - YouTube oynatıcı`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
      </aside>

      {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><div className="create-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCreate(false)}><X size={19}/></button><div className="modal-icon"><ListMusic size={25}/></div><div className="eyebrow muted-eyebrow">YENİ BİR HİKÂYE</div><h2>Playlist'ini oluştur.</h2><p>Her ruh halinin bir listesi olsun.</p><input autoFocus value={playlistName} onChange={e => setPlaylistName(e.target.value)} onKeyDown={e => e.key === "Enter" && createPlaylist()} placeholder="Örn. Pazar sabahı" maxLength={32}/><button className="primary-button modal-submit" onClick={createPlaylist} disabled={!playlistName.trim()}>Oluştur <Plus size={17}/></button></div></div>}
    </main>
  );
}
