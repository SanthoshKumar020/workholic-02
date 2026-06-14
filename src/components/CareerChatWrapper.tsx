import { createClient } from "@/lib/supabase/server";
import { CareerChat } from "@/components/CareerChat";

export async function CareerChatWrapper() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    return <CareerChat isPro={profile?.plan === "pro"} />;
  } catch {
    return null;
  }
}
