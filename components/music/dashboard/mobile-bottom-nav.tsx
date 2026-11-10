"use client";

import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import {
  COPY,
  MORE_MOBILE_TABS,
  PRIMARY_MOBILE_TABS,
  TABS,
  type Tab,
} from "@/components/music/dashboard/dashboard-types";

type MobileBottomNavProps = {
  tab: Tab;
  setTab: (tab: Tab) => void;
};

export default function MobileBottomNav({ tab, setTab }: MobileBottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isMoreActive = MORE_MOBILE_TABS.includes(tab);
  const activeMoreTab = isMoreActive ? TABS.find((t) => t.id === tab) : null;

  return (
    <>
      <nav className="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobil alt menü">
        {PRIMARY_MOBILE_TABS.map((tabId) => {
          const item = TABS.find((t) => t.id === tabId)!;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              type="button"
              className={tab === item.id ? "mobile-tab active" : "mobile-tab"}
              onClick={() => {
                setTab(item.id);
                setShowMoreMenu(false);
              }}
              aria-label={item.label}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          id="tab-more"
          type="button"
          className={isMoreActive ? "mobile-tab active" : "mobile-tab"}
          onClick={() => setShowMoreMenu((prev) => !prev)}
          aria-label="Diğer sekmeler"
          aria-expanded={showMoreMenu}
        >
          <MoreHorizontal size={19} />
          <span>{activeMoreTab ? activeMoreTab.label : "Daha"}</span>
        </button>
      </nav>

      {showMoreMenu && (
        <div
          className="mobile-more-backdrop"
          id="more-backdrop"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="mobile-more-sheet"
            id="more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-more-header">
              <span>KEŞİF KANALLARI</span>
              <button
                id="btn-close-sheet"
                type="button"
                className="mobile-more-close"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mobile-more-grid">
              {MORE_MOBILE_TABS.map((tabId) => {
                const item = TABS.find((t) => t.id === tabId)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={tab === item.id ? "mobile-more-card active" : "mobile-more-card"}
                    onClick={() => {
                      setTab(item.id);
                      setShowMoreMenu(false);
                    }}
                  >
                    <item.icon size={20} />
                    <div className="mobile-more-card-text">
                      <strong>{item.label}</strong>
                      <small>{COPY[item.id].subtitle}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
