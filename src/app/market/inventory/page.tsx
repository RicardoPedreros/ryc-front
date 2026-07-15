import Link from "next/link";
import { StockOverview } from "@/presentation/components/market/StockOverview";
import { LowStockAlerts } from "@/presentation/components/market/LowStockAlerts";

export default function InventoryPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Inventario</h1>
          <p>Stock actual y alertas de reposición</p>
        </div>
        <Link href="/market/inventory/ajuste" className="mkt-btn-primary">
          Ajustar stock
        </Link>
      </div>
      <LowStockAlerts />
      <StockOverview />
    </>
  );
}
