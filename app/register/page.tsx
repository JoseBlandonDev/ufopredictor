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
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <AuthCard mode="register" action={registerAction} nextPath={nextPath} error={params.error} />
    </div>
  );
}
