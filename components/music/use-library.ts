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
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    const [favResult, listResult] = await Promise.all([
      supabase.from("favorites").select("song,track_id").eq("user_id", userId),
      supabase.from("playlists").select("id,name,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    const songs = (favResult.data ?? []).map((row) => row.song as Song);
    const loadedLists = (listResult.data ?? []) as Playlist[];
    setFavorites(songs);
    setPlaylists(loadedLists);
    setActivePlaylist((prev) => prev || loadedLists[0]?.id || "");
    if (songs.length) {
      await supabase.from("seen_tracks").upsert(
        songs.map((song) => ({ user_id: userId, track_id: song.trackId, song, source: "favorite" })),
        { onConflict: "user_id,track_id" }
      );
    }
  }, [supabase, userId]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    if (!activePlaylist) { setPlaylistSongs([]); return; }
    supabase.from("playlist_tracks").select("song").eq("playlist_id", activePlaylist)
      .then(({ data }) => setPlaylistSongs((data ?? []).map((row) => row.song as Song)));
  }, [activePlaylist, supabase]);

  const toggleFavorite = async (song: Song) => {
    const exists = favorites.some((item) => item.trackId === song.trackId);
    if (exists) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("track_id", song.trackId);
      if (!error) setFavorites((items) => items.filter((item) => item.trackId !== song.trackId));
      return;
    }
    const { error } = await supabase.from("favorites").insert({ user_id: userId, track_id: song.trackId, song });
    if (!error) setFavorites((items) => [song, ...items]);
    await supabase.from("seen_tracks").upsert({ user_id: userId, track_id: song.trackId, song, source: "favorite" }, { onConflict: "user_id,track_id" });
  };

  const createPlaylist = async (name: string) => {
    const { data, error } = await supabase.from("playlists").insert({ user_id: userId, name }).select("id,name,created_at").single();
    if (error || !data) { setMessage("Playlist oluşturulamadı. Favori tablolarının SQL'i çalışmış olmalı."); return null; }
    setPlaylists((items) => [data as Playlist, ...items]);
    setActivePlaylist(data.id);
    return data.id as string;
  };

  const deletePlaylist = async (id: string) => {
    const { error } = await supabase.from("playlists").delete().eq("id", id).eq("user_id", userId);
    if (error) { setMessage("Playlist silinemedi."); return; }
    setPlaylists((items) => items.filter((item) => item.id !== id));
    if (activePlaylist === id) setActivePlaylist("");
  };

  const addToPlaylist = async (playlistId: string, song: Song) => {
    const { error } = await supabase.from("playlist_tracks").upsert(
      { playlist_id: playlistId, track_id: song.trackId, song },
      { onConflict: "playlist_id,track_id" }
    );
    setMessage(error ? "Şarkı listeye eklenemedi." : "Şarkı playlist'e eklendi.");
    if (!error && playlistId === activePlaylist) {
      setPlaylistSongs((items) => [song, ...items.filter((item) => item.trackId !== song.trackId)]);
    }
  };

  const removeFromPlaylist = async (song: Song) => {
    if (!activePlaylist) return;
    const { error } = await supabase.from("playlist_tracks").delete().eq("playlist_id", activePlaylist).eq("track_id", song.trackId);
    if (!error) setPlaylistSongs((items) => items.filter((item) => item.trackId !== song.trackId));
  };

  const saveSmart = async (name: string, songs: Song[]) => {
    const id = await createPlaylist(name);
    if (!id) return;
    if (songs.length) {
      await supabase.from("playlist_tracks").upsert(
        songs.map((song) => ({ playlist_id: id, track_id: song.trackId, song })),
        { onConflict: "playlist_id,track_id" }
      );
    }
    setMessage("Akıllı liste kaydedildi.");
  };

  return {
    favorites, playlists, activePlaylist, setActivePlaylist, playlistSongs,
    message, setMessage, toggleFavorite, createPlaylist, deletePlaylist,
    addToPlaylist, removeFromPlaylist, saveSmart,
  };
}
