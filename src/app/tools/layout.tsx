import SectionShell from "@/presentation/components/sections/SectionShell";
import { APP_SECTIONS } from "@/presentation/components/sections/section-nav";

export default async function ToolsLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <SectionShell title="Herramientas" sections={APP_SECTIONS}>
      {children}
    </SectionShell>
  );
}