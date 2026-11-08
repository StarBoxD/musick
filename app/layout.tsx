import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYBE — Find your frequency",
  description: "Yeni sesler keşfet. Kendi ritmini bul.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
