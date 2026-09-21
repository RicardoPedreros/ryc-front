"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/presentation/components/ui/Icon";

export interface SectionTab {
  readonly href: string;
  readonly label: string;
  readonly icon: IconName;
  readonly isNew?: boolean;
}

export function SectionTabs({ tabs }: { readonly tabs: readonly SectionTab[] }) {
  const pathname = usePathname();

  return (
    <div className="mkt-tabs-bar">
      <nav className="mkt-tabs-inner">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mkt-tab ${isActive ? "active" : ""}`}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
              {tab.isNew && <span className="asst-new-pill">nuevo</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}