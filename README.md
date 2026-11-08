# VYBE Cloud starter

Next.js 15 + TypeScript + Supabase Auth (Google OAuth) starter, designed for `vybe.izgura.com`.

## 1. Install and run
```bash
npm install
cp .env.example .env.local
npm run dev
```
Fill `.env.local` with the Supabase project URL and anon/publishable key. Never put a service-role key in a `NEXT_PUBLIC_` variable or commit secrets.

## 2. Create Supabase project and apply the database
Create a project in Supabase. In Project Settings > API, copy the Project URL and anon/publishable key into `.env.local`.

In Supabase SQL Editor, run these files in this order:
1. `supabase/schema.sql`
2. `supabase/migrations/20261108_music_features.sql`
3. `supabase/migrations/20261108_private_audius_beta.sql`
4. `supabase/migrations/20261109_discovery.sql`

**Do not stop after `supabase/schema.sql`.** The base schema does not create `public.allowed_users`, but the Google callback, middleware, dashboard, and music API guards all rely on that table. The private-beta migration creates it, its row-level security policy, and the five-active-account limit. The root-level `SUPABASE_SCHEMA.sql` is only a copy of the base schema; it is not a replacement for the migrations.

Before the first Google login, add the exact Google account email to the allowlist from the Supabase SQL Editor. For example:
```sql
insert into public.allowed_users (email)
values (lower('you@example.com'))
on conflict (email) do update set is_active = true;
```
Replace the example with the real account email. The private beta permits at most five active emails. A Google account that is not listed is intentionally rejected, even when Google authentication itself succeeds.

## 3. Enable Google sign-in
1. In Google Cloud Console, create an OAuth client with application type **Web application**.
2. In Supabase > Authentication > Providers > Google, enable Google and paste the Google OAuth Client ID and Client Secret.
3. In the same Supabase Google provider settings, copy the displayed **Callback URL**. Add that exact URL to Google Cloud Console under **Authorized redirect URIs**. It normally looks like `https://<project-ref>.supabase.co/auth/v1/callback`. This is Google's redirect URI; it is **not** your Next.js `/auth/callback` route.
4. In Supabase > Authentication > URL Configuration, set:
   - Site URL: `https://vybe.izgura.com`
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://vybe.izgura.com/auth/callback`
5. If using a Vercel preview URL or another domain, add its exact `/auth/callback` URL to Supabase's Redirect URLs too.

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
