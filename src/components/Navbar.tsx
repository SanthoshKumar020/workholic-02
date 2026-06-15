import { createClient } from "@/lib/supabase/server";
import { NavbarShell } from "@/components/NavbarShell";

export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarShell isLoggedIn={!!user} />;
}
