import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export function istanbulDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export async function guardMusic() {
  let supabase: SupabaseClient | null = null;
  let user: User | null = null;
  try {
    const session = await requireUser();
    supabase = session.supabase;
    user = session.user;
  } catch {
    return { supabase: null, user: null, denied: NextResponse.json({ error: "Supabase ayarı eksik." }, { status: 503 }) };
  }
  if (!user || !supabase) {
    return { supabase, user: null, denied: NextResponse.json({ error: "Giriş gerekli." }, { status: 401 }) };
  }
  if (process.env.VYBE_ACCESS_ENABLED !== "true") {
    return { supabase, user: null, denied: NextResponse.json({ error: "Özel beta kapalı." }, { status: 403 }) };
  }
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return { supabase, user: null, denied: NextResponse.json({ error: "Erişim yok." }, { status: 403 }) };
  }
  const { data, error } = await supabase.from("allowed_users").select("email").eq("email", email).eq("is_active", true).maybeSingle();
  if (error || !data) {
    return { supabase, user: null, denied: NextResponse.json({ error: "Bu hesap özel betada değil." }, { status: 403 }) };
  }
  return { supabase, user, denied: null };
}
