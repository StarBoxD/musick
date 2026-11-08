import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "Arama terimi gerekli." }, { status: 400 });

  try {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", query);
    url.searchParams.set("entity", "song");
    url.searchParams.set("limit", "24");
    url.searchParams.set("country", "tr");

    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("iTunes yanıt vermedi.");
    const data = await response.json();
    return NextResponse.json(data.results ?? []);
  } catch {
    return NextResponse.json({ error: "Müzik servisine ulaşılamadı." }, { status: 502 });
  }
}
