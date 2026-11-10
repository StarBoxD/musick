"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Playlist, Song } from "@/types/music";
import { usePlaylistMutations } from "@/components/music/library/use-playlist-mutations";
import { useFavoriteActions } from "@/components/music/library/use-favorite-actions";

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
        setFavorites((favResult.data ?? []).map((row) => row.song as Song));
      }

      if (listResult.error) {
        setMessage(`Çalma listeleri yüklenemedi: ${listResult.error.message}`);
      } else {
        const loadedLists = (listResult.data ?? []) as Playlist[];
        setPlaylists(loadedLists);
        setActivePlaylist((prev) =>
          prev && loadedLists.some((l) => l.id === prev) ? prev : loadedLists[0]?.id || ""
        );
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

  const {
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  } = usePlaylistMutations({
    supabase,
    userId,
    activePlaylist,
    setActivePlaylist,
    playlistSongs,
    setPlaylistSongs,
    setPlaylists,
    setPlaylistTrackMap,
    setMessage,
  });

  const { toggleFavorite, saveSmart } = useFavoriteActions({
    supabase,
    userId,
    favorites,
    setFavorites,
    pendingFavorites,
    setPendingFavorites,
    setActivePlaylist,
    setPlaylistSongs,
    setPlaylistTrackMap,
    setMessage,
    createPlaylist,
  });

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
