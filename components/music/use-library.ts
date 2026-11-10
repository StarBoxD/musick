"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Playlist, Song } from "@/types/music";

export function useLibrary(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState("");
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistTrackMap, setPlaylistTrackMap] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(new Set());

  // Kütüphane verilerini güvenilir şekilde yükle
  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [favResult, listResult] = await Promise.all([
        supabase
          .from("favorites")
          .select("song,track_id,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("playlists")
          .select("id,name,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (favResult.error) {
        setMessage(`Favoriler yüklenemedi: ${favResult.error.message}`);
      } else {
        const loadedFavs = (favResult.data ?? []).map((row) => row.song as Song);
        setFavorites(loadedFavs);
      }

      if (listResult.error) {
        setMessage(`Çalma listeleri yüklenemedi: ${listResult.error.message}`);
      } else {
        const loadedLists = (listResult.data ?? []) as Playlist[];
        setPlaylists(loadedLists);
        setActivePlaylist((prev) => (prev && loadedLists.some((l) => l.id === prev) ? prev : loadedLists[0]?.id || ""));
      }
    } catch (err: unknown) {
      setMessage(`Bağlantı hatası: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Aktif playlist değiştikçe parça listesini sıralı yükle
  useEffect(() => {
    if (!activePlaylist) {
      setPlaylistSongs([]);
      return;
    }
    let isCurrent = true;
    supabase
      .from("playlist_tracks")
      .select("song,created_at")
      .eq("playlist_id", activePlaylist)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) {
          setMessage(`Liste parçaları okunamadı: ${error.message}`);
          return;
        }
        const loadedSongs = (data ?? []).map((row) => row.song as Song);
        setPlaylistSongs(loadedSongs);
        setPlaylistTrackMap((prev) => ({
          ...prev,
          [activePlaylist]: loadedSongs.map((s) => s.trackId),
        }));
      });

    return () => {
      isCurrent = false;
    };
  }, [activePlaylist, supabase]);

  // FAVORİ İŞLEMLERİ (AŞAMA 3) - Race condition ve çift tıklama korumalı
  const toggleFavorite = async (song: Song) => {
    if (!userId || !song.trackId) return;

    // Eğer işlem zaten devam ediyorsa ikinci tıklamayı engelle
    if (pendingFavorites.has(song.trackId)) return;

    setPendingFavorites((prev) => new Set(prev).add(song.trackId));
    const exists = favorites.some((item) => item.trackId === song.trackId);

    try {
      if (exists) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("track_id", song.trackId);

        if (error) {
          setMessage(`Favoriden kaldırılamadı: ${error.message}`);
        } else {
          setFavorites((items) => items.filter((item) => item.trackId !== song.trackId));
          setMessage("Favorilerden kaldırıldı.");
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, track_id: song.trackId, song });

        if (error) {
          setMessage(`Favorilere eklenemedi: ${error.message}`);
        } else {
          setFavorites((items) => [song, ...items.filter((i) => i.trackId !== song.trackId)]);
          setMessage("Favorilere eklendi.");
          // Arşive güvenle kaydet
          await supabase.from("seen_tracks").upsert(
            { user_id: userId, track_id: song.trackId, song, source: "favorite" },
            { onConflict: "user_id,track_id" }
          );
        }
      }
    } catch (err: unknown) {
      setMessage(`İşlem sırasında hata: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPendingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(song.trackId);
        return next;
      });
    }
  };

  // PLAYLIST OLUŞTURMA (AŞAMA 4)
  const createPlaylist = async (name: string): Promise<string | null> => {
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage("Lütfen bir çalma listesi adı girin.");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert({ user_id: userId, name: cleanName })
        .select("id,name,created_at")
        .single();

      if (error || !data) {
        setMessage(`Playlist oluşturulamadı: ${error?.message || "Bilinmeyen hata"}`);
        return null;
      }

      const created = data as Playlist;
      setPlaylists((items) => [created, ...items]);
      setActivePlaylist(created.id);
      setMessage(`"${cleanName}" listesi oluşturuldu.`);
      return created.id;
    } catch (err: unknown) {
      setMessage(`Liste oluşturulurken hata: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  // PLAYLIST YENİDEN ADLANDIRMA (AŞAMA 4)
  const renamePlaylist = async (id: string, newName: string): Promise<boolean> => {
    const cleanName = newName.trim();
    if (!cleanName) {
      setMessage("Liste adı boş bırakılamaz.");
      return false;
    }

    try {
      const { error } = await supabase
        .from("playlists")
        .update({ name: cleanName })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setMessage(`Liste adı güncellenemedi: ${error.message}`);
        return false;
      }

      setPlaylists((items) =>
        items.map((list) => (list.id === id ? { ...list, name: cleanName } : list))
      );
      setMessage(`Liste adı "${cleanName}" olarak güncellendi.`);
      return true;
    } catch (err: unknown) {
      setMessage(`Güncelleme hatası: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  // PLAYLIST SİLME (AŞAMA 4)
  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setMessage(`Playlist silinemedi: ${error.message}`);
        return;
      }

      setPlaylists((items) => {
        const remaining = items.filter((item) => item.id !== id);
        if (activePlaylist === id) {
          setActivePlaylist(remaining[0]?.id || "");
        }
        return remaining;
      });
      setMessage("Çalma listesi silindi.");
    } catch (err: unknown) {
      setMessage(`Silme hatası: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // PLAYLIST'E ŞARKI EKLEME (AŞAMA 4) - Çift ekleme engelli
  const addToPlaylist = async (playlistId: string, song: Song): Promise<boolean> => {
    if (!playlistId || !song.trackId) {
      setMessage("Lütfen önce bir çalma listesi seçin.");
      return false;
    }

    // Eğer aktif liste ise ve şarkı zaten varsa ekleme
    if (playlistId === activePlaylist && playlistSongs.some((s) => s.trackId === song.trackId)) {
      setMessage("Bu parça seçili listede zaten mevcut.");
      return true;
    }

    try {
      const { error } = await supabase.from("playlist_tracks").upsert(
        { playlist_id: playlistId, track_id: song.trackId, song },
        { onConflict: "playlist_id,track_id" }
      );

      if (error) {
        setMessage(`Şarkı listeye eklenemedi: ${error.message}`);
        return false;
      }

      setMessage(`"${song.title}" listeye eklendi.`);
      setPlaylistTrackMap((prev) => {
        const current = prev[playlistId] ?? [];
        if (current.includes(song.trackId)) return prev;
        return { ...prev, [playlistId]: [...current, song.trackId] };
      });
      if (playlistId === activePlaylist) {
        setPlaylistSongs((items) => [...items.filter((item) => item.trackId !== song.trackId), song]);
      }
      return true;
    } catch (err: unknown) {
      setMessage(`Ekleme hatası: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  // PLAYLIST'TEN ŞARKI ÇIKARMA (AŞAMA 4)
  const removeFromPlaylist = async (song: Song, targetPlaylistId?: string) => {
    const targetId = targetPlaylistId || activePlaylist;
    if (!targetId || !song.trackId) return;

    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", targetId)
        .eq("track_id", song.trackId);

      if (error) {
        setMessage(`Şarkı listeden çıkarılamadı: ${error.message}`);
        return;
      }

      setPlaylistTrackMap((prev) => ({
        ...prev,
        [targetId]: (prev[targetId] ?? []).filter((id) => id !== song.trackId),
      }));
      if (targetId === activePlaylist) {
        setPlaylistSongs((items) => items.filter((item) => item.trackId !== song.trackId));
      }
      setMessage(`"${song.title}" listeden çıkarıldı.`);
    } catch (err: unknown) {
      setMessage(`Çıkarma hatası: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const isTrackInPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      if (!playlistId || !trackId) return false;
      if (playlistId === activePlaylist && playlistSongs.some((s) => s.trackId === trackId)) {
        return true;
      }
      return (playlistTrackMap[playlistId] ?? []).includes(trackId);
    },
    [activePlaylist, playlistSongs, playlistTrackMap]
  );

  // AKILLI LİSTE KAYDETME (AŞAMA 5)
  const saveSmart = async (name: string, songs: Song[]) => {
    if (!songs.length) {
      setMessage("Kaydedilecek parça bulunmuyor.");
      return;
    }

    const id = await createPlaylist(name);
    if (!id) return;

    try {
      const uniqueSongs = Array.from(new Map(songs.map((s) => [s.trackId, s])).values());
      const { error } = await supabase.from("playlist_tracks").upsert(
        uniqueSongs.map((song) => ({ playlist_id: id, track_id: song.trackId, song })),
        { onConflict: "playlist_id,track_id" }
      );

      if (error) {
        setMessage(`Parçalar listeye eklenemedi: ${error.message}`);
        return;
      }

      setActivePlaylist(id);
      setPlaylistSongs(uniqueSongs);
      setPlaylistTrackMap((prev) => ({
        ...prev,
        [id]: uniqueSongs.map((s) => s.trackId),
      }));
      setMessage(`"${name}" (${uniqueSongs.length} parça) başarıyla kaydedildi.`);
    } catch (err: unknown) {
      setMessage(`Akıllı liste kaydetme hatası: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return {
    favorites,
    playlists,
    activePlaylist,
    setActivePlaylist,
    playlistSongs,
    playlistTrackMap,
    isTrackInPlaylist,
    message,
    setMessage,
    loading,
    pendingFavorites,
    toggleFavorite,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    saveSmart,
    reload,
  };
}
