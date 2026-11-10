"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
    }

    const ua = window.navigator.userAgent || "";
    const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
    const isIPadOSDesktopMode = ua.includes("Macintosh") && (window.navigator.maxTouchPoints ?? 0) > 1;
    setIsIOS(isAppleMobile || isIPadOSDesktopMode);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferred(null);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed) {
    return null;
  }

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setDeferred(null);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        className={compact ? "install-btn-compact" : "install-btn"}
        onClick={() => void handleInstall()}
        title="Telefonuna veya bilgisayarına uygulama olarak indir"
      >
        <Download size={15} />
        <span>{compact ? "Uygulamayı İndir" : "Uygulamayı Ekrana Ekle"}</span>
      </button>

      {showGuide && (
        <div className="install-modal-backdrop" onClick={() => setShowGuide(false)}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <button className="install-modal-close" onClick={() => setShowGuide(false)} aria-label="Kapat">
              <X size={18} />
            </button>
            <div className="install-modal-icon">
              <Smartphone size={26} />
            </div>
            <h3>VYBE Uygulamasını Ekrana Al</h3>
            <p>Tarayıcı çubuğu olmadan tam ekran masaüstü ve telefon uygulaması olarak kullanabilirsin:</p>
            {isIOS ? (
              <ol className="install-steps">
                <li>Safari alt menüsündeki <b>Paylaş</b> <Share size={13} /> ikonuna dokun.</li>
                <li>Aşağı kaydırıp <b>&ldquo;Ana Ekrana Ekle&rdquo;</b> seçeneğine bas.</li>
                <li>Sağ üstten <b>Ekle</b> dediğinde VYBE telefonuna uygulama olarak iner!</li>
              </ol>
            ) : (
              <ol className="install-steps">
                <li>
                  <b>PC (Chrome / Edge):</b> Adres çubuğunun sağındaki <b>Yükle (İndir)</b> ikonuna veya sağ üstteki <b>⋮ &rarr; Kaydet ve paylaş &rarr; VYBE uygulamasını yükle</b> seçeneğine tıkla.
                </li>
                <li>
                  <b>Android (Chrome):</b> Sağ üstteki <b>⋮</b> menüsünden <b>&ldquo;Uygulamayı yükle&rdquo;</b> veya <b>&ldquo;Ana ekrana ekle&rdquo;</b> seçeneğine dokun.
                </li>
              </ol>
            )}
            <button type="button" className="action-btn next-btn" onClick={() => setShowGuide(false)}>
              Tamamdır
            </button>
          </div>
        </div>
      )}
    </>
  );
}
