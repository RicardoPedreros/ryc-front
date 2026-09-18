"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/presentation/components/ui/Icon";

const TABS = [
  { href: "/market/inventory", label: "Inventario", icon: "inventory", isNew: false },
  { href: "/market/purchases", label: "Compras", icon: "purchases", isNew: false },
  { href: "/market/settings", label: "Ajustes", icon: "settings", isNew: false },
  { href: "/market/assistant", label: "Asistente", icon: "assistant", isNew: true },
] as const;

function TabIcon({ icon, isActive }: { readonly icon: (typeof TABS)[number]["icon"]; readonly isActive: boolean }) {
  const name =
    icon === "inventory" ? "package"
    : icon === "purchases" ? "shopping-cart"
    : icon === "settings" ? "settings"
    : "message-circle";

  return <Icon name={name} size={18} />;
}

export function MarketTabs() {
  const pathname = usePathname();

  return (
    <div className="mkt-tabs-bar">
      <nav className="mkt-tabs-inner">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mkt-tab ${isActive ? "active" : ""}`}
            >
              <TabIcon icon={tab.icon} isActive={isActive} />
              <span>{tab.label}</span>
              {tab.isNew && <span className="asst-new-pill">nuevo</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
