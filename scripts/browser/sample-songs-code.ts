export const SAMPLE_SONGS_CODE = `
  const makeArtwork = (c1, c2, accent, title, sub) =>
    \`data:image/svg+xml;utf8,\${encodeURIComponent(
      \`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="\${c1}"/>
            <stop offset="100%" stop-color="\${c2}"/>
          </linearGradient>
          <radialGradient id="glow" cx="75%" cy="25%" r="60%">
            <stop offset="0%" stop-color="\${accent}" stop-opacity="0.38"/>
            <stop offset="100%" stop-color="\${c2}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="480" height="480" fill="url(#bg)"/>
        <rect width="480" height="480" fill="url(#glow)"/>
        <circle cx="240" cy="210" r="128" fill="rgba(9,9,13,0.34)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
        <circle cx="240" cy="210" r="88" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        <circle cx="240" cy="210" r="42" fill="\${accent}" fill-opacity="0.85"/>
        <circle cx="240" cy="210" r="12" fill="#09090d"/>
        <text x="36" y="404" fill="#f5f5f7" font-family="sans-serif" font-weight="800" font-size="34" letter-spacing="-0.8">\${title}</text>
        <text x="36" y="438" fill="rgba(245,245,247,0.68)" font-family="monospace" font-weight="600" font-size="18" letter-spacing="2">\${sub}</text>
      </svg>\`
    )}\`;

  const SAMPLE_SONGS = [
    {
      trackId: "trk-1",
      title: "Bir Derdim Var (Canlı Stüdyo Kaydı - 2026 Remastered Özel Versiyon)",
      artist: "Mor ve Ötesi feat. Şebnem Ferah & Teoman",
      album: "Dünya Yalan Söylüyor",
      artwork: makeArtwork("#1e2547", "#0d101d", "#d2ff5a", "MOR VE ÖTESİ", "DÜNYA YALAN SÖYLÜYOR"),
      streamUrl: "https://api.audius.co/v1/tracks/trk-1/stream?app_name=VYBE",
      durationSeconds: 214,
      genre: "Alternatif Rock",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
    {
      trackId: "trk-2",
      title: "Antidepresan",
      artist: "Mert Demir & Mabel Matiz",
      album: "Antidepresan",
      artwork: makeArtwork("#361d47", "#120d1a", "#ff7eb6", "ANTİDEPRESAN", "MERT DEMİR • MABEL MATİZ"),
      streamUrl: "https://api.audius.co/v1/tracks/trk-2/stream?app_name=VYBE",
      durationSeconds: 198,
      genre: "Türkçe Pop",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
    {
      trackId: "trk-3",
      title: "Haberin Yok Ölüyorum",
      artist: "Duman",
      album: "Belki Alışman Lazım",
      artwork: makeArtwork("#1b333b", "#0d1518", "#5ce1e6", "DUMAN", "BELKİ ALIŞMAN LAZIM"),
      streamUrl: "https://api.audius.co/v1/tracks/trk-3/stream?app_name=VYBE",
      durationSeconds: 242,
      genre: "Rock",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
    {
      trackId: "trk-4",
      title: "Gülpembe (Anadolu Rock Klasikleri Koleksiyonu)",
      artist: "Barış Manço & Kurtalan Ekspres",
      album: "Sözüm Meclisten Dışarı",
      artwork: makeArtwork("#1f3a2c", "#0f1713", "#d2ff5a", "BARIŞ MANÇO", "KURTALAN EKSPRES"),
      streamUrl: "https://api.audius.co/v1/tracks/trk-4/stream?app_name=VYBE",
      durationSeconds: 265,
      genre: "Anadolu Rock",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
    {
      trackId: "trk-5",
      title: "Fırtınadayım",
      artist: "Mabel Matiz",
      album: "Maya",
      artwork: makeArtwork("#42202c", "#160e12", "#ffb86c", "FIRTINADAYIM", "MABEL MATİZ • MAYA"),
      streamUrl: "https://api.audius.co/v1/tracks/trk-5/stream?app_name=VYBE",
      durationSeconds: 208,
      genre: "Indie Pop",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
    {
      trackId: "trk-6",
      title: "Yalnızlık Senfonisi",
      artist: "Sezen Aksu",
      album: "Gülümse",
      artwork: "",
      streamUrl: "https://api.audius.co/v1/tracks/trk-6/stream?app_name=VYBE",
      durationSeconds: 251,
      genre: "Klasik Pop",
      sourceUrl: "",
      license: "All Rights Reserved",
      provider: "audius",
    },
  ];
`;
