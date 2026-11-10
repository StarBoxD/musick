import Link from "next/link";
import StatusScreen from "@/components/status-screen";

export default function NotFound() {
  return (
    <StatusScreen eyebrow="404" title="Sayfa bulunamadı." message="Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.">
      <div className="status-actions">
        <Link className="btn-primary" href="/dashboard">Uygulamaya dön</Link>
        <Link className="btn-quiet" href="/">Ana sayfa</Link>
      </div>
    </StatusScreen>
  );
}
