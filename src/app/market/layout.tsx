import { MarketNavbar } from "@/presentation/components/market/MarketNavbar";
import { MarketTabs } from "@/presentation/components/market/MarketTabs";

export default function MarketLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <MarketNavbar />
      <MarketTabs />
      <main className="mkt-page">{children}</main>
    </>
  );
}
