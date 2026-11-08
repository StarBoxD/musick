import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MusicDashboard from "@/components/music/music-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email?.trim().toLowerCase();
  const { data, error } = email
    ? await supabase.from("allowed_users").select("email").eq("email", email).eq("is_active", true).maybeSingle()
    : { data: null, error: null };
  if (error || !data) redirect("/login?access=denied");

  return (
    <MusicDashboard
      userId={user.id}
      displayName={user.user_metadata.full_name || user.user_metadata.name || user.email || "VYBE"}
    />
  );
}
