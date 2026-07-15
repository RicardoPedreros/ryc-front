"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";

export function LowStockAlerts() {
  const { data: stock, loading } = useFetch<readonly InventoryStock[]>("/api/market/inventory");

  if (loading || !stock) return null;

  const lowItems = stock.filter((item) => item.currentStock <= 2);

  if (lowItems.length === 0) return null;

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Alertas de stock</h2>
        <span className="mkt-section-count danger">{lowItems.length}</span>
      </div>
      <div className="mkt-alert-list">
        {lowItems.map((item) => {
          const isOut = item.currentStock === 0;
          const presentation = item.presentationQuantity && item.unitSymbol
            ? `${item.presentationQuantity}${item.unitSymbol}`
            : null;
          return (
            <div key={item.id} className="mkt-alert-item">
              <span className={`mkt-alert-dot ${isOut ? "danger" : "warning"}`} />
              <div className="mkt-alert-body">
                <span className="mkt-alert-text">
                  {item.name}
                  {item.brand && ` — ${item.brand}`}
                  {presentation && ` (${presentation})`}
                </span>
                <span className="mkt-alert-sub">
                  {isOut
                    ? "Sin stock — considerá reponer"
                    : `Solo quedan ${item.currentStock} unidades`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mkt-coming-soon-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Próximamente: umbrales de stock configurables por producto</span>
      </div>
    </div>
  );
}
