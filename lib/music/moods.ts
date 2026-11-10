import type { Mood } from "@/types/music";

export const MOODS: Mood[] = ["Happy", "Sad", "Chill", "Energetic", "Romantic", "Focus", "Nostalgic", "Dark"];

const MOOD_TERMS: Record<Mood, string[]> = {
  Happy: [
    "Tarkan", "Kenan Doğulu", "Edis", "Murat Boz", "Hande Yener", 
    "Gülşen", "Simge", "İrem Derici", "Buray", "Yalın"
  ],
  Sad: [
    "Sezen Aksu", "Teoman", "Emre Aydın", "Model", "Zakkum", 
    "Cem Adrian", "Yüzyüzeyken Konuşuruz", "Sertab Erener"
  ],
  Chill: [
    "Büyük Ev Ablukada", "Yüzyüzeyken Konuşuruz", "Dolu Kadehi Ters Tut", 
    "Madrigal", "Pinhani", "Can Bonomo", "Kaan Tangöze", "Adamlar"
  ],
  Energetic: [
    "Ezhel", "Uzi", "Lvbel C5", "Motive", "Çakal", "Ceza", 
    "Sagopa Kajmer", "Gazapizm", "Güneş", "Manga", "Athena"
  ],
  Romantic: [
    "Yalın", "Kenan Doğulu", "Sezen Aksu", "Mabel Matiz", 
    "Sertab Erener", "Buray", "Emir Can İğrek"
  ],
  Focus: [
    "Mercan Dede", "Cahit Berkay", "türkçe enstrümantal", "türkçe akustik gitar", 
    "türkçe piyano", "anadolu enstrümantal"
  ],
  Nostalgic: [
    "Barış Manço", "Cem Karaca", "Erkin Koray", "Sezen Aksu", 
    "Tarkan 90lar", "Mirkelam", "Bendeniz", "MFÖ"
  ],
  Dark: [
    "Duman", "Mor ve Ötesi", "Şebnem Ferah", "Hayko Cepkin", 
    "Pentagram", "Manga rock", "Ogün Sanlısoy"
  ],
};

const GEM_TERMS = [
  "Büyük Ev Ablukada", "Adamlar", "Dolu Kadehi Ters Tut", "Jakuzi", 
  "Palmiyeler", "Sedef Sebüktekin", "Karakter", "Gevende", "Hedonutopia"
];

const POPULAR_TERMS = [
  "Duman", "Mor ve Ötesi", "Ezhel", "Tarkan", "Sezen Aksu", "Uzi", "Madrigal"
];

const DAILY_TERMS = [
  "Duman", "Mor ve Ötesi", "Sezen Aksu", "Teoman", "Ezhel", "Adamlar", 
  "Madrigal", "Pinhani", "Tarkan", "Dolu Kadehi Ters Tut"
];

export function termsFor(kind: "mood" | "gems" | "daily" | "popular", mood?: Mood) {
  if (kind === "mood" && mood) return MOOD_TERMS[mood];
  if (kind === "gems") return GEM_TERMS;
  if (kind === "popular") return POPULAR_TERMS;
  return DAILY_TERMS;
}
