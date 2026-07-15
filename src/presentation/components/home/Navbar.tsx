"use client";

import Link from "next/link";
import { useTheme } from "@/presentation/hooks/useTheme";
import { useAuth } from "@/presentation/hooks/useAuth";

export function Navbar() {
  const { toggle } = useTheme();
  const { user, loading, logout } = useAuth();

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <Link href="/" className="navbar-logo">
          RYC
        </Link>
        <div className="navbar-links">
          <a href="#caracteristicas" className="nav-link">
            Características
          </a>
          <a href="#como-funciona" className="nav-link">
            Cómo funciona
          </a>
          <button
            className="btn-theme"
            onClick={toggle}
            aria-label="Cambiar tema"
          >
            <svg
              className="icon-moon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg
              className="icon-sun"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>
          {loading ? (
            <span className="btn-primary" style={{ opacity: 0.5 }}>
              …
            </span>
          ) : user ? (
            <div className="navbar-user">
              <Link href="/market" className="btn-primary">
                {user.firstName || user.username}
              </Link>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout().then(() => window.location.reload());
                }}
              >
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
