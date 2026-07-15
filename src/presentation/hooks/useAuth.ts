"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  readonly id: string;
  readonly username: string;
  readonly roleCode: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

interface UseAuthResult {
  readonly user: SessionUser | null;
  readonly loading: boolean;
  readonly login: (
    username: string,
    password: string,
  ) => Promise<{ readonly ok: boolean; readonly error?: string }>;
  readonly logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data as SessionUser | null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<{ readonly ok: boolean; readonly error?: string }> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error: string };
          return { ok: false, error: data.error };
        }

        const data = (await response.json()) as SessionUser;
        setUser(data);
        return { ok: true };
      } catch {
        return { ok: false, error: "Error de conexión" };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
