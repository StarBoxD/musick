export type Song = {
  trackId: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string | null;
  genre: string;
};

export type Playlist = {
  id: string;
  name: string;
  created_at: string;
};
