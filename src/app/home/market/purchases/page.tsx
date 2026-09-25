import { PurchasesActions } from "@/presentation/components/market/PurchasesActions";
import { PurchaseHistory } from "@/presentation/components/market/PurchaseHistory";

export default function PurchasesPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Compras</h1>
          <p>Historial, lista de compras y registro de nuevas compras</p>
        </div>
      </div>
      <PurchasesActions />
      <PurchaseHistory />
    </>
  );
}