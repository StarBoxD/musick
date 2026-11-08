import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (!url || !key) {
    if (isDashboard) return NextResponse.redirect(new URL("/login?setup=1", request.url));
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  if (!isDashboard) return response;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const email = user.email?.trim().toLowerCase();
  if (!email) return NextResponse.redirect(new URL("/login?access=denied", request.url));
  const { data, error } = await supabase.from("allowed_users").select("email").eq("email", email).eq("is_active", true).maybeSingle();
  if (error || !data) return NextResponse.redirect(new URL("/login?access=denied", request.url));
  return response;
}

export const config = { matcher: ["/dashboard/:path*"] };
