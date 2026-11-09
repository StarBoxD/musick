import type { Mood } from "@/types/music";

export const MOODS: Mood[] = ["Happy", "Sad", "Chill", "Energetic", "Romantic", "Focus", "Nostalgic", "Dark"];

const MOOD_TERMS: Record<Mood, string[]> = {
  Happy: ["turkce pop", "türkçe pop", "hareketli pop türkçe", "neşeli türkçe"],
  Sad: ["turkce slow", "türkçe akustik", "hüzünlü türkçe", "duygusal türkçe slow"],
  Chill: ["turkce lofi", "türkçe lofi", "sakin türkçe", "akustik türkçe"],
  Energetic: ["turkce rap", "türkçe rap", "türkçe trap", "türkçe remix"],
  Romantic: ["turkce ask sarkilari", "türkçe aşk şarkıları", "romantik türkçe", "türkçe slow aşk"],
  Focus: ["turkce enstrumantal", "türkçe piyano", "türkçe ney fon", "türkçe akustik gitar"],
  Nostalgic: ["90lar turkce pop", "90lar türkçe pop", "2000ler turkce pop", "anadolu rock", "yeşilçam müzikleri"],
  Dark: ["turkce rock", "türkçe alternatif rock", "mor ve ötesi", "duman", "şebnem ferah"],
};

const GEM_TERMS = ["türkçe indie", "türkçe alternatif", "keşif türkçe", "bağımsız türkçe"];
const POPULAR_TERMS = ["turkce pop hit", "türkçe en çok dinlenen", "türkçe hit 2024", "türkçe popüler"];
const DAILY_TERMS = ["turkce müzik", "türkçe şarkılar", "türkçe yeni", "türkçe pop"];

export function termsFor(kind: "mood" | "gems" | "daily" | "popular", mood?: Mood) {
  if (kind === "mood" && mood) return MOOD_TERMS[mood];
  if (kind === "gems") return GEM_TERMS;
  if (kind === "popular") return POPULAR_TERMS;
  return DAILY_TERMS;
}
