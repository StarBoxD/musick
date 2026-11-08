import type { Mood } from "@/types/music";

export const MOODS: Mood[] = ["Happy", "Sad", "Chill", "Energetic", "Romantic", "Focus", "Nostalgic", "Dark"];

const MOOD_TERMS: Record<Mood, string[]> = {
  Happy: ["feel good pop", "happy dance", "upbeat pop"],
  Sad: ["sad piano", "heartbreak ballad", "melancholy indie"],
  Chill: ["chillhop", "acoustic chill", "lofi beats"],
  Energetic: ["workout edm", "high energy rock", "drum and bass"],
  Romantic: ["romantic soul", "love song rnb", "slow love"],
  Focus: ["focus instrumental", "minimal piano", "study ambient"],
  Nostalgic: ["90s pop", "2000s rnb", "old school soul"],
  Dark: ["dark pop", "darkwave", "gothic rock"],
};

const GEM_TERMS = ["bedroom pop", "indie folk", "leftfield electronic", "jazz trio"];
const POPULAR_TERMS = ["top hits", "today hits"];
const DAILY_TERMS = ["fresh finds", "new music", "alternative pop"];

export function termsFor(kind: "mood" | "gems" | "daily" | "popular", mood?: Mood) {
  if (kind === "mood" && mood) return MOOD_TERMS[mood];
  if (kind === "gems") return GEM_TERMS;
  if (kind === "popular") return POPULAR_TERMS;
  return DAILY_TERMS;
}
