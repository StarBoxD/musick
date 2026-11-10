"use client";

import { ArrowRight, Heart, ListMusic, Sparkles, Wand2 } from "lucide-react";
import type { Tab } from "@/components/music/dashboard/dashboard-types";

type HomeCollectionsSummaryProps = {
  favoritesCount: number;
  playlistsCount: number;
  setTab: (tab: Tab) => void;
};

export default function HomeCollectionsSummary({
  favoritesCount,
  playlistsCount,
  setTab,
}: HomeCollectionsSummaryProps) {
  return (
    <section className="home-section">
      <div className="section-caption">
        <span>ALBÜM &amp; ŞARKI KOLEKSİYONLARIN</span>
        <button
          type="button"
          className="text-action"
          onClick={() => setTab("playlists")}
        >
          Koleksiyonları Yönet
        </button>
      </div>
      <div className="home-collections-grid">
        <button
          type="button"
          className="collection-summary-card"
          onClick={() => setTab("favorites")}
        >
          <span className="collection-summary-icon is-lime">
            <Heart size={20} />
          </span>
          <div className="collection-summary-info">
            <strong>Favori Parçaların</strong>
            <small>{favoritesCount} kayıtlı şarkı</small>
          </div>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="collection-summary-card"
          onClick={() => setTab("playlists")}
        >
          <span className="collection-summary-icon">
            <ListMusic size={20} />
          </span>
          <div className="collection-summary-info">
            <strong>Çalma Listelerin</strong>
            <small>{playlistsCount} özel koleksiyon</small>
          </div>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="collection-summary-card"
          onClick={() => setTab("match")}
        >
          <span className="collection-summary-icon">
            <Sparkles size={20} />
          </span>
          <div className="collection-summary-info">
            <strong>Zevk Eşleşmesi</strong>
            <small>Favorilerine göre yeni sesler</small>
          </div>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="collection-summary-card"
          onClick={() => setTab("smart")}
        >
          <span className="collection-summary-icon">
            <Wand2 size={20} />
          </span>
          <div className="collection-summary-info">
            <strong>Akıllı Listeler</strong>
            <small>Otomatik derlenen listeler</small>
          </div>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
