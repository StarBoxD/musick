"use client";

import { useRef, useState } from "react";
import type { PlaybackSource, Song } from "@/types/music";

type UsePlaybackQueueParams = {
  setMessage: (msg: string) => void;
  showToast: (text: string) => void;
};

export function usePlaybackQueue({ setMessage, showToast }: UsePlaybackQueueParams) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null);
  const isFetchingMoreRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const song = queue[index] ?? null;

  const play = (songs: Song[], nextIndex: number, source?: PlaybackSource) => {
    fetchRequestIdRef.current += 1;
    setQueue(songs);
    setIndex(nextIndex);
    setPlaybackSource(source ?? { type: "direct" });
  };

  const enqueue = (track: Song) => {
    if (!track?.trackId) return;

    if (queue.some((item) => item.trackId === track.trackId)) {
      const duplicateMsg = `"${track.title}" zaten oynatma sırasında.`;
      setMessage(duplicateMsg);
      showToast(duplicateMsg);
      return;
    }

    const wasEmpty = queue.length === 0;
    setQueue((prevQueue) => {
      if (prevQueue.some((item) => item.trackId === track.trackId)) return prevQueue;
      return [...prevQueue, track];
    });

    if (wasEmpty) {
      setIndex(0);
      if (!playbackSource) {
        setPlaybackSource({ type: "direct" });
      }
    }

    const addedMsg = `"${track.title}" sıraya eklendi.`;
    setMessage(addedMsg);
    showToast(addedMsg);
  };

  const appendUniqueSongs = (currentRequestId: number, incoming: Song[]): number => {
    let addedCount = 0;
    setQueue((prevQueue) => {
      if (currentRequestId !== fetchRequestIdRef.current) return prevQueue;
      const fresh = incoming.filter((s) => !prevQueue.some((q) => q.trackId === s.trackId));
      addedCount = fresh.length;
      return addedCount > 0 ? [...prevQueue, ...fresh] : prevQueue;
    });
    return addedCount;
  };

  const fetchMoreSongs = async () => {
    if (isFetchingMoreRef.current) return;
    if (!playbackSource) {
      setMessage("Kuyruktaki tüm parçalar dinlendi.");
      return;
    }

    const currentRequestId = ++fetchRequestIdRef.current;
    const activeSource = playbackSource;
    isFetchingMoreRef.current = true;

    try {
      if (activeSource.type === "mood" && activeSource.mood) {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/discover", { mood: activeSource.mood });
        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        const addedCount = appendUniqueSongs(currentRequestId, incoming);
        if (addedCount === 0) {
          setMessage(`${activeSource.mood} frekansındaki tüm parçalar dinlendi.`);
        }
        return;
      }

      if (activeSource.type === "match") {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/match");
        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        const addedCount = appendUniqueSongs(currentRequestId, incoming);
        if (addedCount === 0) {
          setMessage("Eşleşme kanalındaki tüm parçalar dinlendi.");
        }
        return;
      }

      if (activeSource.type === "gems") {
        const { postMusic: fetchPost } = await import("@/lib/music/audius");
        const data = await fetchPost("/api/music/gems");
        if (currentRequestId !== fetchRequestIdRef.current) return;

        const incoming = (data.songs ?? []) as Song[];
        const addedCount = appendUniqueSongs(currentRequestId, incoming);
        if (addedCount === 0) {
          setMessage("Keşfedilmemiş parçalar listesi tamamlandı.");
        }
        return;
      }

      if (activeSource.type === "favorites") {
        setMessage("Favorilerdeki tüm parçalar dinlendi.");
        return;
      }
      if (activeSource.type === "playlist") {
        setMessage(activeSource.label ? `"${activeSource.label}" listesi tamamlandı.` : "Çalma listesi tamamlandı.");
        return;
      }
      if (activeSource.type === "smart") {
        setMessage(activeSource.label ? `"${activeSource.label}" listesi tamamlandı.` : "Akıllı liste tamamlandı.");
        return;
      }
      if (activeSource.type === "daily") {
        setMessage("Günün parçası tamamlandı.");
        return;
      }
      if (activeSource.type === "search") {
        setMessage(
          activeSource.query
            ? `"${activeSource.query}" arama sonuçları tamamlandı.`
            : "Arama sonuçlarındaki tüm parçalar dinlendi."
        );
        return;
      }

      setMessage("Kuyruktaki tüm parçalar dinlendi.");
    } catch {
      setMessage("Yeni parçalar yüklenirken bir bağlantı sorunu oluştu.");
    } finally {
      isFetchingMoreRef.current = false;
    }
  };

  return {
    queue,
    setQueue,
    index,
    setIndex,
    playbackSource,
    setPlaybackSource,
    song,
    play,
    enqueue,
    fetchMoreSongs,
  };
}
