import Link from "next/link";
import { LogIn } from "lucide-react";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  const href = nextPath ? `/auth/google?next=${encodeURIComponent(nextPath)}` : "/auth/google";

  return (
    <Link
      href={href}
      className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Continuar con Google
    </Link>
  );
}
