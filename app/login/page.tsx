import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/app/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/paths";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ? getSafeRedirectPath(params.next) : undefined;

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,215,255,0.12),transparent_42%)]" />
      <AuthCard
        mode="login"
        action={loginAction}
        nextPath={nextPath}
        error={params.error}
        message={params.message}
      />
    </div>
  );
}
