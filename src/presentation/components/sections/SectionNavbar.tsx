"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SliderToggle } from "@/presentation/components/ui/SliderToggle";
import { Icon } from "@/presentation/components/ui/Icon";
import type { SectionNavGroup } from "./section-nav";

function isPathMatch(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function SectionNavbar({
  title,
  sections,
}: {
  readonly title: string;
  readonly sections: readonly SectionNavGroup[];
}) {
  const pathname = usePathname();
  const navbarRef = useRef<HTMLElement | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenSection(null);
  }

  useEffect(() => {
    function handlePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (navbarRef.current && !navbarRef.current.contains(target)) {
        setOpenSection(null);
      }
    }
    window.addEventListener("pointerdown", handlePointer, true);
    return () => window.removeEventListener("pointerdown", handlePointer, true);
  }, []);

  const activeGroup = sections.find(
    (group) =>
      isPathMatch(pathname, group.href) ||
      group.children?.some((child) => isPathMatch(pathname, child.href)),
  );

  return (
    <header className="mkt-navbar" ref={navbarRef}>
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

      <div className="mkt-nav-sections" role="navigation" aria-label="Secciones">
        <div className="mkt-nav-sections-inner">
          {sections.map((group) => {
            const isActive = activeGroup === group;
            const hasChildren = (group.children?.length ?? 0) > 0;
            const isOpen = hasChildren && openSection === group.href;

            return (
              <div
                key={group.href}
                className={`mkt-nav-group ${isActive ? "active" : ""} ${isOpen ? "open" : ""}`}
                data-od-id={`nav-${group.label.toLowerCase()}`}
                onMouseEnter={
                  hasChildren ? () => setOpenSection(group.href) : undefined
                }
                onMouseLeave={
                  hasChildren ? () => setOpenSection(null) : undefined
                }
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className="mkt-nav-trigger"
                    aria-current={isActive ? "page" : undefined}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() => setOpenSection(group.href)}
                  >
                    <Icon name={group.icon} size={16} />
                    <span className="mkt-nav-trigger-label">{group.label}</span>
                    <Icon
                      name="chevron-down"
                      size={12}
                      strokeWidth={2.5}
                      className="mkt-nav-chevron"
                    />
                    {group.isNew && <span className="asst-new-pill">nuevo</span>}
                  </button>
                ) : (
                  <Link
                    href={group.href}
                    className="mkt-nav-trigger"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon name={group.icon} size={16} />
                    <span className="mkt-nav-trigger-label">{group.label}</span>
                    {group.isNew && <span className="asst-new-pill">nuevo</span>}
                  </Link>
                )}

                {hasChildren && (
                  <div className="mkt-nav-dd">
                    {group.children!.map((child) => {
                      const childActive = isPathMatch(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`mkt-nav-dd-item ${childActive ? "active" : ""}`}
                          aria-current={childActive ? "page" : undefined}
                        >
                          <Icon name={child.icon} size={15} />
                          <span>{child.label}</span>
                          {child.isNew && <span className="asst-new-pill">nuevo</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}