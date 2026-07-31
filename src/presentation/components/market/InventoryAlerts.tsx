"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BrandChip, buildBrandPathLookup } from "@/presentation/components/market/BrandChip";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";
import type { Brand } from "@/domain/market/entities/brand";

type AlertFilter = "all" | "stock" | "expiry";

function getExpiryLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `Venció hace ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `${days}d`;
}

function getExpiryBadgeClass(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "danger";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "success";
}

export function InventoryAlerts() {
  const { data: stock, loading } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const brandPaths = buildBrandPathLookup(brands ?? []);
  const [filter, setFilter] = useState<AlertFilter>("all");

  if (loading || !stock) return null;

  const notificableStock = stock.filter((item) => item.notificate);
  const lowStockItems = notificableStock.filter(
    (item) => item.currentStock > 0 && item.currentStock <= item.minStock
  );
  const outOfStock = notificableStock.filter((item) => item.currentStock === 0);
  const expiryItems = notificableStock.filter(
    (item) => item.daysUntilExpiry !== null && item.daysUntilExpiry <= item.minDays
  );
  const stockAlerts = [...outOfStock, ...lowStockItems];
  const allAlerts = [
    ...outOfStock,
    ...lowStockItems.filter((l) => !outOfStock.some((o) => o.id === l.id)),
    ...expiryItems.filter(
      (e) => !outOfStock.some((o) => o.id === e.id) && !lowStockItems.some((l) => l.id === e.id)
    ),
  ];
  const expiredItems = notificableStock.filter(
    (item) => item.daysUntilExpiry !== null && item.daysUntilExpiry <= 0
  );

  const allCount = allAlerts.length;
  const stockCount = stockAlerts.length;
  const expiryCount = expiryItems.length;
  const hasAnyAlert = allCount > 0;

  const filteredItems =
    filter === "stock" ? stockAlerts
    : filter === "expiry" ? expiryItems
    : allAlerts;

  const bannerExpired = expiredItems.length;
  const bannerUrgent = expiryItems.filter(
    (e) => e.daysUntilExpiry !== null && e.daysUntilExpiry > 0 && e.daysUntilExpiry <= 7
  ).length;

  return (
    <div className="mkt-section">
      {/* Banners */}
      {bannerExpired > 0 && (
        <div className="mkt-alert-banner danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{bannerExpired} {bannerExpired === 1 ? "producto está" : "productos están"} vencido{bannerExpired !== 1 && "s"}</span>
        </div>
      )}
      {bannerUrgent > 0 && (
        <div className="mkt-alert-banner warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{bannerUrgent} {bannerUrgent === 1 ? "producto vence" : "productos vencen"} esta semana</span>
        </div>
      )}

      {/* Tabs + header */}
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Alertas</h2>
      </div>

      {hasAnyAlert && (
        <div className="mkt-alert-tabs">
          <button
            className={`mkt-alert-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todas
            <span className="mkt-alert-tab-count">{allCount}</span>
          </button>
          <button
            className={`mkt-alert-tab ${filter === "stock" ? "active" : ""}`}
            onClick={() => setFilter("stock")}
          >
            Stock bajo
            <span className="mkt-alert-tab-count">{stockCount}</span>
          </button>
          <button
            className={`mkt-alert-tab ${filter === "expiry" ? "active" : ""}`}
            onClick={() => setFilter("expiry")}
          >
            Vencimiento
            <span className="mkt-alert-tab-count">{expiryCount}</span>
          </button>
        </div>
      )}

      {/* Alert list */}
      {filteredItems.length > 0 ? (
        <div className="mkt-alert-list">
          {filteredItems.map((item) => {
            const isOut = item.currentStock === 0;
            const isLow = item.currentStock > 0 && item.currentStock <= item.minStock;
            const hasExpiry = item.daysUntilExpiry !== null;
            const isExpired = hasExpiry && item.daysUntilExpiry! <= 0;
            const isExpirySoon = hasExpiry && item.daysUntilExpiry! > 0 && item.daysUntilExpiry! <= item.minDays;

            const presentation =
              item.presentationQuantity && item.unitSymbol
                ? `${item.presentationQuantity}${item.unitSymbol}`
                : null;

            const packInfo = item.stockQuantity > 1 ? true : false;

            const brandPath = item.brand
              ? brandPaths.byName.get(item.brand) ?? null
              : null;

            const dotClass =
              (isExpired || isOut) ? "danger"
              : (isExpirySoon || isLow) ? "warning"
              : "success";

            const subTexts: string[] = [];
            if (isOut) {
              subTexts.push("Sin stock");
            } else if (isLow) {
              subTexts.push(`Solo quedan ${item.currentStock} unidades`);
            }
            if (hasExpiry) {
              subTexts.push(getExpiryLabel(item.daysUntilExpiry));
            }

            return (
              <div key={item.id} className="mkt-alert-item">
                <span className={`mkt-alert-dot ${dotClass}`} />
                <div className="mkt-alert-body">
                  <span className="mkt-alert-text">
                    {item.name}
                    {item.brand && " — "}
                    {item.brand && (
                      <BrandChip brandName={item.brand} brandPath={brandPath} />
                    )}
                    {packInfo && <span className="mkt-pack-chip">x{item.stockQuantity}</span>}
                    {presentation && ` (${presentation})`}
                  </span>
                  <span className="mkt-alert-sub">
                    {subTexts.join(" · ")}
                  </span>
                </div>
                <div className="mkt-alert-badges">
                  {isOut && <span className="mkt-badge danger">Sin stock</span>}
                  {!isOut && isLow && <span className="mkt-badge warning">Bajo</span>}
                  {hasExpiry && (
                    <span className={`mkt-badge ${getExpiryBadgeClass(item.daysUntilExpiry)}`}>
                      {getExpiryLabel(item.daysUntilExpiry)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : hasAnyAlert ? (
        <div className="mkt-card">
          <div className="mkt-empty-state">
            <p>Sin alertas en esta categoría</p>
            <p className="mkt-empty-sub">Probá con otra pestaña</p>
          </div>
        </div>
      ) : (
        <div className="mkt-card">
          <div className="mkt-empty-state">
            <p>Sin alertas por ahora</p>
            <p className="mkt-empty-sub">Todo está en orden con tu inventario</p>
          </div>
        </div>
      )}
    </div>
  );
}
