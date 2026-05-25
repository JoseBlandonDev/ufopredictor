import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-md border border-[var(--accent)]/30 bg-[#0a1a2b]/70 px-3 py-2 text-sm text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </form>
  );
}
