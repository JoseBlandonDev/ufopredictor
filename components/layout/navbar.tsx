import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);

  return <NavbarClient isAuthenticated={Boolean(user)} isAdmin={profile?.role === "admin"} />;
}
