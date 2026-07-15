import { Suspense } from "react";
import { LoginPageClient } from "@/presentation/components/auth/LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-loading">Cargando…</div>
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
