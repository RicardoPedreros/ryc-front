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
    href: "/market",
    label: "Mercado",
    icon: "package",
    children: [
      { href: "/market/inventory", label: "Inventario", icon: "package" },
      { href: "/market/purchases", label: "Compras", icon: "shopping-cart" },
      { href: "/market/settings", label: "Ajustes", icon: "settings" },
    ],
  },
  {
    href: "/tools/assistant",
    label: "Asistente",
    icon: "message-circle",
    isNew: false,
  },
  {
    href: "/tools/finances",
    label: "Finanzas",
    icon: "wallet",
  },
];