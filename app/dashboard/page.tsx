import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MusicDashboard from "@/components/music/music-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <MusicDashboard
      userId={user.id}
      displayName={user.user_metadata.full_name || user.user_metadata.name || user.email || "VYBE"}
    />
  );
}
