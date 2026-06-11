"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeRedirectPath } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(8),
});

function buildRedirect(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `${path}?${searchParams.toString()}`;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function buildAuthCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", getAppUrl());
  callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl.toString();
}

export async function loginAction(formData: FormData) {
  const input = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!input.success) {
    redirect(buildRedirect("/login", { error: "Ingresa un correo y una contraseña válidos." }));
  }

  const nextPath = getSafeRedirectPath(input.data.next);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.data.email,
    password: input.data.password,
  });

  if (error) {
    redirect(
      buildRedirect("/login", {
        error: "No pudimos iniciar sesión. Revisa tu correo y contraseña.",
        next: nextPath,
      }),
    );
  }

  redirect(nextPath);
}

export async function registerAction(formData: FormData) {
  const input = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!input.success) {
    redirect(
      buildRedirect("/register", {
        error: "Completa tus datos y usa una contraseña de mínimo 8 caracteres.",
      }),
    );
  }

  const nextPath = getSafeRedirectPath(input.data.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: {
      data: {
        full_name: input.data.fullName,
      },
      emailRedirectTo: buildAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    redirect(
      buildRedirect("/register", {
        error: "No pudimos crear la cuenta. Verifica los datos o intenta más tarde.",
        next: nextPath,
      }),
    );
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(
    buildRedirect("/login", {
      message: "Cuenta creada. Revisa tu correo para confirmar el acceso.",
      next: nextPath,
    }),
  );
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect(buildRedirect("/login", { message: "Sesión cerrada correctamente." }));
}
