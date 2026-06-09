import Link from "next/link";
import Image from "next/image";
import { BarChart3, Gauge, LayoutDashboard, LogIn, RadioTower } from "lucide-react";

const navItems = [
  { href: "/predictions", label: "Predicciones", icon: Gauge },
  { href: "/pricing", label: "Planes", icon: RadioTower },
  { href: "/transparency", label: "Transparencia", icon: BarChart3 },
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
];

export function Navbar() {
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
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            <LogIn className="h-3.5 w-3.5" />
            Ingresar
          </Link>
          <Link
            href="/admin/real-fixture-lab"
            className="hidden rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 sm:block"
          >
            Real Fixture Lab
          </Link>
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
