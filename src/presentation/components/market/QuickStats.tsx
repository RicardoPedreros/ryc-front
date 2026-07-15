"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";
import type { Purchase } from "@/domain/market/entities/purchase";

export function QuickStats() {
  const { data: stock } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: purchases } = useFetch<readonly Purchase[]>("/api/market/purchases");

  const now = new Date();
  const monthPurchases = (purchases ?? []).filter((p) => {
    const d = new Date(p.purchaseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = monthPurchases.reduce((sum, p) => sum + (p.total ?? 0), 0);
  const lowStockCount = (stock ?? []).filter((s) => s.currentStock <= 2 && s.currentStock > 0).length;
  const outOfStockCount = (stock ?? []).filter((s) => s.currentStock <= 0).length;
  const restockCount = lowStockCount + outOfStockCount;

  return (
    <div className="mkt-quick-stats">
      <div className="mkt-quick-stat">
        <div className="mkt-quick-stat-value" style={{ color: "var(--accent)" }}>
          {stock !== null ? (stock ?? []).length : "—"}
        </div>
        <div className="mkt-quick-stat-label">productos</div>
      </div>
      <div className="mkt-quick-stat">
        <div className="mkt-quick-stat-value" style={{ color: "var(--secondary)" }}>
          {purchases !== null ? `$${monthTotal.toLocaleString("es-AR")}` : "—"}
        </div>
        <div className="mkt-quick-stat-label">este mes</div>
      </div>
      <div className="mkt-quick-stat">
        <div className="mkt-quick-stat-value" style={{ color: "var(--warning)" }}>
          {stock !== null ? restockCount : "—"}
        </div>
        <div className="mkt-quick-stat-label">por reponer</div>
      </div>
    </div>
  );
}
