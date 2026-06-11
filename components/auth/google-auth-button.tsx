import { LogIn } from "lucide-react";
import { signInWithGoogleAction } from "@/app/auth/actions";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  return (
    <form action={signInWithGoogleAction}>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <button
        type="submit"
        className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Continuar con Google
      </button>
    </form>
  );
}
