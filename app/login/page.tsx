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
    <div className="flex min-h-[70vh] items-center justify-center py-8">
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
