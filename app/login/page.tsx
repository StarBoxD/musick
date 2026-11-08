"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioLines, Chrome, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });
      if (authError) throw authError;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş başlatılamadı.");
      setLoading(false);
    }
  }

  return <main className="auth-page">
    <Link href="/" className="back-link"><ArrowLeft size={16}/> Ana sayfa</Link>
    <section className="auth-card">
      <Link href="/" className="brand auth-brand"><span className="brand-mark"><AudioLines size={21}/></span> VYBE<span className="lime">.</span></Link>
      <span className="eyebrow">WELCOME TO YOUR SOUNDSPACE</span>
      <h1>Ritmine<br/><em>giriş yap.</em></h1>
      <p>VYBE hesabınla favorilerine ve playlistlerine her yerden ulaş.</p>
      <button className="google-button" onClick={signInWithGoogle} disabled={loading}><Chrome size={18}/>{loading ? "Google'a yönlendiriliyorsun..." : "Google ile devam et"}</button>
      {error && <p className="error-message">{error}</p>}
      <small className="legal-note">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</small>
    </section>
    <div className="auth-decoration">VYBE / 001</div>
  </main>;
}
