"use client";

import {
  Compass,
  Gem,
  Heart,
  Home,
  ListMusic,
  Sparkles,
  SunMedium,
  Wand2,
} from "lucide-react";

export type Tab =
  | "home"
  | "discover"
  | "daily"
  | "match"
  | "gems"
  | "smart"
  | "favorites"
  | "playlists";

export const TABS: {
  id: Tab;
  label: string;
  icon: typeof Compass;
  group: "main" | "discover" | "library";
}[] = [
  { id: "home", label: "Ana Sayfa", icon: Home, group: "main" },
  { id: "discover", label: "Keşfet", icon: Compass, group: "main" },
  { id: "daily", label: "Günlük Parça", icon: SunMedium, group: "discover" },
  { id: "match", label: "Eşleşme", icon: Sparkles, group: "discover" },
  { id: "gems", label: "Alternatif", icon: Gem, group: "discover" },
  { id: "smart", label: "Akıllı Listeler", icon: Wand2, group: "discover" },
  { id: "favorites", label: "Favoriler", icon: Heart, group: "library" },
  { id: "playlists", label: "Çalma Listeleri", icon: ListMusic, group: "library" },
];

export const COPY: Record<Tab, { kicker: string; title: string; subtitle: string }> = {
  home: {
    kicker: "ANA DASHBOARD",
    title: "Müziğin merkezindesin.",
    subtitle: "Kişiselleştirilmiş öneriler, günün parçası, canlı frekanslar ve koleksiyonların tek ekranda.",
  },
  discover: {
    kicker: "KEŞFET & FREKANSLAR",
    title: "Hangi frekanstasın?",
    subtitle: "Sanatçı veya parça ara, 8 stüdyo frekansından birini seç ve kesintisiz dinle.",
  },
  daily: {
    kicker: "GÜNÜN SEÇKİSİ",
    title: "Günün parçası.",
    subtitle: "Her gün senin için seçilen özel Türkçe kayıt.",
  },
  match: {
    kicker: "ZEVK ANALİZİ",
    title: "Frekansına yakın sesler.",
    subtitle: "Favorilediğin sanatçılara göre hiç dinlemediğin parçalar.",
  },
  gems: {
    kicker: "ALTERNATİF SAHNE",
    title: "Ana akımın ötesinde.",
    subtitle: "Bağımsız ve alternatif Türkçe sahneden seçkiler.",
  },
  smart: {
    kicker: "OTOMATİK KURGU",
    title: "Akıllı listeler.",
    subtitle: "Favorilerinden otomatik derlenen dinamik koleksiyonlar.",
  },
  favorites: {
    kicker: "KÜTÜPHANE ARŞİVİ",
    title: "Favoriler.",
    subtitle: "Beğendiğin ve arşivlediğin tüm parçalar.",
  },
  playlists: {
    kicker: "KOLEKSİYONLAR",
    title: "Çalma listelerin.",
    subtitle: "Kendi listelerini oluştur, düzenle ve kesintisiz dinle.",
  },
};

export const PRIMARY_MOBILE_TABS: Tab[] = ["home", "discover", "favorites", "playlists"];
export const MORE_MOBILE_TABS: Tab[] = ["daily", "match", "gems", "smart"];
