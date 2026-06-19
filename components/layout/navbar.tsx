import Link from "next/link";
import Image from "next/image";
import { BarChart3, ChevronDown, Gauge, LayoutDashboard, LogIn, RadioTower } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

const navItems = [
  { href: "/predictions", label: "Predicciones", icon: Gauge },
  { href: "/pricing", label: "Planes", icon: RadioTower },
  { href: "/transparency", label: "Transparencia", icon: BarChart3 },
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
];

const adminOpsItems = [
  { href: "/admin/real-fixture-lab", label: "Real Fixture Lab" },
  { href: "/admin/real-fixture-result-review-queue", label: "Result Review" },
  { href: "/admin/real-fixture-evaluation-queue", label: "Evaluation" },
  { href: "/admin/real-fixture-publish-queue", label: "Publish Queue" },
  { href: "/admin/torneo-export", label: "Torneo Export" },
];

export async function Navbar() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#050b14]/88 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--accent)]/35 bg-[#050b14] shadow-[0_0_22px_rgba(0,215,255,0.2)]">
            <Image
              src="/brand/ufo-predictor-logo-main.png"
              alt="Logo de UFO Predictor"
              fill
              className="object-cover"
              sizes="44px"
              priority
            />
          </span>
          <span className="hidden text-sm font-semibold uppercase tracking-[0.2em] sm:inline">UFO Predictor</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <LogoutButton />
              {isAdmin ? (
                <details className="relative hidden sm:block">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10">
                    Ops
                    <ChevronDown className="h-3.5 w-3.5" />
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 overflow-hidden rounded-lg border border-[var(--accent)]/20 bg-[#08121f]/98 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <div className="border-b border-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Admin ops
                    </div>
                    <div className="p-2">
                      {adminOpsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-md px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
            >
              <LogIn className="h-3.5 w-3.5" />
              Ingresar
            </Link>
          )}
        </div>
      </nav>
      <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 rounded-md px-3 py-2 text-sm text-[var(--muted)]">
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
