"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";

export function StockOverview() {
  const { data: stock, loading } = useFetch<readonly InventoryStock[]>("/api/market/inventory");

  if (loading) {
    return (
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Stock actual</h2>
        </div>
        <div className="mkt-card">
          <div className="mkt-empty-state">
            <p>Cargando stock...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stock || stock.length === 0) {
    return (
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Stock actual</h2>
        </div>
        <div className="mkt-card">
          <div className="mkt-empty-state">
            <p>Sin productos en inventario</p>
            <p className="mkt-empty-sub">Registrá una compra para comenzar a trackear stock</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Stock actual</h2>
        <span className="mkt-section-meta">{stock.length} productos</span>
      </div>
      <div className="mkt-card">
        {stock.map((item) => {
          const isLow = item.currentStock <= 2;
          const isOut = item.currentStock === 0;
          return (
            <div key={item.id} className="mkt-stock-row">
              <div className="mkt-stock-info">
                <span className="mkt-stock-name">{item.name}</span>
                <span className="mkt-stock-brand">
                  {[item.brand, item.categoryName, item.presentationQuantity && item.unitSymbol ? `${item.presentationQuantity} ${item.unitSymbol}` : item.presentationQuantity ? `${item.presentationQuantity}` : null].filter(Boolean).join(" · ")}
                </span>
              </div>
              <div className="mkt-stock-right">
                <span className="mkt-stock-qty">{item.currentStock}</span>
                {isOut && <span className="mkt-badge danger">Sin stock</span>}
                {!isOut && isLow && <span className="mkt-badge warning">Bajo</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
