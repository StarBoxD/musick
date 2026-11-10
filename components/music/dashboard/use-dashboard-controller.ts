"use client";

import { useEffect, useRef, useState } from "react";
import type { Mood, PlaybackSource, Song } from "@/types/music";
import { postMusic } from "@/lib/music/audius";
import { MOOD_META } from "@/components/music/discover-panel";
import type { Tab } from "@/components/music/dashboard/dashboard-types";
import type { useLibrary } from "@/components/music/use-library";

type UseDashboardControllerParams = {
  library: ReturnType<typeof useLibrary>;
  play: (songs: Song[], nextIndex: number, source?: PlaybackSource) => void;
  setTab: (tab: Tab) => void;
  showToast: (text: string) => void;
};

export function useToastNotification() {
  const [toastNote, setToastNote] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return { toastNote, showToast };
}

export function useDashboardController({
  library,
  play,
  setTab,
  showToast,
}: UseDashboardControllerParams) {
  const [homeSongs, setHomeSongs] = useState<Song[]>([]);
  const [dailySong, setDailySong] = useState<Song | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);

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

  const handleToggleSongInPlaylist = async (
    playlistId: string,
    playlistTitle: string,
    track: Song
  ) => {
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

  const handleCreatePlaylistAndAdd = async (cleanName: string, track: Song) => {
    const newId = await library.createPlaylist(cleanName);
    if (newId) {
      await library.addToPlaylist(newId, track);
      showToast(`"${cleanName}" albümü oluşturuldu ve "${track.title}" eklendi.`);
    }
  };

  return {
    homeSongs,
    dailySong,
    homeLoading,
    startMoodFromHome,
    handleToggleSongInPlaylist,
    handleCreatePlaylistAndAdd,
  };
}
