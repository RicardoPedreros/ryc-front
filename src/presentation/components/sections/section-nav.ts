import type { IconName } from "@/presentation/components/ui/Icon";

export interface SectionNavLink {
  readonly href: string;
  readonly label: string;
  readonly icon: IconName;
  readonly isNew?: boolean;
}

export interface SectionNavGroup {
  readonly href: string;
  readonly label: string;
  readonly icon: IconName;
  readonly isNew?: boolean;
  readonly children?: readonly SectionNavLink[];
}

export const APP_SECTIONS: readonly SectionNavGroup[] = [
  {
    href: "/home/market",
    label: "Mercado",
    icon: "package",
    children: [
      { href: "/home/market/inventory", label: "Inventario", icon: "package" },
      { href: "/home/market/purchases", label: "Compras", icon: "shopping-cart" },
      { href: "/home/market/settings", label: "Ajustes", icon: "settings" },
    ],
  },
  {
    href: "/home/tools/assistant",
    label: "Asistente",
    icon: "message-circle",
    isNew: false,
  },
  {
    href: "/home/tools/finances",
    label: "Finanzas",
    icon: "wallet",
  },
];