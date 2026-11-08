"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { postMusic, searchMusic } from "@/lib/music/audius";
import { MOODS } from "@/lib/music/moods";
import type { Mood, Song } from "@/types/music";
import SongGrid from "@/components/music/song-grid";

type Props = {
  favorites: Song[];
  onPlay: (songs: Song[], index: number) => void;
  onFavorite: (song: Song) => void;
  onAdd: (song: Song) => void;
};

export default function DiscoverPanel({ favorites, onPlay, onFavorite, onAdd }: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Bir ruh hâli seç. Gösterilen parça bir daha çıkmaz.");

  const discover = async (nextMood: Mood) => {
    setMood(nextMood);
    setLoading(true);
    setMessage("");
    try {
      const data = await postMusic("/api/music/discover", { mood: nextMood });
      setSongs(data.songs ?? []);
      setMessage(data.note || (data.exhausted ? "Bu havuzda yeni şarkı kalmadı. Eski parçalar tekrar açılmıyor." : ""));
    } catch (error) {
      setSongs([]);
      setMessage(error instanceof Error ? error.message : "Keşif açılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await searchMusic(query);
      setSongs(data.songs);
      setMessage(data.note || (data.exhausted ? "Bu aramadaki yeni parçalar bitti." : ""));
    } catch (error) {
      setSongs([]);
      setMessage(error instanceof Error ? error.message : "Arama açılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mood-grid">
        {MOODS.map((item) => (
          <button key={item} className={mood === item ? "mood-card active" : "mood-card"} onClick={() => void discover(item)}>
            <b>{item}</b>
            <small>yeni parçalar</small>
          </button>
        ))}
      </div>
      <form className="music-search" onSubmit={(event) => { event.preventDefault(); void search(); }}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şarkı veya sanatçı ara..." />
        <button disabled={loading}>{loading ? "Aranıyor" : "Ara"}</button>
      </form>
      {message && <p className="music-message">{message}</p>}
      <SongGrid songs={songs} favorites={favorites} empty={loading ? "Yeni parçalar aranıyor..." : "Henüz parça yok."} onPlay={onPlay} onFavorite={onFavorite} onAdd={onAdd} />
    </div>
  );
}
