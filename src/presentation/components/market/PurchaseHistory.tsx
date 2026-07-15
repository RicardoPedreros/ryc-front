"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function PurchaseHistory() {
  const { data: purchases, loading } = useFetch<readonly Purchase[]>("/api/market/purchases");
  const { data: stores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeMap = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const pmMap = new Map((paymentMethods ?? []).map((pm) => [pm.id, pm.name]));

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
                    {pmName}
                    {purchase.total != null && ` · $${purchase.total.toLocaleString("es-AR")}`}
                  </span>
                </div>
                <div className="mkt-purchase-right">
                  <span className="mkt-purchase-date">{formatDate(purchase.purchaseDate)}</span>
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
                  <span className="mkt-purchase-id">ID: {purchase.id.slice(0, 8)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
