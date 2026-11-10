"use client";

import Link from "next/link";
import { AudioLines, ListMusic } from "lucide-react";
import type { Playlist } from "@/types/music";
import SignOutButton from "@/components/sign-out-button";
import InstallAppButton from "@/components/pwa/install-app-button";
import { TABS, type Tab } from "@/components/music/dashboard/dashboard-types";

type MusicSidebarProps = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  displayName: string;
  favoritesCount: number;
  playlists: Playlist[];
  activePlaylist: string;
  setActivePlaylist: (id: string) => void;
};

export default function MusicSidebar({
  tab,
  setTab,
  displayName,
  favoritesCount,
  playlists,
  activePlaylist,
  setActivePlaylist,
}: MusicSidebarProps) {
  return (
    <aside className="music-sidebar" id="music-sidebar">
      <div className="sidebar-brand-row">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <AudioLines size={18} />
          </span>
          VYBE<span className="lime">.</span>
        </Link>
        <span className="beta-tag">STUDIO</span>
      </div>

      <nav className="side-nav" aria-label="Ana menü">
        <span className="side-label">MENÜ</span>
        {TABS.filter((t) => t.group === "main").map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "side-link active" : "side-link"}
            onClick={() => setTab(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            <span className="side-icon">
              <item.icon size={16} />
            </span>
            <span className="side-text">{item.label}</span>
          </button>
        ))}

        <span className="side-label">KEŞİF KANALLARI</span>
        {TABS.filter((t) => t.group === "discover").map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "side-link active" : "side-link"}
            onClick={() => setTab(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            <span className="side-icon">
              <item.icon size={16} />
            </span>
            <span className="side-text">{item.label}</span>
          </button>
        ))}

        <span className="side-label">KÜTÜPHANE</span>
        {TABS.filter((t) => t.group === "library").map((item) => {
          const count =
            item.id === "favorites"
              ? favoritesCount
              : item.id === "playlists"
              ? playlists.length
              : 0;
          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "side-link active" : "side-link"}
              onClick={() => setTab(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <span className="side-icon">
                <item.icon size={16} />
              </span>
              <span className="side-text">{item.label}</span>
              {count > 0 && <span className="side-count-badge">{count}</span>}
            </button>
          );
        })}

        {playlists.length > 0 && (
          <div className="sidebar-playlists-group">
            <span className="side-label">KOLEKSİYONLARIN</span>
            {playlists.slice(0, 4).map((pl) => (
              <button
                key={pl.id}
                type="button"
                className={
                  tab === "playlists" && activePlaylist === pl.id
                    ? "side-playlist-shortcut active"
                    : "side-playlist-shortcut"
                }
                onClick={() => {
                  setActivePlaylist(pl.id);
                  setTab("playlists");
                }}
                title={pl.name}
              >
                <ListMusic size={13} />
                <span>{pl.name}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-pwa-slot">
        <InstallAppButton />
      </div>

      <div className="sidebar-bottom">
        <div className="side-user">
          <span className="side-avatar">{displayName.trim().charAt(0).toUpperCase() || "V"}</span>
          <div className="side-user-text">
            <b>{displayName}</b>
            <small>Stüdyo Üyesi</small>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
