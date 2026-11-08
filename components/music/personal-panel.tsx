"use client";

import { useEffect, useState } from "react";
import { postMusic } from "@/lib/music/audius";
import type { SmartList, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

type Mode = "daily" | "match" | "gems" | "smart";
type Props = {
  mode: Mode;
  favorites: Song[];
  onPlay: (songs: Song[], index: number) => void;
  onFavorite: (song: Song) => void;
  onAdd: (song: Song) => void;
  onSaveSmart: (name: string, songs: Song[]) => void;
};

export default function PersonalPanel({ mode, favorites, onPlay, onFavorite, onAdd, onSaveSmart }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [lists, setLists] = useState<SmartList[]>([]);
  const [message, setMessage] = useState("Yükleniyor...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    postMusic(`/api/music/${mode}`).then((data) => {
      if (cancel) return;
      if (mode === "daily") setSongs(data.song ? [data.song] : []);
      else if (mode === "smart") setLists(data.suggestions ?? []);
      else setSongs(data.songs ?? []);
      setMessage(data.note || data.error || (data.exhausted ? "Yeni parça kalmadı. Eskiler tekrar açılmıyor." : ""));
    }).catch((error: Error) => {
      if (!cancel) { setSongs([]); setMessage(error.message); }
    }).finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [mode]);

  if (mode === "smart") {
    return (
      <div className="smart-list">
        {message && <p className="music-message">{message}</p>}
        {!lists.length && !loading && <div className="empty-state">Öneri yok.</div>}
        {lists.map((list) => (
          <section key={list.name}>
            <div className="section-caption"><span>{list.name}</span><button className="text-action" onClick={() => onSaveSmart(list.name, list.songs)}>Kaydet</button></div>
            <SongGrid songs={list.songs} favorites={favorites} empty="" onPlay={onPlay} onFavorite={onFavorite} onAdd={onAdd} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div>
      {message && <p className="music-message">{message}</p>}
      <SongGrid songs={songs} favorites={favorites} empty={loading ? "Hazırlanıyor..." : "Gösterilecek yeni parça yok."} onPlay={onPlay} onFavorite={onFavorite} onAdd={onAdd} />
    </div>
  );
}
