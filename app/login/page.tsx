"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AudioLines, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GoogleSignIn from "@/components/auth/google-sign-in";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("access") === "denied") setMessage("Bu hesap beş kişilik özel betada değil. Hesap silinmedi.");
    else if (query.get("closed") === "1") setMessage("Erişim henüz açılmadı. Mevcut hesaplar duruyor.");
    else if (query.get("setup") === "1") setMessage("Supabase ayarı eksik.");
    else if (query.get("error")) setMessage("Giriş bağlantısı tamamlanamadı.");
  }, []);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Giriş bağlantısı gönderilemedi. Davet durumunu kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Ana sayfa</Link>
      <section className="auth-card">
        <Link href="/" className="brand auth-brand"><span className="brand-mark"><AudioLines size={21} /></span> VYBE<span className="lime">.</span></Link>
        <span className="eyebrow">PRIVATE LISTENING SPACE</span>
        <h1>İçeri<br /><em>gir.</em></h1>
        {sent ? (
          <div className="auth-success">
            <CheckCircle2 size={22} />
            <p>Bağlantı gönderildiyse e-postanı kontrol et. Yalnızca davetli hesaplar girer.</p>
          </div>
        ) : (
          <>
            <p>Kayıtlı beta hesabın varsa Google ile gir. İstersen davetli e-postana bağlantı da gönderilir.</p>
            <GoogleSignIn />
            <form className="magic-link-form" onSubmit={sendMagicLink}>
              <label htmlFor="vybe-email">E-POSTA ADRESİ</label>
              <div className="magic-email-field">
                <Mail size={17} />
                <input id="vybe-email" type="email" autoComplete="email" placeholder="ornek@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <button type="submit" disabled={loading || !email.trim()}>
                {loading ? <Loader2 size={17} className="spin" /> : null}
                {loading ? "Gönderiliyor..." : "Giriş bağlantısı gönder"}
              </button>
            </form>
          </>
        )}
        {message ? <p className="auth-error" role="alert">{message}</p> : null}
        <small className="legal-note">Yeni hesap açılmaz. Yalnızca önceden davet edilmiş e-postalar giriş yapabilir.</small>
      </section>
      <div className="auth-decoration">VYBE / PRIVATE BETA</div>
    </main>
  );
}
