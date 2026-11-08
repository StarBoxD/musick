import type { Song } from "@/types/music";

export async function searchMusic(query: string) {
  const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Müzikler şu anda yüklenemedi.");
  return {
    songs: (data.results ?? []) as Song[],
    exhausted: Boolean(data.exhausted),
    note: typeof data.note === "string" ? data.note : "",
  };
}

export async function postMusic(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "İstek tamamlanamadı.");
  return data;
}
