import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <main className="route-loading" aria-busy="true" aria-live="polite">
      <Loader2 size={28} className="spin" />
      <span>VYBE hazırlanıyor…</span>
    </main>
  );
}
