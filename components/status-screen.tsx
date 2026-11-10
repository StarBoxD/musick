import Link from "next/link";
import type { ReactNode } from "react";
import { AudioLines } from "lucide-react";

type StatusScreenProps = {
  eyebrow: string;
  title: string;
  message: string;
  children?: ReactNode;
};

export default function StatusScreen({ eyebrow, title, message, children }: StatusScreenProps) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark"><AudioLines size={21} /></span> VYBE<span className="lime">.</span>
        </Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="status-title">{title}</h1>
        <p>{message}</p>
        {children}
      </section>
    </main>
  );
}
