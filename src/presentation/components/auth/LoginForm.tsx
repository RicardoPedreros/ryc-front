"use client";

import { useState, type FormEvent } from "react";

interface LoginFormProps {
  readonly onLogin: (
    username: string,
    password: string,
  ) => Promise<{ readonly ok: boolean; readonly error?: string }>;
  readonly redirectTo?: string;
}

export function LoginForm({ onLogin, redirectTo }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await onLogin(username, password);

    if (result.ok) {
      window.location.href = redirectTo || "/market";
    } else {
      setError(result.error || "Error al iniciar sesión");
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label className="auth-label" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          className="auth-input"
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          className="auth-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button
        className="auth-submit"
        type="submit"
        disabled={submitting || !username.trim() || !password}
      >
        {submitting ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
