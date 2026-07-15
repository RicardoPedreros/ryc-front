"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/presentation/hooks/useAuth";
import { LoginForm } from "@/presentation/components/auth/LoginForm";

export function LoginPageClient() {
  const { login, loading: sessionLoading } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/market";

  if (sessionLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-loading">Cargando…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            RYC
          </Link>
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">
            Accedé a la gestión de tu hogar
          </p>
        </div>

        <LoginForm onLogin={login} redirectTo={from} />

        <div className="auth-footer">
          <Link href="/" className="auth-back">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
