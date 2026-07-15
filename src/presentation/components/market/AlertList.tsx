"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";

export function AlertList() {
  const { data: stock, loading } = useFetch<readonly InventoryStock[]>("/api/market/inventory");

  const alerts = (stock ?? []).filter((s) => s.currentStock <= 2);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <section className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Alertas</h2>
      </div>
      <div className="mkt-alert-list">
        {alerts.map((item) => {
          const isOut = item.currentStock <= 0;
          return (
            <div key={item.id} className="mkt-alert-item">
              <span className={`mkt-alert-dot ${isOut ? "danger" : "warning"}`} />
              <div className="mkt-alert-body">
                <div className="mkt-alert-text">{item.name}</div>
                <div className="mkt-alert-sub">
                  {isOut
                    ? "Sin stock"
                    : `Queda${item.currentStock === 1 ? "" : "n"} ${item.currentStock} unidad${item.currentStock === 1 ? "" : "es"}`}
                </div>
              </div>
              <button className="mkt-alert-action">Comprar</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
