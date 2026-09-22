import SectionShell from "@/presentation/components/sections/SectionShell";
import { APP_SECTIONS } from "@/presentation/components/sections/section-nav";

export default async function MarketLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <SectionShell title="Mercado" sections={APP_SECTIONS}>
      {children}
    </SectionShell>
  );
}