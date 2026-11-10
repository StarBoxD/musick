"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Check,
  Compass,
  Disc3,
  Edit2,
  FolderPlus,
  Gem,
  Heart,
  Home,
  ListEnd,
  ListMusic,
  MoreHorizontal,
  Play,
  Plus,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  SunMedium,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type { Mood, Song } from "@/types/music";
import { postMusic } from "@/lib/music/audius";
import { MOODS } from "@/lib/music/moods";
import SignOutButton from "@/components/sign-out-button";
import DiscoverPanel, { MOOD_META, PlaybackSource } from "@/components/music/discover-panel";
import PersonalPanel from "@/components/music/personal-panel";
import SongGrid from "@/components/music/song-grid";
import MiniPlayer from "@/components/music/mini-player";
import { useLibrary } from "@/components/music/use-library";
import InstallAppButton from "@/components/pwa/install-app-button";

export type Tab =
  | "home"
  | "discover"
  | "daily"
  | "match"
  | "gems"
  | "smart"
  | "favorites"
  | "playlists";

const TABS: { id: Tab; label: string; icon: typeof Compass; group: "main" | "discover" | "library" }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home, group: "main" },
  { id: "discover", label: "Keşfet", icon: Compass, group: "main" },
  { id: "daily", label: "Günlük Parça", icon: SunMedium, group: "discover" },
  { id: "match", label: "Eşleşme", icon: Sparkles, group: "discover" },
  { id: "gems", label: "Alternatif", icon: Gem, group: "discover" },
  { id: "smart", label: "Akıllı Listeler", icon: Wand2, group: "discover" },
  { id: "favorites", label: "Favoriler", icon: Heart, group: "library" },
  { id: "playlists", label: "Çalma Listeleri", icon: ListMusic, group: "library" },
];

const COPY: Record<Tab, { kicker: string; title: string; subtitle: string }> = {
  home: {
    kicker: "ANA DASHBOARD",
    title: "Müziğin merkezindesin.",
    subtitle: "Kişiselleştirilmiş öneriler, günün parçası, canlı frekanslar ve koleksiyonların tek ekranda.",
  },
  discover: {
    kicker: "KEŞFET & FREKANSLAR",
    title: "Hangi frekanstasın?",
    subtitle: "Sanatçı veya parça ara, 8 stüdyo frekansından birini seç ve kesintisiz dinle.",
  },
  daily: {
    kicker: "GÜNÜN SEÇKİSİ",
    title: "Günün parçası.",
    subtitle: "Her gün senin için seçilen özel Türkçe kayıt.",
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
    subtitle: "Favorilerinden otomatik derlenen dinamik koleksiyonlar.",
  },
  favorites: {
    kicker: "KÜTÜPHANE ARŞİVİ",
    title: "Favoriler.",
    subtitle: "Beğendiğin ve arşivlediğin tüm parçalar.",
  },
  playlists: {
    kicker: "KOLEKSİYONLAR",
    title: "Çalma listelerin.",
    subtitle: "Kendi listelerini oluştur, düzenle ve kesintisiz dinle.",
  },
};

const PRIMARY_MOBILE_TABS: Tab[] = ["home", "discover", "favorites", "playlists"];
const MORE_MOBILE_TABS: Tab[] = ["daily", "match", "gems", "smart"];

export default function MusicDashboard({
  userId,
  displayName,
  initialTab = "home",
}: {
  userId: string;
  displayName: string;
  initialTab?: Tab;
}) {
  const library = useLibrary(userId);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isMoreActive = MORE_MOBILE_TABS.includes(tab);
  const activeMoreTab = isMoreActive ? TABS.find((t) => t.id === tab) : null;

  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null);
  const isFetchingMoreRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const [playlistName, setPlaylistName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [topbarSearch, setTopbarSearch] = useState("");
  const [externalSearchQuery, setExternalSearchQuery] = useState("");

  // İstediğin Albüme / Koleksiyona Şarkı Koyma (Modal Seçici + Koleksiyon İçi Şarkı Ekleme)
  const [pickerSong, setPickerSong] = useState<Song | null>(null);
  const [pickerNewName, setPickerNewName] = useState("");
  const [showAlbumAdder, setShowAlbumAdder] = useState(false);
  const [adderQuery, setAdderQuery] = useState("");
  const [adderSource, setAdderSource] = useState<"recommended" | "favorites" | "search">("recommended");
  const [adderSearchResults, setAdderSearchResults] = useState<Song[]>([]);
  const [adderSearching, setAdderSearching] = useState(false);

  // Ana Dashboard (Home) verileri
  const [homeSongs, setHomeSongs] = useState<Song[]>([]);
  const [dailySong, setDailySong] = useState<Song | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);

  const [toastNote, setToastNote] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const song = queue[index] ?? null;

  const showToast = (text: string) => {
    setToastNote(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastNote(null);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Mobil alt barın ekran ilk açıldığında yukarıda kalmasını önleyen viewport senkronizasyonu
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewportBottom = () => {
      if (window.innerWidth <= 768 && window.scrollY === 0) {
        window.scrollTo(0, 0);
      }
      const vv = window.visualViewport;
      if (vv && window.innerWidth <= 768) {
        const bottomGap = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
        document.documentElement.style.setProperty(
          "--vv-bottom-fix",
          bottomGap > 0 && bottomGap < 80 ? `${Math.round(bottomGap)}px` : "0px"
        );
      } else {
        document.documentElement.style.setProperty("--vv-bottom-fix", "0px");
      }
    };

    syncViewportBottom();
    const rafId = window.requestAnimationFrame(syncViewportBottom);
    const timerId = window.setTimeout(syncViewportBottom, 120);

    window.addEventListener("resize", syncViewportBottom, { passive: true });
    window.addEventListener("pageshow", syncViewportBottom, { passive: true });
    window.visualViewport?.addEventListener("resize", syncViewportBottom, { passive: true });
    window.visualViewport?.addEventListener("scroll", syncViewportBottom, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener("resize", syncViewportBottom);
      window.removeEventListener("pageshow", syncViewportBottom);
      window.visualViewport?.removeEventListener("resize", syncViewportBottom);
      window.visualViewport?.removeEventListener("scroll", syncViewportBottom);
    };
  }, [tab]);

  // Escape tuşu ile Koleksiyon Seçici Modalı kapat
  useEffect(() => {
    if (!pickerSong) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerSong(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pickerSong]);

  // Ana Dashboard için öne çıkan & günlük parçaları yükle
  useEffect(() => {
    let cancelled = false;
    setHomeLoading(true);
    Promise.allSettled([postMusic("/api/music/gems"), postMusic("/api/music/daily")])
      .then(([gemsRes, dailyRes]) => {
        if (cancelled) return;
        if (gemsRes.status === "fulfilled" && Array.isArray(gemsRes.value?.songs)) {
          setHomeSongs(gemsRes.value.songs as Song[]);
        }
        if (dailyRes.status === "fulfilled" && dailyRes.value?.song) {
          setDailySong(dailyRes.value.song as Song);
        }
      })
      .finally(() => {
        if (!cancelled) setHomeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const play = (songs: Song[], nextIndex: number, source?: PlaybackSource) => {
    // Kaynak değiştiğinde önceki kuyruk isteklerini geçersiz kıl
    fetchRequestIdRef.current += 1;
    setQueue(songs);
    setIndex(nextIndex);
    // Yeni oynatma başladığında önceki playbackSource bilgisi asla yanlışlıkla korunmaz
    setPlaybackSource(source ?? { type: "direct" });
  };

  const enqueue = (track: Song) => {
    if (!track?.trackId) return;

    // Aynı şarkının yanlışlıkla tekrar tekrar eklenmesini engelle
    if (queue.some((item) => item.trackId === track.trackId)) {
      const duplicateMsg = `"${track.title}" zaten oynatma sırasında.`;
      library.setMessage(duplicateMsg);
      showToast(duplicateMsg);
      return;
    }

    const wasEmpty = queue.length === 0;
    setQueue((prevQueue) => {
      if (prevQueue.some((item) => item.trackId === track.trackId)) return prevQueue;
      return [...prevQueue, track];
    });

    // Kuyruk tamamen boşsa ilk sıraya yerleştir, doluysa mevcut şarkıyı ve index'i asla değiştirme
    if (wasEmpty) {
      setIndex(0);
      if (!playbackSource) {
        setPlaybackSource({ type: "direct" });
      }
    }

    const addedMsg = `"${track.title}" sıraya eklendi.`;
    library.setMessage(addedMsg);
    showToast(addedMsg);
  };

  const startMoodFromHome = async (targetMood: Mood) => {
    try {
      showToast(`${MOOD_META[targetMood].desc} frekansı başlatılıyor...`);
      const data = await postMusic("/api/music/discover", { mood: targetMood });
      const picked = (data.songs ?? [])[0] as Song | undefined;
      if (picked) {
        play([picked], 0, { type: "mood", mood: targetMood });
      } else {
        setTab("discover");
      }
    } catch {
      setTab("discover");
    }
  };

  const fetchMoreSongs = async () => {
    // 1. Aynı anda birden fazla fetchMoreSongs isteği başlamasını engelle
    if (isFetchingMoreRef.current) return;
    if (!playbackSource) {
      library.setMessage("Kuyruktaki tüm parçalar dinlendi.");
      return;
    }

    const currentRequestId = ++fetchRequestIdRef.current;
    const activeSource = playbackSource;
    isFetchingMoreRef.current = true;

    try {
      // 1. Mood kaynağından çalıyorsa kullanıcının seçtiği mood KORUNUR (Asla otomatik Chill'e geçilmez)
      if (activeSource.type === "mood" && activeSource.mood) {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/discover", { mood: activeSource.mood });

        // Kaynak değiştiyse eski isteğin yeni kuyruğa parça eklemesini engelle
        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        let addedCount = 0;

        setQueue((prevQueue) => {
          if (currentRequestId !== fetchRequestIdRef.current) return prevQueue;
          const fresh = incoming.filter((s) => !prevQueue.some((q) => q.trackId === s.trackId));
          addedCount = fresh.length;
          return addedCount > 0 ? [...prevQueue, ...fresh] : prevQueue;
        });

        if (addedCount === 0) {
          library.setMessage(`${activeSource.mood} frekansındaki tüm parçalar dinlendi.`);
        }
        return;
      }

      // 2. Müzik Eşleşmesi (Match)
      if (activeSource.type === "match") {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/match");

        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        let addedCount = 0;

        setQueue((prevQueue) => {
          if (currentRequestId !== fetchRequestIdRef.current) return prevQueue;
          const fresh = incoming.filter((s) => !prevQueue.some((q) => q.trackId === s.trackId));
          addedCount = fresh.length;
          return addedCount > 0 ? [...prevQueue, ...fresh] : prevQueue;
        });

        if (addedCount === 0) {
          library.setMessage("Eşleşme kanalındaki tüm parçalar dinlendi.");
        }
        return;
      }

      // 3. Keşfedilmemiş Parçalar (Gems)
      if (activeSource.type === "gems") {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/gems");

        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        let addedCount = 0;

        setQueue((prevQueue) => {
          if (currentRequestId !== fetchRequestIdRef.current) return prevQueue;
          const fresh = incoming.filter((s) => !prevQueue.some((q) => q.trackId === s.trackId));
          addedCount = fresh.length;
          return addedCount > 0 ? [...prevQueue, ...fresh] : prevQueue;
        });

        if (addedCount === 0) {
          library.setMessage("Keşfedilmemiş parçalar listesi tamamlandı.");
        }
        return;
      }

      // 4. Sabit / Tamamlanabilir Koleksiyonlar
      if (activeSource.type === "favorites") {
        library.setMessage("Favorilerdeki tüm parçalar dinlendi.");
        return;
      }

      if (activeSource.type === "playlist") {
        library.setMessage(
          activeSource.label ? `"${activeSource.label}" listesi tamamlandı.` : "Çalma listesi tamamlandı."
        );
        return;
      }

      if (activeSource.type === "smart") {
        library.setMessage(
          activeSource.label ? `"${activeSource.label}" listesi tamamlandı.` : "Akıllı liste tamamlandı."
        );
        return;
      }

      if (activeSource.type === "daily") {
        library.setMessage("Günün parçası tamamlandı.");
        return;
      }

      if (activeSource.type === "search") {
        library.setMessage(
          activeSource.query
            ? `"${activeSource.query}" arama sonuçları tamamlandı.`
            : "Arama sonuçlarındaki tüm parçalar dinlendi."
        );
        return;
      }

      library.setMessage("Kuyruktaki tüm parçalar dinlendi.");
    } catch {
      // Hata durumunda kullanıcıya anlaşılır mesaj göster
      library.setMessage("Yeni parçalar yüklenirken bir bağlantı sorunu oluştu.");
    } finally {
      isFetchingMoreRef.current = false;
    }
  };

  const activePlaylistObj = library.playlists.find((p) => p.id === library.activePlaylist) ?? null;

  const add = (track: Song) => {
    setPickerNewName("");
    setPickerSong(track);
  };

  const handleAddSongToPlaylist = async (playlistId: string, playlistTitle: string, track: Song) => {
    const alreadyIn = library.isTrackInPlaylist(playlistId, track.trackId);
    if (alreadyIn) {
      await library.removeFromPlaylist(track, playlistId);
      showToast(`"${track.title}" — "${playlistTitle}" albümünden çıkarıldı.`);
      return;
    }
    const ok = await library.addToPlaylist(playlistId, track);
    if (ok) {
      showToast(`"${track.title}" → "${playlistTitle}" albümüne eklendi.`);
    }
  };

  const handleCreatePlaylistAndAdd = async (track: Song) => {
    const clean = pickerNewName.trim();
    if (!clean) return;
    const newId = await library.createPlaylist(clean);
    if (newId) {
      setPickerNewName("");
      await library.addToPlaylist(newId, track);
      showToast(`"${clean}" albümü oluşturuldu ve "${track.title}" eklendi.`);
    }
  };

  const handleSearchAlbumAdder = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setAdderSearching(true);
    setAdderSource("search");
    try {
      const data = await postMusic("/api/music/search", { query: q });
      const results = Array.isArray(data?.songs) ? (data.songs as Song[]) : [];
      setAdderSearchResults(results);
    } catch {
      setAdderSearchResults([]);
    } finally {
      setAdderSearching(false);
    }
  };

  const featuredHeroSong = song ?? dailySong ?? homeSongs[0] ?? library.favorites[0] ?? null;

  return (
    <main className="music-app" id="music-app">
      {/* Sol Navigasyon Sidebar (Masaüstünde Moosync Stüdyo Sidebar, Tablette 80px İkon Rail) */}
      <aside className="music-sidebar" id="music-sidebar">
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
          <span className="side-label">MENÜ</span>
          {TABS.filter((t) => t.group === "main").map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "side-link active" : "side-link"}
              onClick={() => setTab(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <span className="side-icon">
                <item.icon size={16} />
              </span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}

          <span className="side-label">KEŞİF KANALLARI</span>
          {TABS.filter((t) => t.group === "discover").map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "side-link active" : "side-link"}
              onClick={() => setTab(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <span className="side-icon">
                <item.icon size={16} />
              </span>
              <span className="side-text">{item.label}</span>
            </button>
          ))}

          <span className="side-label">KÜTÜPHANE</span>
          {TABS.filter((t) => t.group === "library").map((item) => {
            const count =
              item.id === "favorites"
                ? library.favorites.length
                : item.id === "playlists"
                ? library.playlists.length
                : 0;
            return (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? "side-link active" : "side-link"}
                onClick={() => setTab(item.id)}
                title={item.label}
                aria-label={item.label}
              >
                <span className="side-icon">
                  <item.icon size={16} />
                </span>
                <span className="side-text">{item.label}</span>
                {count > 0 && <span className="side-count-badge">{count}</span>}
              </button>
            );
          })}

          {library.playlists.length > 0 && (
            <div className="sidebar-playlists-group">
              <span className="side-label">KOLEKSİYONLARIN</span>
              {library.playlists.slice(0, 4).map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  className={
                    tab === "playlists" && library.activePlaylist === pl.id
                      ? "side-playlist-shortcut active"
                      : "side-playlist-shortcut"
                  }
                  onClick={() => {
                    library.setActivePlaylist(pl.id);
                    setTab("playlists");
                  }}
                  title={pl.name}
                >
                  <ListMusic size={13} />
                  <span>{pl.name}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-pwa-slot">
          <InstallAppButton />
        </div>

        <div className="sidebar-bottom">
          <div className="side-user">
            <span className="side-avatar">{displayName.trim().charAt(0).toUpperCase() || "V"}</span>
            <div className="side-user-text">
              <b>{displayName}</b>
              <small>Stüdyo Üyesi</small>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <section className="music-main" id="music-main">
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
            <form
              className="topbar-quick-search"
              onSubmit={(event) => {
                event.preventDefault();
                if (!topbarSearch.trim()) return;
                setExternalSearchQuery(topbarSearch.trim());
                setTab("discover");
              }}
            >
              <Search size={15} />
              <input
                id="topbar-search-input"
                type="search"
                value={topbarSearch}
                onChange={(e) => setTopbarSearch(e.target.value)}
                placeholder="Hızlı parça veya sanatçı ara..."
                aria-label="Hızlı arama"
              />
            </form>

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
          <div className="heading-quick-actions">
            <button
              type="button"
              className="action-btn"
              onClick={() => setTab("discover")}
            >
              <Compass size={15} />
              <span>Keşfet</span>
            </button>
            <button
              type="button"
              className="action-btn next-btn"
              onClick={() => void startMoodFromHome("Chill")}
            >
              <Shuffle size={15} />
              <span>Frekans Başlat</span>
            </button>
          </div>
        </div>

        {library.message && <p className="music-message">{library.message}</p>}

        {/* =====================================================
            B. ANA DASHBOARD (HOME OVERVIEW)
           ===================================================== */}
        {tab === "home" && (
          <div className="home-dashboard">
            {/* 1. Hoş Geldin & Öne Çıkan Müzik Alanı + Günün Parçası */}
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
                    {featuredHeroSong
                      ? featuredHeroSong.title
                      : "Kendi Frekansını Keşfet"}
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
                          play([featuredHeroSong, ...homeSongs.filter((s) => s.trackId !== featuredHeroSong.trackId)], 0, {
                            type: "gems",
                            label: "Öne Çıkan Seçki",
                          });
                        } else {
                          void startMoodFromHome("Chill");
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

              {/* Günün Parçası Öne Çıkan Kart */}
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
                      onClick={() =>
                        play([dailySong], 0, { type: "daily", label: "Günün Parçası" })
                      }
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
                          onClick={() =>
                            play([dailySong], 0, { type: "daily", label: "Günün Parçası" })
                          }
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
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => setTab("daily")}
                    >
                      Günün Parçasını Aç
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Ruh Hâli & Müzik Keşif Kanalları */}
            <section className="home-section">
              <div className="section-caption">
                <span>RUH HÂLİ & MÜZİK KEŞİF ALANLARI</span>
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
                      onClick={() => void startMoodFromHome(item)}
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

            {/* 3. Kişiselleştirilmiş İçerikler & Öne Çıkan Müzik Grid */}
            <section className="home-section">
              <div className="section-caption">
                <span>ÖNE ÇIKAN & KİŞİSELLEŞTİRİLMİŞ SEÇKİLER</span>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => setTab("gems")}
                >
                  Tümünü Gör
                </button>
              </div>
              <SongGrid
                songs={homeSongs.length > 0 ? homeSongs : library.favorites}
                favorites={library.favorites}
                pendingFavorites={library.pendingFavorites}
                empty={
                  homeLoading
                    ? "Kişiselleştirilmiş müzik kartları hazırlanıyor..."
                    : "Keşfet sekmesinden bir frekans seçerek müzik akışını başlat."
                }
                source={{ type: "gems", label: "Ana Dashboard Seçkisi" }}
                onPlay={play}
                onFavorite={library.toggleFavorite}
                onAddToQueue={enqueue}
                onAdd={add}
              />
            </section>

            {/* 4. Albüm ve Şarkı Koleksiyonları */}
            <section className="home-section">
              <div className="section-caption">
                <span>ALBÜM & ŞARKI KOLEKSİYONLARIN</span>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => setTab("playlists")}
                >
                  Koleksiyonları Yönet
                </button>
              </div>
              <div className="home-collections-grid">
                <button
                  type="button"
                  className="collection-summary-card"
                  onClick={() => setTab("favorites")}
                >
                  <span className="collection-summary-icon is-lime">
                    <Heart size={20} />
                  </span>
                  <div className="collection-summary-info">
                    <strong>Favori Parçaların</strong>
                    <small>{library.favorites.length} kayıtlı şarkı</small>
                  </div>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="collection-summary-card"
                  onClick={() => setTab("playlists")}
                >
                  <span className="collection-summary-icon">
                    <ListMusic size={20} />
                  </span>
                  <div className="collection-summary-info">
                    <strong>Çalma Listelerin</strong>
                    <small>{library.playlists.length} özel koleksiyon</small>
                  </div>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="collection-summary-card"
                  onClick={() => setTab("match")}
                >
                  <span className="collection-summary-icon">
                    <Sparkles size={20} />
                  </span>
                  <div className="collection-summary-info">
                    <strong>Zevk Eşleşmesi</strong>
                    <small>Favorilerine göre yeni sesler</small>
                  </div>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="collection-summary-card"
                  onClick={() => setTab("smart")}
                >
                  <span className="collection-summary-icon">
                    <Wand2 size={20} />
                  </span>
                  <div className="collection-summary-info">
                    <strong>Akıllı Listeler</strong>
                    <small>Otomatik derlenen listeler</small>
                  </div>
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================
            C. KEŞFET (DISCOVER & SEARCH)
           ===================================================== */}
        {tab === "discover" && (
          <DiscoverPanel
            favorites={library.favorites}
            pendingFavorites={library.pendingFavorites}
            externalQuery={externalSearchQuery}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAddToQueue={enqueue}
            onAdd={add}
          />
        )}

        {/* =====================================================
            GÜNLÜK PARÇA / EŞLEŞME / ALTERNATİF / AKILLI LİSTELER
           ===================================================== */}
        {(tab === "daily" || tab === "match" || tab === "gems" || tab === "smart") && (
          <PersonalPanel
            key={tab}
            mode={tab}
            favorites={library.favorites}
            pendingFavorites={library.pendingFavorites}
            onPlay={play}
            onFavorite={library.toggleFavorite}
            onAddToQueue={enqueue}
            onAdd={add}
            onSaveSmart={library.saveSmart}
          />
        )}

        {/* =====================================================
            D. FAVORİLER VE ÇALMA LİSTELERİ
           ===================================================== */}
        {tab === "favorites" && (
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
                    {library.favorites.length > 0
                      ? `${library.favorites.length} parça kütüphanende kayıtlı`
                      : "Beğendiğin parçaları üç nokta menüsünden buraya ekleyebilirsin"}
                  </small>
                </div>
              </div>
              {library.favorites.length > 0 && (
                <div className="collection-hero-actions">
                  <button
                    type="button"
                    className="action-btn next-btn"
                    onClick={() =>
                      play(library.favorites, 0, {
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
              songs={library.favorites}
              favorites={library.favorites}
              pendingFavorites={library.pendingFavorites}
              empty="Henüz favorilere eklenmiş bir parça yok."
              source={{ type: "favorites", label: "Favoriler" }}
              onPlay={play}
              onFavorite={library.toggleFavorite}
              onAddToQueue={enqueue}
              onAdd={add}
            />
          </div>
        )}

        {tab === "playlists" && (
          <div className="playlists-studio">
            {/* Üst Liste Oluşturma ve Hızlı Seçim Barı */}
            <div className="playlists-header-bar">
              <form
                id="playlist-form"
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
                  id="test-input"
                  type="text"
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

            {/* Modern Liste Kartları / Sekmeleri */}
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
                    {editingId === activePlaylistObj.id ? (
                      <div className="playlist-rename-row">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Yeni liste adı"
                          autoFocus
                          className="playlist-rename-input"
                        />
                        <button
                          type="button"
                          className="icon-action"
                          onClick={async () => {
                            if (editTitle.trim()) {
                              const ok = await library.renamePlaylist(
                                activePlaylistObj.id,
                                editTitle.trim()
                              );
                              if (ok) setEditingId(null);
                            }
                          }}
                          title="Kaydet"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action"
                          onClick={() => setEditingId(null)}
                          title="İptal"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <h2>{activePlaylistObj.name}</h2>
                    )}
                    <small>{library.playlistSongs.length} parça</small>
                  </div>
                  <div className="active-playlist-actions">
                    {library.playlistSongs.length > 0 && (
                      <button
                        type="button"
                        className="action-btn next-btn"
                        onClick={() =>
                          play(library.playlistSongs, 0, {
                            type: "playlist",
                            playlistId: activePlaylistObj.id,
                            label: activePlaylistObj.name,
                          })
                        }
                      >
                        <Play size={15} fill="currentColor" />
                        <span>Tümünü Oynat</span>
                      </button>
                    )}
                    <button
                      id="btn-toggle-album-adder"
                      type="button"
                      className={showAlbumAdder ? "action-btn next-btn" : "action-btn"}
                      onClick={() => setShowAlbumAdder((prev) => !prev)}
                    >
                      <Plus size={15} />
                      <span>{showAlbumAdder ? "Şarkı Seçiciyi Kapat" : "Şarkı Ekle"}</span>
                    </button>
                    {editingId !== activePlaylistObj.id && (
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                          setEditingId(activePlaylistObj.id);
                          setEditTitle(activePlaylistObj.name);
                        }}
                        title="Listeyi yeniden adlandır"
                      >
                        <Edit2 size={15} />
                        <span>Yeniden Adlandır</span>
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

                {/* Bu Albüme / Koleksiyona İstediğin Şarkıyı Seç & Ekle Stüdyo Paneli */}
                {showAlbumAdder && (
                  <div className="album-adder-panel" id="album-adder-panel">
                    <div className="album-adder-header">
                      <div>
                        <span className="eyebrow">ALBÜM İÇERİĞİNİ DÜZENLE</span>
                        <h3>&ldquo;{activePlaylistObj.name}&rdquo; koleksiyonuna şarkı ekle</h3>
                      </div>
                      <button
                        type="button"
                        className="icon-action"
                        onClick={() => setShowAlbumAdder(false)}
                        aria-label="Paneli kapat"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form
                      className="album-adder-search"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSearchAlbumAdder(adderQuery);
                      }}
                    >
                      <Search size={16} />
                      <input
                        type="search"
                        value={adderQuery}
                        onChange={(e) => setAdderQuery(e.target.value)}
                        placeholder="İstediğin şarkıyı veya sanatçıyı ara (örn. Duman, Sezen Aksu, Mor ve Ötesi)..."
                        aria-label="Koleksiyona eklenecek şarkıyı ara"
                      />
                      <button type="submit" disabled={adderSearching || !adderQuery.trim()}>
                        {adderSearching ? "Aranıyor..." : "Ara"}
                      </button>
                    </form>

                    <div className="album-adder-tabs">
                      <button
                        type="button"
                        className={adderSource === "recommended" ? "album-adder-tab active" : "album-adder-tab"}
                        onClick={() => setAdderSource("recommended")}
                      >
                        Önerilen Şarkılar ({homeSongs.length})
                      </button>
                      <button
                        type="button"
                        className={adderSource === "favorites" ? "album-adder-tab active" : "album-adder-tab"}
                        onClick={() => setAdderSource("favorites")}
                      >
                        Favorilerim ({library.favorites.length})
                      </button>
                      {adderSearchResults.length > 0 && (
                        <button
                          type="button"
                          className={adderSource === "search" ? "album-adder-tab active" : "album-adder-tab"}
                          onClick={() => setAdderSource("search")}
                        >
                          Arama Sonuçları ({adderSearchResults.length})
                        </button>
                      )}
                    </div>

                    <div className="album-adder-list">
                      {(adderSource === "search"
                        ? adderSearchResults
                        : adderSource === "favorites"
                        ? library.favorites
                        : homeSongs
                      ).length === 0 ? (
                        <div className="album-adder-empty">
                          {adderSearching
                            ? "Şarkılar aranıyor..."
                            : "Burada henüz şarkı yok. Yukarıdaki arama çubuğundan istediğin şarkıyı arayabilirsin."}
                        </div>
                      ) : (
                        (adderSource === "search"
                          ? adderSearchResults
                          : adderSource === "favorites"
                          ? library.favorites
                          : homeSongs
                        )
                          .slice(0, 12)
                          .map((candidate) => {
                            const inCurrentAlbum = library.isTrackInPlaylist(
                              activePlaylistObj.id,
                              candidate.trackId
                            );
                            return (
                              <div key={candidate.trackId} className="album-adder-row">
                                <div className="album-adder-song">
                                  {candidate.artwork ? (
                                    <img src={candidate.artwork} alt={candidate.title} />
                                  ) : (
                                    <div className="album-adder-fallback">
                                      <Disc3 size={18} />
                                    </div>
                                  )}
                                  <div className="album-adder-meta">
                                    <strong>{candidate.title}</strong>
                                    <span>{candidate.artist}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className={inCurrentAlbum ? "album-adder-btn is-added" : "album-adder-btn"}
                                  onClick={() =>
                                    void handleAddSongToPlaylist(
                                      activePlaylistObj.id,
                                      activePlaylistObj.name,
                                      candidate
                                    )
                                  }
                                >
                                  {inCurrentAlbum ? (
                                    <>
                                      <Check size={14} />
                                      <span>Albümde</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={14} />
                                      <span>Albüme Ekle</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                <SongGrid
                  songs={library.playlistSongs}
                  favorites={library.favorites}
                  pendingFavorites={library.pendingFavorites}
                  empty="Bu listede henüz parça yok. Radyoda veya aramada beğendiğin şarkılarda üç nokta menüsünden 'Çalma listesine ekle' seçeneğine dokun."
                  source={{
                    type: "playlist",
                    playlistId: activePlaylistObj.id,
                    label: activePlaylistObj.name,
                  }}
                  onPlay={(songs, idx, src) =>
                    play(
                      songs,
                      idx,
                      src ?? {
                        type: "playlist",
                        playlistId: activePlaylistObj.id,
                        label: activePlaylistObj.name,
                      }
                    )
                  }
                  onFavorite={library.toggleFavorite}
                  onAddToQueue={enqueue}
                  onAdd={add}
                  onRemove={library.removeFromPlaylist}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {toastNote && (
        <div className="music-toast" role="status" aria-live="polite">
          <Check size={14} />
          <span>{toastNote}</span>
        </div>
      )}

      {/* Telefon ve Küçük Tablet İçin Alt Navigasyon Barı (Nothing OS Tarzı) */}
      <nav className="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobil alt menü">
        {PRIMARY_MOBILE_TABS.map((tabId) => {
          const item = TABS.find((t) => t.id === tabId)!;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              type="button"
              className={tab === item.id ? "mobile-tab active" : "mobile-tab"}
              onClick={() => {
                setTab(item.id);
                setShowMoreMenu(false);
              }}
              aria-label={item.label}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          id="tab-more"
          type="button"
          className={isMoreActive ? "mobile-tab active" : "mobile-tab"}
          onClick={() => setShowMoreMenu((prev) => !prev)}
          aria-label="Diğer sekmeler"
          aria-expanded={showMoreMenu}
        >
          <MoreHorizontal size={19} />
          <span>{activeMoreTab ? activeMoreTab.label : "Daha"}</span>
        </button>
      </nav>

      {/* Daha Fazla Sekme Popover Menüsü */}
      {showMoreMenu && (
        <div className="mobile-more-backdrop" id="more-backdrop" onClick={() => setShowMoreMenu(false)}>
          <div className="mobile-more-sheet" id="more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-header">
              <span>KEŞİF KANALLARI</span>
              <button
                id="btn-close-sheet"
                type="button"
                className="mobile-more-close"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mobile-more-grid">
              {MORE_MOBILE_TABS.map((tabId) => {
                const item = TABS.find((t) => t.id === tabId)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={tab === item.id ? "mobile-more-card active" : "mobile-more-card"}
                    onClick={() => {
                      setTab(item.id);
                      setShowMoreMenu(false);
                    }}
                  >
                    <item.icon size={20} />
                    <div className="mobile-more-card-text">
                      <strong>{item.label}</strong>
                      <small>{COPY[item.id].subtitle}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* İstediğin Albüme / Koleksiyona Şarkı Koyma Seçici Modal */}
      {pickerSong && (
        <div
          className="playlist-picker-backdrop"
          id="playlist-picker-backdrop"
          onClick={() => setPickerSong(null)}
        >
          <div
            className="playlist-picker-modal"
            id="playlist-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Albüm veya koleksiyon seç"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="playlist-picker-header">
              <div>
                <span className="eyebrow">KOLEKSİYONA EKLE</span>
                <h3>Hangi albüme eklensin?</h3>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setPickerSong(null)}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="playlist-picker-song">
              {pickerSong.artwork ? (
                <img src={pickerSong.artwork} alt={pickerSong.title} />
              ) : (
                <div className="playlist-picker-fallback">
                  <Disc3 size={20} />
                </div>
              )}
              <div className="playlist-picker-song-meta">
                <strong>{pickerSong.title}</strong>
                <span>{pickerSong.artist}</span>
              </div>
            </div>

            <form
              className="playlist-picker-create"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreatePlaylistAndAdd(pickerSong);
              }}
            >
              <FolderPlus size={16} />
              <input
                type="text"
                value={pickerNewName}
                onChange={(e) => setPickerNewName(e.target.value)}
                placeholder="Yeni albüm / liste oluştur ve ekle..."
                maxLength={40}
              />
              <button type="submit" disabled={!pickerNewName.trim()}>
                Oluştur &amp; Ekle
              </button>
            </form>

            <div className="playlist-picker-list">
              {library.playlists.length === 0 ? (
                <div className="playlist-picker-empty">
                  Henüz bir albümün yok. Yukarıdan yeni bir isim yazıp anında oluşturabilir ve bu şarkıyı ekleyebilirsin.
                </div>
              ) : (
                library.playlists.map((pl) => {
                  const alreadyAdded = library.isTrackInPlaylist(pl.id, pickerSong.trackId);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      className={
                        alreadyAdded ? "playlist-picker-item is-added" : "playlist-picker-item"
                      }
                      onClick={() => void handleAddSongToPlaylist(pl.id, pl.name, pickerSong)}
                    >
                      <span className="playlist-picker-item-icon">
                        <ListMusic size={16} />
                      </span>
                      <span className="playlist-picker-item-info">
                        <strong>{pl.name}</strong>
                        <small>
                          {alreadyAdded
                            ? "Bu albümde mevcut (Çıkarmak için dokun)"
                            : "Bu albüme eklemek için dokun"}
                        </small>
                      </span>
                      <span className="playlist-picker-item-badge">
                        {alreadyAdded ? (
                          <>
                            <Check size={14} />
                            <span>Eklendi</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Ekle</span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <MiniPlayer
        song={song}
        hasPrev={index > 0}
        hasNext={index < queue.length - 1}
        onClose={() => setQueue([])}
        onPrev={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(queue.length - 1, value + 1))}
        onNeedMoreSongs={fetchMoreSongs}
      />
    </main>
  );
}
