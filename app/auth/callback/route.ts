import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/login?error=auth_callback", origin));

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL("/login?error=auth_callback", origin));

  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (!email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?access=denied", origin));
  }

  const { data, error } = await supabase.from("allowed_users").select("email").eq("email", email).eq("is_active", true).maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?access=denied", origin));
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, origin));
}
