import { ShoppingList } from "@/presentation/components/market/ShoppingList";
import { PurchaseHistory } from "@/presentation/components/market/PurchaseHistory";
import { PurchaseModals } from "@/presentation/components/market/PurchaseModals";

export default function PurchasesPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Compras</h1>
          <p>Historial, lista de compras y registro de nuevas compras</p>
        </div>
      </div>
      <ShoppingList />
      <PurchaseHistory />
      <PurchaseModals />
    </>
  );
}
