"use client";

import { useState } from "react";
import { Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignIn() {
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
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Giriş başlatılamadı.");
      setLoading(false);
    }
  }

  return (
    <>
      <button className="google-button" onClick={signInWithGoogle} disabled={loading}>
        <Chrome size={18} />{loading ? "Google'a yönlendiriliyorsun..." : "Google ile devam et"}
      </button>
      <small className="legal-note">Yalnızca kayıtlı beta hesapları. Yeni kayıt açılmaz.</small>
      {error && <p className="error-message">{error}</p>}
    </>
  );
}
