"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusScreen from "@/components/status-screen";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[VYBE] Sayfa hatası:", error.digest ?? error.message);
  }, [error]);

  return (
    <StatusScreen eyebrow="BİR ŞEYLER TERS GİTTİ" title="Bu ekran yüklenemedi." message="Bağlantı kopmuş ya da beklenmedik bir hata oluşmuş olabilir. Tekrar denemek genelde düzeltir.">
      <div className="status-actions">
        <button type="button" className="btn-primary" onClick={reset}>Tekrar dene</button>
        <Link className="btn-quiet" href="/">Ana sayfa</Link>
      </div>
    </StatusScreen>
  );
}
