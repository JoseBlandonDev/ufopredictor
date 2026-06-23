"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronDown, Gauge, LayoutDashboard, LogIn, RadioTower, UserPlus } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const navItems = [
  { href: "/predictions", label: "Predicciones", icon: Gauge },
  { href: "/pricing", label: "Pase Mundial", icon: RadioTower },
  { href: "/transparency", label: "Transparencia", icon: BarChart3 },
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
];

const adminOpsItems = [
  { href: "/admin/payments", label: "Pagos" },
  { href: "/admin/prediction-refresh-review", label: "Revisión de predicciones" },
  { href: "/admin/real-fixture-lab", label: "Laboratorio de partidos" },
  { href: "/admin/real-fixture-result-review-queue", label: "Revisión de resultados" },
  { href: "/admin/real-fixture-evaluation-queue", label: "Evaluación" },
  { href: "/admin/real-fixture-publish-queue", label: "Cola de publicación" },
  { href: "/admin/torneo-export", label: "Torneo Export" },
];

function navItemClass(isActive: boolean) {
  return isActive
    ? "flex items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-sm text-white"
    : "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white";
}

export function NavbarClient(props: { isAuthenticated: boolean; isAdmin: boolean }) {
  const pathname = usePathname();

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
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href} className={navItemClass(Boolean(isActive))}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {props.isAuthenticated ? (
            <>
              {props.isAdmin ? (
                <details className="relative hidden sm:block">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10">
                    Ops
                    <ChevronDown className="h-3.5 w-3.5" />
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-[#08121f]/98 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <div className="border-b border-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Operaciones
                    </div>
                    <div className="p-2">
                      {adminOpsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/register" className="ufo-btn-primary ufo-focus-ring hidden sm:inline-flex">
                <UserPlus className="h-4 w-4" />
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-3 py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                Ingresar
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {!props.isAuthenticated ? (
          <Link href="/register" className="ufo-btn-primary ufo-focus-ring shrink-0">
            Crear cuenta
          </Link>
        ) : null}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`${navItemClass(Boolean(isActive))} shrink-0`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
