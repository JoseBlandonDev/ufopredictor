"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { buildAppUrl } from "@/lib/auth/app-url";
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

const resendConfirmationSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

const continueAfterConfirmationSchema = z.object({
  next: z.string().optional(),
});

function buildRedirect(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `${path}?${searchParams.toString()}`;
}

function buildAuthConfirmUrl(nextPath: string) {
  const confirmUrl = buildAppUrl("/auth/confirm");
  confirmUrl.searchParams.set("next", nextPath);

  return confirmUrl.toString();
}

function buildCheckEmailRedirect(nextPath: string, message?: string, email?: string) {
  const params: Record<string, string> = { next: nextPath };

  if (message) {
    params.message = message;
  }

  if (email) {
    params.email = email;
  }

  return buildRedirect("/auth/check-email", params);
}

function getLoginErrorMessage(error: { code?: string; message?: string }) {
  const normalizedError = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (normalizedError.includes("email_not_confirmed") || normalizedError.includes("email not confirmed")) {
    return "Tu correo aun no esta confirmado. Revisa tu email o reenvia la confirmacion.";
  }

  return "No pudimos iniciar sesion. Revisa tus datos. Si te registraste con email y contrasena, confirma tu correo primero.";
}

export async function loginAction(formData: FormData) {
  const input = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!input.success) {
    redirect(buildRedirect("/login", { error: "Ingresa un correo y una contrasena validos." }));
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
        error: getLoginErrorMessage(error),
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
        error: "Completa tus datos y usa una contrasena de minimo 8 caracteres.",
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
      emailRedirectTo: buildAuthConfirmUrl(nextPath),
    },
  });

  if (error) {
    redirect(
      buildRedirect("/register", {
        error: "No pudimos crear la cuenta. Verifica los datos o intenta mas tarde.",
        next: nextPath,
      }),
    );
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(buildCheckEmailRedirect(nextPath, undefined, input.data.email));
}

export async function resendConfirmationAction(formData: FormData) {
  const input = resendConfirmationSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  const nextPath = getSafeRedirectPath(input.success ? input.data.next : undefined);

  if (!input.success) {
    redirect(buildCheckEmailRedirect(nextPath, "Ingresa un correo valido para reenviar la confirmacion."));
  }

  const supabase = await createSupabaseServerClient();

  await supabase.auth.resend({
    type: "signup",
    email: input.data.email,
    options: {
      emailRedirectTo: buildAuthConfirmUrl(nextPath),
    },
  });

  redirect(
    buildCheckEmailRedirect(
      nextPath,
      "Si el correo corresponde a una cuenta pendiente, enviaremos una nueva confirmacion.",
      input.data.email,
    ),
  );
}

export async function continueAfterConfirmationAction(formData: FormData) {
  const input = continueAfterConfirmationSchema.safeParse({
    next: formData.get("next") ?? undefined,
  });
  const nextPath = getSafeRedirectPath(input.success ? input.data.next : undefined);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (!error && data.user) {
    redirect(nextPath);
  }

  redirect(
    buildRedirect("/login", {
      message: "Tu correo ya puede estar confirmado. Inicia sesion para continuar.",
      next: nextPath,
    }),
  );
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect(buildRedirect("/login", { message: "Sesion cerrada correctamente." }));
}
