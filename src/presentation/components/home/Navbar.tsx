"use client";

import Link from "next/link";
import { useAuth } from "@/presentation/hooks/useAuth";
import { SliderToggle } from "@/presentation/components/ui/SliderToggle";

export function Navbar() {
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
          <SliderToggle />
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
