import { registerAction } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { getSafeRedirectPath } from "@/lib/auth/paths";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = params.next ? getSafeRedirectPath(params.next) : undefined;

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,215,255,0.12),transparent_42%)]" />
      <AuthCard mode="register" action={registerAction} nextPath={nextPath} error={params.error} />
    </div>
  );
}
