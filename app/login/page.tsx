"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AudioLines, Clock3 } from "lucide-react";

export default function LoginPage() {
  const [note, setNote] = useState("Davetli erişim açılınca yalnızca listedeki hesaplar girecek.");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("access") === "denied") setNote("Bu hesap beş kişilik özel betada değil. Hesap silinmedi.");
    else if (query.get("closed") === "1") setNote("Erişim henüz açılmadı. Mevcut hesaplar duruyor.");
    else if (query.get("setup") === "1") setNote("Supabase ayarı eksik.");
    else if (query.get("error")) setNote("Giriş tamamlanamadı.");
  }, []);

  return (
    <main className="auth-page">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Ana sayfa</Link>
      <section className="auth-card">
        <Link href="/" className="brand auth-brand"><span className="brand-mark"><AudioLines size={21} /></span> VYBE<span className="lime">.</span></Link>
        <span className="eyebrow">PRIVATE LISTENING SPACE</span>
        <h1>Biraz<br /><em>sonra.</em></h1>
        <p>VYBE kapalı testte. Yeni kayıt yok. Google girişi arayüzden kaldırıldı; OAuth kodu duruyor.</p>
        <div className="coming-soon"><Clock3 size={17} /> YAKINDA</div>
        <small className="legal-note">{note}</small>
      </section>
      <div className="auth-decoration">VYBE / PRIVATE BETA</div>
    </main>
  );
}
