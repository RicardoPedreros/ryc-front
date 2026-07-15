import { requireSession } from '@/shared/auth';
import { MarketNavbar } from '@/presentation/components/market/MarketNavbar';
import { MarketTabs } from '@/presentation/components/market/MarketTabs';

export default async function MarketLayout({ children }: { readonly children: React.ReactNode }) {
  await requireSession();

  return (
    <>
      <MarketNavbar />
      <MarketTabs />
      <main className="mkt-page">{children}</main>
    </>
  );
}
