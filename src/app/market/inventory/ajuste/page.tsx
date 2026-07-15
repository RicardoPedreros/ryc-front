import Link from "next/link";
import { StockAdjustment } from "@/presentation/components/market/StockAdjustment";

export default function StockAdjustmentPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <Link href="/market/inventory" className="mkt-back-link">
            ← Inventario
          </Link>
          <h1>Ajustar stock</h1>
          <p>Cargá las existencias iniciales de cada producto sin vincularlas a una compra</p>
        </div>
      </div>
      <StockAdjustment />
    </>
  );
}
