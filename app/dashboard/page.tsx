import Link from "next/link";
import { redirect } from "next/navigation";
import { AudioLines, LogOut, Music2, Heart, ListMusic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="dashboard-page">
    <header className="dashboard-nav">
      <Link href="/" className="brand"><span className="brand-mark"><AudioLines size={20}/></span> VYBE<span className="lime">.</span></Link>
      <div className="user-chip"><span>{user.user_metadata.full_name || user.email}</span><SignOutButton/></div>
    </header>
    <section className="dashboard-welcome">
      <span className="eyebrow">YOUR PERSONAL SOUNDSPACE</span>
      <h1>Hoş geldin,<br/><em>{user.user_metadata.full_name?.split(" ")[0] || "VYBE kullanıcısı"}.</em></h1>
      <p>VYBE hesabın hazır. Kişisel müzik alanını burada büyüteceğiz.</p>
      <div className="dashboard-cards">
        <article><Heart/><b>Favorilerin</b><small>Sevdiğin parçalar burada görünecek.</small></article>
        <article><ListMusic/><b>Playlistlerin</b><small>Kendi listelerini oluşturabileceksin.</small></article>
        <article><Music2/><b>Keşfet</b><small>Yeni müzikler çok yakında.</small></article>
      </div>
      <Link href="/" className="btn-primary">Ana sayfaya dön</Link>
    </section>
    <footer>VYBE<span className="lime">.</span> <span>YOUR SOUND. YOUR SPACE.</span></footer>
  </main>;
}
