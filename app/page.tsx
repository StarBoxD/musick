import Link from "next/link";
import { AudioLines, ArrowUpRight, Headphones, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand"><span className="brand-mark"><AudioLines size={21}/></span> VYBE<span className="lime">.</span></Link>
        <nav><a href="#about">Hakkında</a><a href="#discover">Keşfet</a><Link className="nav-login" href="/login">Giriş yap <ArrowUpRight size={15}/></Link></nav>
      </header>
      <section className="landing-hero">
        <div className="hero-orb orb-a"/><div className="hero-orb orb-b"/>
        <div className="eyebrow"><span/> YOUR SOUND. YOUR SPACE.</div>
        <h1>Ruhunun<br/><em>sesini</em> bul.</h1>
        <p>Yeni sesler keşfet. Kendi listeni oluştur. Her ana kendi ritmini ver.</p>
        <div className="hero-buttons"><Link className="btn-primary" href="/login">VYBE'a katıl <ArrowUpRight size={17}/></Link><a className="btn-quiet" href="#discover">Keşfetmeye başla ↓</a></div>
        <div className="hero-record"><div className="record-inner"><AudioLines size={34}/></div></div>
        <div className="hero-foot">FIND YOUR FREQUENCY <span>01 — 03</span></div>
      </section>
      <section className="feature-strip" id="about">
        <div><Headphones/><b>Kendi müzik alanın</b><small>Favorilerin ve listelerin tek yerde.</small></div>
        <div><Sparkles/><b>Yeni sesler keşfet</b><small>Moduna göre yeni parçalar bul.</small></div>
        <div><AudioLines/><b>Her cihazda seninle</b><small>Hesabınla giriş yap, listelerine ulaş.</small></div>
      </section>
      <section className="landing-bottom" id="discover"><div><span className="eyebrow">VYBE COMMUNITY</span><h2>Ritmini bulmaya<br/>hazır mısın?</h2></div><Link className="round-link" href="/login"><ArrowUpRight/></Link></section>
      <footer>VYBE<span className="lime">.</span> <span>FIND YOUR FREQUENCY.</span></footer>
    </main>
  );
}
