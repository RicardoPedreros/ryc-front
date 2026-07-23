"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { InventoryMovement } from "@/domain/market/entities/inventory-movement";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";
import type { Product } from "@/domain/market/entities/product";

interface PurchaseWithItems extends Purchase {
  readonly items?: readonly InventoryMovement[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export function PurchaseHistory() {
  const { data: purchases, loading } = useFetch<readonly PurchaseWithItems[]>("/api/market/purchases");
  const { data: stores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");
  const { data: products } = useFetch<readonly Product[]>("/api/market/products");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeMap = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const pmMap = new Map((paymentMethods ?? []).map((pm) => [pm.id, pm.name]));
  const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

  if (loading) {
    return (
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Compras recientes</h2>
        </div>
        <div className="mkt-card">
          <div className="mkt-empty-state"><p>Cargando...</p></div>
        </div>
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Compras recientes</h2>
        </div>
        <div className="mkt-card">
          <div className="mkt-empty-state">
            <p>Sin compras registradas</p>
            <p className="mkt-empty-sub">Registrá tu primera compra para ver el historial</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Compras recientes</h2>
        <span className="mkt-section-meta">{purchases.length} compras</span>
      </div>
      <div className="mkt-card">
        {purchases.map((purchase) => {
          const isExpanded = expandedId === purchase.id;
          const storeName = purchase.storeId ? storeMap.get(purchase.storeId) ?? "Sin tienda" : "Sin tienda";
          const pmName = purchase.paymentMethodId ? pmMap.get(purchase.paymentMethodId) ?? "—" : "—";
          const items = purchase.items ?? [];

          return (
            <div key={purchase.id} className="mkt-purchase-row">
              <button
                type="button"
                className="mkt-purchase-header"
                onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
              >
                <div className="mkt-purchase-body">
                  <span className="mkt-purchase-store">{storeName}</span>
                  <span className="mkt-purchase-detail">
                    {formatDate(purchase.purchaseDate)} · {pmName}
                  </span>
                  {items.length > 0 && (
                    <span className="mkt-purchase-items-count">
                      {items.length} producto{items.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mkt-purchase-right">
                  {purchase.total != null && (
                    <span className="mkt-purchase-total">{formatCurrency(purchase.total)}</span>
                  )}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--fg-subtle)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mkt-purchase-chevron ${isExpanded ? "open" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>
              {isExpanded && (
                <div className="mkt-purchase-expanded">
                  {purchase.notes && <p className="mkt-purchase-notes">{purchase.notes}</p>}
                  {items.length > 0 ? (
                    <div className="mkt-purchase-items">
                      {items.map((item) => {
                        const productName = productMap.get(item.productId) ?? "Producto desconocido";
                        const lineTotal = (item.unitPrice ?? 0) * item.quantity - (item.discount ?? 0);
                        return (
                          <div key={item.id} className="mkt-purchase-item">
                            <div className="mkt-purchase-item-body">
                              <span className="mkt-purchase-item-name">{productName}</span>
                              <span className="mkt-purchase-item-meta">
                                {item.quantity} × {formatCurrency(item.unitPrice ?? 0)}
                                {(item.discount ?? 0) > 0 && ` (−${formatCurrency(item.discount ?? 0)})`}
                                {item.lot && ` · Lote: ${item.lot}`}
                                {item.expirationDate && ` · Vence: ${item.expirationDate}`}
                              </span>
                            </div>
                            <span className="mkt-purchase-item-total">{formatCurrency(lineTotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mkt-purchase-no-items">Sin productos detallados</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
