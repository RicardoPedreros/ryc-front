"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BrandChip, buildBrandPathLookup } from "@/presentation/components/market/BrandChip";
import type { InventoryStock, ProductLot } from "@/domain/market/entities/inventory-movement";
import type { Brand } from "@/domain/market/entities/brand";

function getExpiryLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `Venció ${Math.abs(days)}d`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `${days}d`;
}

function getExpiryClass(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "danger";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "success";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function StockOverview() {
  const { data: stock, loading } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: lots } = useFetch<readonly ProductLot[]>("/api/market/inventory/lots");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const brandPaths = buildBrandPathLookup(brands ?? []);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(productId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  const lotsByProduct = new Map<string, readonly ProductLot[]>();
  if (lots) {
    for (const lot of lots) {
      const existing = lotsByProduct.get(lot.productId) ?? [];
      lotsByProduct.set(lot.productId, [...existing, lot]);
    }
  }

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
          const brandPath = item.brand ? brandPaths.byName.get(item.brand) ?? null : null;
          const hasExpiry = item.daysUntilExpiry !== null;
          const expiryClass = hasExpiry ? getExpiryClass(item.daysUntilExpiry) : "";
          const isExpanded = expanded.has(item.id);
          const productLots = lotsByProduct.get(item.id) ?? [];

          return (
            <div
              key={item.id}
              className={`mkt-stock-row ${hasExpiry && item.daysUntilExpiry! <= 0 ? "expired" : ""}`}
            >
              {hasExpiry && (
                <span className={`mkt-stock-expiry-bar ${expiryClass}`} />
              )}
              <div
                className="mkt-stock-main"
                onClick={() => productLots.length > 0 && toggleExpand(item.id)}
                role={productLots.length > 0 ? "button" : undefined}
                tabIndex={productLots.length > 0 ? 0 : undefined}
                onKeyDown={productLots.length > 0 ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(item.id); } } : undefined}
              >
                <div className="mkt-stock-info">
                  <span className="mkt-stock-name">{item.name}</span>
                  <span className="mkt-stock-brand">
                    {item.brand && <BrandChip brandName={item.brand} brandPath={brandPath} />}
                    {item.brand && " · "}
                    {item.categoryName}
                    {item.presentationQuantity && item.unitSymbol
                      ? ` · ${item.presentationQuantity} ${item.unitSymbol}`
                      : item.presentationQuantity
                        ? ` · ${item.presentationQuantity}`
                        : null}
                  </span>
                </div>
                <div className="mkt-stock-right">
                  <span className="mkt-stock-qty">{item.currentStock}</span>
                  {isOut && <span className="mkt-badge danger">Sin stock</span>}
                  {!isOut && isLow && <span className="mkt-badge warning">Bajo</span>}
                  {hasExpiry && (
                    <span className={`mkt-badge ${expiryClass}`}>
                      {getExpiryLabel(item.daysUntilExpiry)}
                    </span>
                  )}
                  {productLots.length > 0 && (
                    <span className={`mkt-stock-expand-icon ${isExpanded ? "open" : ""}`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4.5 2 7.5 5 4.5 8" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && productLots.length > 0 && (
                <div className="mkt-stock-lots">
                  {productLots.map((lot) => {
                    const lotExpiryClass = lot.daysUntilExpiry !== null ? getExpiryClass(lot.daysUntilExpiry) : "";
                    return (
                      <div key={lot.lot} className="mkt-stock-lot">
                        <div className="mkt-stock-lot-info">
                          <span className="mkt-stock-lot-name">
                            {lot.lot === "Sin lote" ? "Sin lote" : `Lote ${lot.lot}`}
                          </span>
                          {lot.expirationDate && (
                            <span className="mkt-stock-lot-expiry">
                              Vence: {formatDate(lot.expirationDate)}
                            </span>
                          )}
                        </div>
                        <div className="mkt-stock-lot-right">
                          <span className="mkt-stock-lot-qty">{lot.quantity} uds</span>
                          {lot.daysUntilExpiry !== null && (
                            <span className={`mkt-badge ${lotExpiryClass}`}>
                              {getExpiryLabel(lot.daysUntilExpiry)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
