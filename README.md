# VYBE Cloud starter

Next.js 15 + TypeScript + Supabase Auth (Google OAuth) starter, designed for `vybe.izgura.com`.

## 1. Install and run
```bash
npm install
cp .env.example .env.local
npm run dev
```
Fill `.env.local` with the Supabase project URL and anon/publishable key. Never put a service-role key in a `NEXT_PUBLIC_` variable or commit secrets.

## 2. Create Supabase project
Create a project in Supabase. In Project Settings > API, copy the Project URL and anon/publishable key into `.env.local`.

In SQL Editor, run `supabase/schema.sql`.

## 3. Enable Google sign-in
In Supabase Authentication > Providers > Google, enable Google and enter the OAuth Client ID and Client Secret from Google Cloud Console.
In Google Cloud Console, create an OAuth client of type Web application. Add the Supabase callback URL shown in the Supabase Google provider settings as an Authorized redirect URI.
In Supabase Authentication > URL Configuration:
- Site URL: `https://vybe.izgura.com`
- Redirect URLs: `http://localhost:3000/auth/callback` and `https://vybe.izgura.com/auth/callback`

The Google OAuth consent screen / app branding should identify VYBE. Use an email you control as the project owner; do not share Google passwords or OAuth secrets.

## 4. Deploy to Vercel
Import this project into a GitHub repository, then import that repository into Vercel.
Add these environment variables in Vercel Project Settings > Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Deploy once using the generated Vercel URL. Then add `vybe.izgura.com` in Vercel Project > Settings > Domains. Vercel will show the exact DNS record(s) to add.

## 5. GoDaddy DNS
In GoDaddy > Domain Portfolio > izgura.com > DNS, add only the record Vercel tells you to add for `vybe`.
Usually this is a CNAME with Host `vybe` and a Vercel-provided target. Do not delete or change existing `@`, `www`, MX, TXT, or other records. DNS instructions can vary, so follow the exact values displayed by Vercel.
After DNS verifies, set the canonical URL / Supabase Site URL to `https://vybe.izgura.com`.

## Current scope
- Public landing page
- Separate VYBE login using Google OAuth
- Protected dashboard route
- Supabase session cookies and middleware refresh
- Profile table with row-level security

This is the secure foundation, not yet the full cloud music product. Next phase: persist playlists/favorites in Supabase with per-user RLS, then connect the discovery player. The current sign-in screen is Google-only; add email/password or magic-link flows if desired.

## VYBE music workspace setup

The dashboard now uses the public iTunes Search API through `/api/music/search`.
It plays only the preview clips supplied by iTunes; a preview may be unavailable
for some tracks and is not a full-track streaming subscription.

### One-time Supabase setup
Run the complete `supabase/schema.sql` file in Supabase SQL Editor. It keeps the
existing `profiles` table and adds `favorites`, `playlists`, and `playlist_tracks`
with row-level security. No service-role key is needed in the browser.

After the SQL succeeds, deploy the project again on Vercel. Existing Supabase
and Google OAuth environment variables remain unchanged.
