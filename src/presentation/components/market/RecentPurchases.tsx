"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";

function getStoreName(
  storeId: string | null,
  stores: readonly Store[]
): string {
  if (!storeId) return "Sin tienda";
  return stores.find((s) => s.id === storeId)?.name ?? "Desconocida";
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function RecentPurchases() {
  const { data: purchases, loading } = useFetch<readonly Purchase[]>(
    "/api/market/purchases"
  );
  const { data: stores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");

  const pmMap = new Map((paymentMethods ?? []).map((pm) => [pm.id, pm.name]));

  if (loading) return null;

  const list = (purchases ?? []).slice(0, 4);
  if (list.length === 0) return null;

  return (
    <section className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Últimas compras</h2>
        <button className="mkt-section-action">Ver todo</button>
      </div>
      <div className="mkt-card">
        {list.map((purchase) => (
          <div key={purchase.id} className="mkt-purchase-card">
            <div className="mkt-purchase-body">
              <div className="mkt-purchase-store">
                {getStoreName(purchase.storeId, stores ?? [])}
              </div>
              <div className="mkt-purchase-detail">
                {purchase.paymentMethodId
                  ? pmMap.get(purchase.paymentMethodId) ?? "—"
                  : "Sin método"}
              </div>
            </div>
            <div className="mkt-purchase-right">
              <div className="mkt-purchase-total">
                {purchase.total != null
                  ? `$${purchase.total.toLocaleString("es-AR")}`
                  : "—"}
              </div>
              <div className="mkt-purchase-date">
                {formatRelativeDate(purchase.purchaseDate)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
