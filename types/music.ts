export type Song = {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  /** Audius full-track stream. Never an iTunes preview. */
  streamUrl: string;
  durationSeconds: number;
  genre: string;
  sourceUrl: string;
  license: string;
  provider: "audius";
};

export type Playlist = {
  id: string;
  name: string;
  created_at: string;
};

export type Mood = "Happy" | "Sad" | "Chill" | "Energetic" | "Romantic" | "Focus" | "Nostalgic" | "Dark";

export type SmartList = { name: string; songs: Song[] };

export type PlaybackSourceType =
  | "mood"
  | "search"
  | "playlist"
  | "smart"
  | "daily"
  | "match"
  | "gems"
  | "favorites"
  | "direct";

export interface PlaybackSource {
  type: PlaybackSourceType;
  mood?: Mood;
  query?: string;
  playlistId?: string;
  label?: string;
}
