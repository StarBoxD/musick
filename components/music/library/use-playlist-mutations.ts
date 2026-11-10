"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Playlist, Song } from "@/types/music";

type PlaylistMutationDeps = {
  supabase: SupabaseClient;
  userId: string;
  activePlaylist: string;
  setActivePlaylist: Dispatch<SetStateAction<string>>;
  playlistSongs: Song[];
  setPlaylistSongs: Dispatch<SetStateAction<Song[]>>;
  setPlaylists: Dispatch<SetStateAction<Playlist[]>>;
  setPlaylistTrackMap: Dispatch<SetStateAction<Record<string, string[]>>>;
  setMessage: Dispatch<SetStateAction<string>>;
};

export function usePlaylistMutations({
  supabase,
  userId,
  activePlaylist,
  setActivePlaylist,
  playlistSongs,
  setPlaylistSongs,
  setPlaylists,
  setPlaylistTrackMap,
  setMessage,
}: PlaylistMutationDeps) {
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

  const addToPlaylist = async (playlistId: string, song: Song): Promise<boolean> => {
    if (!playlistId || !song.trackId) {
      setMessage("Lütfen önce bir çalma listesi seçin.");
      return false;
    }

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

  return {
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };
}
