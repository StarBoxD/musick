export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood: string;
  videoId: string;
  color: string;
};

export const songs: Song[] = [
  { id: "s1", title: "Kuzu Kuzu", artist: "Tarkan", album: "Karma", genre: "Pop", mood: "Enerjik", videoId: "NAHRpEqgcL4", color: "coral" },
  { id: "s2", title: "Bir Derdim Var", artist: "Mor ve Ötesi", album: "Dünya Yalan Söylüyor", genre: "Rock", mood: "Alternatif", videoId: "7RW8n4iXZbA", color: "blue" },
  { id: "s3", title: "Antidepresan", artist: "Mert Demir, Mabel Matiz", album: "Antidepresan", genre: "Pop", mood: "Gece", videoId: "i6CSvLvSNZ4", color: "purple" },
  { id: "s4", title: "Senden Daha Güzel", artist: "Duman", album: "Belki Alışman Lazım", genre: "Rock", mood: "Enerjik", videoId: "3bfkyXtuIXk", color: "orange" },
  { id: "s5", title: "Gülümse", artist: "Sezen Aksu", album: "Gülümse", genre: "Pop", mood: "Sakin", videoId: "qgfLk8Uksxo", color: "pink" },
  { id: "s6", title: "Dünyanın Sonuna Doğmuşum", artist: "maNga", album: "e-akustik", genre: "Rock", mood: "Alternatif", videoId: "pIVG3mDL9RI", color: "lime" },
  { id: "s7", title: "Pembe Mezarlık", artist: "Model", album: "Diğer Masallar", genre: "Alternative", mood: "Gece", videoId: "dQ7LJ9nYKU8", color: "rose" },
  { id: "s8", title: "Dönence", artist: "Barış Manço", album: "2023", genre: "Anadolu Rock", mood: "Sakin", videoId: "cvcF-0aDFM4", color: "gold" },
  { id: "s9", title: "Cambaz", artist: "Mor ve Ötesi", album: "Dünya Yalan Söylüyor", genre: "Rock", mood: "Enerjik", videoId: "Lw4unI3tVNQ", color: "cyan" },
  { id: "s10", title: "Şımarık", artist: "Tarkan", album: "Ölürüm Sana", genre: "Pop", mood: "Enerjik", videoId: "cpp69ghR1IM", color: "violet" },
  { id: "s11", title: "Paramparça", artist: "Teoman", album: "Onyedi", genre: "Rock", mood: "Gece", videoId: "lh4lMzVcM8A", color: "slate" },
  { id: "s12", title: "Ele Güne Karşı", artist: "MFÖ", album: "Ele Güne Karşı", genre: "Pop", mood: "Nostalji", videoId: "4DZbURvoDEc", color: "amber" }
];
