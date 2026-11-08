import type { Song } from "@/types/music";

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  primaryGenreName?: string;
};

export async function searchMusic(query: string): Promise<Song[]> {
  const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Müzikler şu anda yüklenemedi.");
  const tracks = (await response.json()) as ITunesTrack[];
  return tracks.map((track) => ({
    trackId: track.trackId,
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName || "Tekli",
    artwork: track.artworkUrl100?.replace("100x100bb", "300x300bb") || "",
    previewUrl: track.previewUrl || null,
    genre: track.primaryGenreName || "Müzik",
  }));
}
