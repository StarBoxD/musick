# VYBE — Cloud Music & Discovery Platform

Modern, premium ve kişisel müzik keşif stüdyosu.  
Altyapı: **Next.js 15 (App Router)**, **TypeScript**, **Supabase (Auth, RLS, PostgreSQL)** ve **Audius REST API v1**.  
Canlı Platform: [`https://vybe.izgura.com`](https://vybe.izgura.com)

---

## 1. Müzik ve Lisanslama Mimarisi

VYBE, müzik keşfi ve akışlarında **yalnızca resmi Audius REST API v1** altyapısını kullanır. iTunes veya diğer üçüncü taraf önizleme servisleri kullanılmamaktadır; tüm parçalar doğrudan sanatçı izinleri dahilinde tam parça olarak oynatılır.

### Lisans ve Erişim Filtre Motoru (`lib/music/license-filter.ts`)
Platform, **Güvenli Varsayılan (Safe Default / Fail-Closed)** prensibiyle çalışır:
- **Kesin Erişim Engelleri:** `is_streamable: false`, `is_available: false`, `is_delete: true` veya `is_stream_gated: true` (erişim izni yoksa) olan parçalar doğrudan elenir.
- **Sıkı Hostname Doğrulaması:** Yalnızca resmi `https://api.audius.co` veya doğrulanmış Audius CDN / Creator Node domainleri kabul edilir; `fakeaudius.co`, `audius.co.attacker.com` gibi sahte alan adları kesinlikle engellenir.
- **Doğrulanmış Lisanslar:** `All Rights Reserved`, `Creative Commons (CC BY, CC BY-NC...)`, `Public Domain / CC0` ve `Open Music License (OML)` orijinal etiketleriyle şeffafça sunulur.
- **Eksik Metadata Yönetimi (`LICENSE_UNVERIFIED`):** Sanatçı tarafından lisans alanı boş bırakılmış içerikler teknik akış izni varsa reddedilmez ancak asla lisanslı veya telifsiz olarak etiketlenmez; *"Lisans Belirtilmemiş (Doğrulanmamış)"* olarak şeffafça etiketlenir.

---

## 2. Kurulum ve Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini hazırla
cp .env.example .env.local

# Geliştirme sunucusunu başlat
npm run dev
```

### Test ve Doğrulama Komutları
```bash
# TypeScript tip kontrolü
npm run typecheck

# Tam QA doğrulama ve entegrasyon test paketi
npm test

# Production derleme
npm run build
```

---

## 3. Supabase Veritabanı ve Migration Sırası

Supabase SQL Editor'de aşağıdaki migration dosyaları **belirtilen sıra ile** çalıştırılmalıdır:

1. `supabase/schema.sql` — Temel kullanıcı profilleri ve veritabanı şeması.
2. `supabase/migrations/20261108_music_features.sql` — Kütüphane, çalma listeleri ve favori tabloları.
3. `supabase/migrations/20261108_private_audius_beta.sql` — Private beta `allowed_users` tablosu, 5 aktif kullanıcı sınırı ve Audius text ID dönüşümleri.
4. `supabase/migrations/20261109_discovery.sql` — Dinleme geçmişi (`seen_tracks`) ve günün parçası (`daily_vybes`) tabloları.
5. `supabase/migrations/20261110_api_role_grants.sql` — `authenticated` rolüne tüm 7 tablo için gerekli `SELECT, INSERT, UPDATE, DELETE` GRANT yetkileri.
6. `supabase/migrations/20261110_discovery_allowlist_hardening.sql` — `seen_tracks`, `daily_vybes` ve `claim_unseen_tracks` üzerinde allowlist (`allowed_users.is_active = true`) zorunluluğunu pekiştiren güvenlik güncellemesi.
7. `supabase/migrations/20261110_allowlist_rls_hardening.sql` — Tüm 7 tabloda (`allowed_users`, `profiles`, `favorites`, `playlists`, `playlist_tracks`, `seen_tracks`, `daily_vybes`) eski permissif politikaları tamamen temizleyen ve allowlist (`allowed_users.is_active = true`) ile `auth.uid() = user_id` şartını tavizsiz zorunlu kılan master RLS sertleştirmesi.

### İlk Giriş Öncesi Kullanıcı Yetkilendirmesi
Supabase SQL Editor üzerinden izin verilecek e-posta adresini ekleyin:
```sql
insert into public.allowed_users (email)
values (lower('kullanici@example.com'))
on conflict (email) do update set is_active = true;
```

---

## 4. Google OAuth Kurulumu

1. Google Cloud Console'da **Web application** türünde bir OAuth istemcisi oluşturun.
2. Yetkili JavaScript kaynakları: `http://localhost:3000` ve `https://vybe.izgura.com`.
3. Yetkili yönlendirme URI'si: `https://<supabase-project-id>.supabase.co/auth/v1/callback`.
4. Supabase > Authentication > Providers > Google bölümünde Client ID ve Secret değerlerini kaydedin.
5. Supabase > Authentication > URL Configuration alanında Site URL (`https://vybe.izgura.com`) ve Redirect URL (`https://vybe.izgura.com/auth/callback`) tanımlarını tamamlayın.
