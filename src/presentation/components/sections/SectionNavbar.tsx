"use client";

import Link from "next/link";
import { SliderToggle } from "@/presentation/components/ui/SliderToggle";
import { Icon } from "@/presentation/components/ui/Icon";

export function SectionNavbar({ title }: { readonly title: string }) {
  return (
    <header className="mkt-navbar">
      <nav className="mkt-navbar-inner">
        <div className="mkt-navbar-left">
          <Link href=".." className="mkt-navbar-back" aria-label="Volver al inicio">
            <Icon name="chevron-left" size={16} />
          </Link>
          <span className="mkt-navbar-title">{title}</span>
        </div>
        <div className="mkt-navbar-right">
          <SliderToggle />
        </div>
      </nav>
    </header>
  );
}