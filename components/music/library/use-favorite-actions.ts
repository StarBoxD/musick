"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Song } from "@/types/music";

type FavoriteActionsDeps = {
  supabase: SupabaseClient;
  userId: string;
  favorites: Song[];
  setFavorites: Dispatch<SetStateAction<Song[]>>;
  pendingFavorites: Set<string>;
  setPendingFavorites: Dispatch<SetStateAction<Set<string>>>;
  setActivePlaylist: Dispatch<SetStateAction<string>>;
  setPlaylistSongs: Dispatch<SetStateAction<Song[]>>;
  setPlaylistTrackMap: Dispatch<SetStateAction<Record<string, string[]>>>;
  setMessage: Dispatch<SetStateAction<string>>;
  createPlaylist: (name: string) => Promise<string | null>;
};

export function useFavoriteActions({
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
}: FavoriteActionsDeps) {
  const toggleFavorite = async (song: Song) => {
    if (!userId || !song.trackId || pendingFavorites.has(song.trackId)) return;

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
    toggleFavorite,
    saveSmart,
  };
}
