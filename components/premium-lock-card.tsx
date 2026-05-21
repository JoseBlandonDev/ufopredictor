import { Lock } from "lucide-react";

export function PremiumLockCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel rounded-lg p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-md bg-[var(--accent)]/10 p-2 text-[var(--accent)]">
          <Lock className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
      </div>
    </div>
  );
}
