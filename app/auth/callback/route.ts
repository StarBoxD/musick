import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // OAuth providers may return an error instead of an authorization code.
  // Never display the raw provider description because it can contain details
  // that should remain in server logs.
  if (searchParams.get("error")) {
    const desc = searchParams.get("error_description") ?? "";
    if (/izin listesinde de[gğ]il|Database error saving new user/i.test(desc)) {
      return NextResponse.redirect(new URL("/login?access=denied", origin));
    }
    return NextResponse.redirect(new URL("/login?error=provider", origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.redirect(new URL("/login?setup=1", origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("[auth/callback] Code exchange failed:", exchangeError.message);
    return NextResponse.redirect(new URL("/login?error=exchange", origin));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=exchange", origin));
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?access=denied", origin));
  }

  const { data, error } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  // A missing table / SQL / RLS configuration is not the same as an
  // uninvited user. Keep those two cases distinguishable for troubleshooting.
  if (error) {
    console.error("[auth/callback] Allowlist lookup failed:", error.code, error.message);
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=allowlist_setup", origin));
  }
  if (!data) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?access=denied", origin));
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, origin));
}
