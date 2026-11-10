"use client";

import Link from "next/link";
import { AudioLines, Compass, Search, Shuffle } from "lucide-react";
import SignOutButton from "@/components/sign-out-button";
import InstallAppButton from "@/components/pwa/install-app-button";
import { COPY, type Tab } from "@/components/music/dashboard/dashboard-types";

type MusicTopbarProps = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  displayName: string;
  topbarSearch: string;
  setTopbarSearch: (value: string) => void;
  onQuickSearch: (query: string) => void;
  onStartRandomMood: () => void;
};

export default function MusicTopbar({
  tab,
  setTab,
  displayName,
  topbarSearch,
  setTopbarSearch,
  onQuickSearch,
  onStartRandomMood,
}: MusicTopbarProps) {
  return (
    <>
      <header className="music-topbar">
        <div className="topbar-left">
          <Link href="/" className="mobile-brand">
            <span className="brand-mark">
              <AudioLines size={16} />
            </span>
            VYBE<span className="lime">.</span>
          </Link>
          <span className="eyebrow">{COPY[tab].kicker}</span>
        </div>

        <div className="topbar-right">
          <form
            className="topbar-quick-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (!topbarSearch.trim()) return;
              onQuickSearch(topbarSearch.trim());
            }}
          >
            <Search size={15} />
            <input
              id="topbar-search-input"
              type="search"
              value={topbarSearch}
              onChange={(e) => setTopbarSearch(e.target.value)}
              placeholder="Hızlı parça veya sanatçı ara..."
              aria-label="Hızlı arama"
            />
          </form>

          <InstallAppButton compact />

          <div className="mobile-user">
            <span className="side-avatar mobile-avatar">
              {displayName.trim().charAt(0).toUpperCase() || "V"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="music-heading">
        <div>
          <h1>{COPY[tab].title}</h1>
          <p>{COPY[tab].subtitle}</p>
        </div>
        <div className="heading-quick-actions">
          <button
            type="button"
            className="action-btn"
            onClick={() => setTab("discover")}
          >
            <Compass size={15} />
            <span>Keşfet</span>
          </button>
          <button
            type="button"
            className="action-btn next-btn"
            onClick={onStartRandomMood}
          >
            <Shuffle size={15} />
            <span>Frekans Başlat</span>
          </button>
        </div>
      </div>
    </>
  );
}
