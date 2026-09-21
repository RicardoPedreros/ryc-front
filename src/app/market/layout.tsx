import SectionShell from "@/presentation/components/sections/SectionShell";
import type { SectionTab } from "@/presentation/components/sections/SectionTabs";

const MARKET_TABS: readonly SectionTab[] = [
  { href: "/market/inventory", label: "Inventario", icon: "package" },
  { href: "/market/purchases", label: "Compras", icon: "shopping-cart" },
  { href: "/market/settings", label: "Ajustes", icon: "settings" },
  { href: "/tools", label: "Herramientas", icon: "settings" },
];

export default async function MarketLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <SectionShell title="Mercado" tabs={MARKET_TABS}>
      {children}
    </SectionShell>
  );
}