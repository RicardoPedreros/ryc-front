"use client";

import Link from "next/link";
import { useTheme } from "@/presentation/hooks/useTheme";

export function MarketNavbar() {
  const { toggle, togglePalette } = useTheme();

  return (
    <header className="mkt-navbar">
      <nav className="mkt-navbar-inner">
        <div className="mkt-navbar-left">
          <Link href="/" className="mkt-navbar-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className="mkt-navbar-title">Mercado</span>
        </div>
        <div className="mkt-navbar-right">
          <button className="btn-theme" onClick={toggle} aria-label="Cambiar tema">
            <svg className="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg className="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          <button className="btn-palette" onClick={togglePalette} aria-label="Cambiar paleta">
            <svg className="icon-dunkin" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="3.5" r="2.5" />
               <path d="M7.5,2 Q4.5,-0.5 4,5" />
               <path d="M12.5,2 Q15.5,-0.5 16,5" />
              <path d="M6.5,18 L10,7 L13.5,18 Z" />
              <line x1="5" y1="10" x2="7.5" y2="9" />
              <line x1="15" y1="10" x2="12.5" y2="9" />
              <line x1="7.5" y1="18" x2="6" y2="19.5" />
              <line x1="12.5" y1="18" x2="14" y2="19.5" />
            </svg>
            <svg className="icon-default" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="3.2" r="2.5" />
              <line x1="10" y1="5.7" x2="10" y2="12.5" />
              <line x1="5.5" y1="9.5" x2="14.5" y2="9.5" />
              <line x1="10" y1="12.5" x2="7" y2="18" />
              <line x1="10" y1="12.5" x2="13" y2="18" />
              <line x1="7" y1="18" x2="6" y2="19.5" />
              <line x1="13" y1="18" x2="14" y2="19.5" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
