"use client";

import {
  CloudRain,
  Disc3,
  Flame,
  Headphones,
  Heart,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { MOODS } from "@/lib/music/moods";
import type { Mood } from "@/types/music";

export const MOOD_META: Record<
  Mood,
  { label: string; desc: string; tag: string; icon: typeof Sun }
> = {
  Happy: { label: "Upbeat", desc: "Hareketli Türkçe Pop", tag: "POP", icon: Sun },
  Sad: { label: "Melancholy", desc: "Duygusal & Akustik", tag: "SLOW", icon: CloudRain },
  Chill: { label: "Chill", desc: "Alternatif & Sakin", tag: "INDIE", icon: Moon },
  Energetic: { label: "High Tempo", desc: "Türkçe Rap & Hip-Hop", tag: "RAP", icon: Zap },
  Romantic: { label: "Late Night", desc: "Slow & Aşk Şarkıları", tag: "SOUL", icon: Heart },
  Focus: { label: "Deep Focus", desc: "Enstrümantal & Akustik", tag: "INSTRUMENTAL", icon: Headphones },
  Nostalgic: { label: "Classics", desc: "90'lar & Anadolu Rock", tag: "RETRO", icon: Disc3 },
  Dark: { label: "Alt Rock", desc: "Türkçe Rock & Kült", tag: "ROCK", icon: Flame },
};

type MoodGridProps = {
  activeMood: Mood | null;
  loading: boolean;
  onSelectMood: (mood: Mood) => void;
};

export default function MoodGrid({ activeMood, loading, onSelectMood }: MoodGridProps) {
  return (
    <div className="discover-section-block">
      <div className="section-caption">
        <span>FREKANS & RUH HÂLİ KANALLARI</span>
        <span>8 STÜDYO İSTASYONU</span>
      </div>
      <div className="mood-grid">
        {MOODS.map((item) => {
          const meta = MOOD_META[item];
          const Icon = meta.icon;
          const isActive = activeMood === item;
          return (
            <button
              key={item}
              type="button"
              className={`mood-card mood-${item.toLowerCase()} ${isActive ? "active" : ""}`}
              onClick={() => onSelectMood(item)}
              disabled={loading}
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
    </div>
  );
}
