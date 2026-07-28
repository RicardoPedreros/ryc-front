import Link from "next/link";
import { StockOverview } from "@/presentation/components/market/StockOverview";
import { InventoryAlerts } from "@/presentation/components/market/InventoryAlerts";
import { StatsBar } from "@/presentation/components/market/StatsBar";

export default function InventoryPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Inventario</h1>
          <p>Stock actual y alertas</p>
        </div>
        <Link href="/market/inventory/ajuste" className="mkt-btn-primary">
          Ajustar stock
        </Link>
      </div>
      <StatsBar />
      <InventoryAlerts />
      <StockOverview />
    </>
  );
}
