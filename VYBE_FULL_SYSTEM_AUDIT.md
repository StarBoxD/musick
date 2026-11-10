# VYBE — Altyapı, Güvenlik ve Mimari Denetim Raporu

**Kapsam:** Veritabanı (Supabase Auth & RLS), Bulut Dağıtımı (Vercel), Kimlik Sağlayıcı (Google OAuth) ve Müzik Servisi (Audius REST API) uçtan uca mimari incelemesi.  
**Gizlilik Notu:** Bu belge genel açık depoda (public repository) yer aldığından tüm kişisel e-posta adresleri, kullanıcı UUID'leri ve hassas kimlik bilgileri anonimleştirilmiştir (redacted).

---

## 0. Özet: Kimlik Doğrulama ve İzin Mimarisi

Sistem denetiminde tespit edilen ve çözüme kavuşturulan temel güvenlik ve erişim gereksinimleri:

1. **`public.allowed_users` İzin Listesi:**
   - Private beta aşamasında yalnızca `allowed_users` tablosunda `is_active = true` olan hesapların sisteme kaydolmasına ve oturum açmasına izin verilmektedir.
   - İzin listesinde bulunmayan Google hesapları `vybe_reject_unlisted_signup` veritabanı trigger'ı tarafından engellenmektedir.
2. **Tablo Düzeyi Rol İzinleri (GRANT):**
   - Supabase üzerinde RLS (Row Level Security) öncesinde `authenticated` rolüne `SELECT, INSERT, UPDATE, DELETE` GRANT izinlerinin verilmesi gerekmektedir.
   - `allowed_users`, `profiles`, `favorites`, `playlists`, `playlist_tracks`, `seen_tracks` ve `daily_vybes` tablolarının tamamında yetkilendirmeler eksiksiz yapılandırılmıştır.
3. **Google Cloud OAuth İzin Kapsamı:**
   - Google Cloud Console üzerinde OAuth Onay Ekranı `Testing` modundayken test kullanıcılarının kayıtlı olması zorunludur.
4. **Hata Mesajı Yönetimi:**
   - Callback hattında erişim reddi durumları sağlayıcı hatalarından ayırt edilerek `/login?access=denied` parametresiyle kullanıcıya net bilgi verilmektedir.

---

## 1. Vercel Dağıtım ve Çalışma Zamanı Mimarisi

| Bölüm | Durum | Açıklama |
|---|---|---|
| **Domains** | ✅ Aktif | Özel alan adı ve Vercel CDN entegrasyonu |
| **Git Bağlantısı** | ✅ Aktif | `main` dalı üzerinden otomatik CI/CD dağıtımı |
| **Dağıtım Koruması** | ✅ Aktif | Production açık, preview ortamları korumalı |
| **Ortam Değişkenleri** | ✅ Tanımlı | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

---

## 2. Supabase Veritabanı, Tablolar ve RLS Mimarisi

| Tablo | RLS | Politika (Policy) Kapsamı | İzinli Rol |
|---|---|---|---|
| `public.allowed_users` | ✅ Açık | Kullanıcı yalnızca kendi allowlist durumunu okuyabilir | `authenticated` (SELECT) |
| `public.profiles` | ✅ Açık | Kullanıcı kendi profilini okur ve günceller | `authenticated` (ALL) |
| `public.favorites` | ✅ Açık | Kullanıcı yalnızca kendi favorilerini yönetir | `authenticated` (ALL) |
| `public.playlists` | ✅ Açık | Kullanıcı yalnızca kendi oluşturduğu listeleri yönetir | `authenticated` (ALL) |
| `public.playlist_tracks` | ✅ Açık | Kullanıcı yalnızca kendi listelerindeki parçaları yönetir | `authenticated` (ALL) |
| `public.seen_tracks` | ✅ Açık | Yalnızca aktif izinli kullanıcılar dinleme geçmişini yönetir | `authenticated` (ALL) |
| `public.daily_vybes` | ✅ Açık | Kullanıcı yalnızca kendi günün şarkısını yönetir | `authenticated` (ALL) |

### Veritabanı Trigger'ları:
- `vybe_reject_unlisted_signup` (`BEFORE INSERT ON auth.users`): İzinli olmayan yeni kayıtları engeller.
- `on_auth_user_created` (`AFTER INSERT ON auth.users`): Yeni kullanıcı için `public.profiles` satırını oluşturur.

---

## 3. Google Cloud OAuth Yapılandırması

| Parametre | Durum | Açıklama |
|---|---|---|
| **OAuth 2.0 Web Client** | ✅ Aktif | Web istemcisi tanımlı |
| **Yetkili JS Kaynakları** | ✅ Doğru | `http://localhost:3000`, `https://vybe.izgura.com` |
| **Yetkili Yönlendirme URI'leri** | ✅ Doğru | Supabase Auth Callback uç noktası |
| **Yayın Durumu** | ✅ Yapılandırıldı | Test kullanıcıları allowlist ile eşleştirildi |

---

## 4. API ve Harici Entegrasyonlar

1. **Supabase Auth (`/auth/v1/*`):** Oturum açma, token yenileme ve PKCE akışı.
2. **Audius REST API v1 (`https://api.audius.co/v1`):** Arama ve frekans filtreleri.
3. **Audius Stream CDN:** Resmi HTTPS akış yönlendirmesi.
4. **Dahili API'ler (`/api/music/*`):** `discover`, `daily`, `gems`, `match`, `search`, `smart`.

---

## 5. Güvenlik ve Gizlilik Doğrulaması

- Bu belgeden tüm gerçek e-posta adresleri, kullanıcı id'leri ve özel istemci sırları temizlenmiştir.
- Git geçmişinde yer alan önceki commit kayıtları için gerekirse `git filter-repo` veya repo temizleme araçları ile geçmiş commit ağacının temizlenmesi tavsiye edilir.
