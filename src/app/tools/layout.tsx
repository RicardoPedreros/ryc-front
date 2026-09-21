import SectionShell from "@/presentation/components/sections/SectionShell";
import type { SectionTab } from "@/presentation/components/sections/SectionTabs";

const TOOLS_TABS: readonly SectionTab[] = [
  { href: "/tools/assistant", label: "Asistente", icon: "message-circle" },
  { href: "/tools/finances", label: "Finanzas", icon: "wallet" },
];

export default async function ToolsLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <SectionShell title="Herramientas" tabs={TOOLS_TABS}>
      {children}
    </SectionShell>
  );
}