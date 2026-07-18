"use client";

import Link from "next/link";
import { SliderToggle } from "@/presentation/components/ui/SliderToggle";

export function MarketNavbar() {
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
          <SliderToggle />
        </div>
      </nav>
    </header>
  );
}
