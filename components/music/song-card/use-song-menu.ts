"use client";

import { useEffect, useId, useRef, useState } from "react";

const MENU_OPEN_EVENT = "vybe:song-menu-open";

export function useSongMenu(menuOpen: boolean, setMenuOpen: (open: boolean) => void) {
  const menuId = useId();
  const [openUpward, setOpenUpward] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Aynı anda yalnızca tek bir şarkı kartının menüsü açık olabilir
  useEffect(() => {
    const handleOtherMenuOpen = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail !== menuId) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(MENU_OPEN_EVENT, handleOtherMenuOpen);
    return () => {
      window.removeEventListener(MENU_OPEN_EVENT, handleOtherMenuOpen);
    };
  }, [menuId, setMenuOpen]);

  // Dışarı tıklama, Escape tuşu ve yön tuşlarıyla menü kontrolü
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuWrapRef.current && target && !menuWrapRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const items = menuRef.current
          ? Array.from(
              menuRef.current.querySelectorAll<HTMLButtonElement>(
                'button[role="menuitem"]:not([disabled])'
              )
            )
          : [];
        if (!items.length) return;
        event.preventDefault();
        const activeEl = document.activeElement as HTMLButtonElement | null;
        const currentIdx = items.indexOf(activeEl!);
        if (event.key === "ArrowDown") {
          const nextIdx = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
          items[nextIdx]?.focus();
        } else {
          const prevIdx = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
          items[prevIdx]?.focus();
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, setMenuOpen]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    if (triggerRef.current && typeof window !== "undefined") {
      const rect = triggerRef.current.getBoundingClientRect();
      const bottomReserved = window.innerWidth <= 768 ? 148 : 96;
      const spaceBelow = window.innerHeight - rect.bottom - bottomReserved;
      setOpenUpward(spaceBelow < 210 && rect.top > 220);
    }

    window.dispatchEvent(new CustomEvent<string>(MENU_OPEN_EVENT, { detail: menuId }));
    setMenuOpen(true);
  };

  return {
    openUpward,
    menuWrapRef,
    triggerRef,
    menuRef,
    toggleMenu,
  };
}
