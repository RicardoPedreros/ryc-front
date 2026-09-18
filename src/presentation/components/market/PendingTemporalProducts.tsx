"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { CompletePendingProduct } from "@/presentation/components/market/CompletePendingProduct";
import type { PendingTemporalProduct } from "@/domain/market/entities/inventory-movement";

function pendingDisplayName(p: PendingTemporalProduct): string {
  if (p.temporalProductName) return p.temporalProductName;
  if (p.temporalBarcode) return `Código ${p.temporalBarcode}`;
  return "Producto pendiente";
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, "");
}

export function PendingTemporalProductsSection({ onCompleted }: { readonly onCompleted?: () => void }) {
  const { data: pendings, loading, refetch } = useFetch<readonly PendingTemporalProduct[]>("/api/market/inventory/pending-products");
  const [completing, setCompleting] = useState<PendingTemporalProduct | null>(null);

  if (loading || !pendings || pendings.length === 0) return null;

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Productos pendientes</h2>
        <span className="mkt-section-meta">{pendings.length}</span>
      </div>
      <div className="mkt-card">
        <p className="mkt-pending-section-hint">
          Registraste productos en compras sin tenerlos en el catálogo. Completalos para sumarlos al inventario.
        </p>
        {pendings.map((pending) => (
          <div key={`${pending.temporalProductName ?? ""}|${pending.temporalBarcode ?? ""}`} className="mkt-pending-row">
            <div className="mkt-pending-body">
              <span className="mkt-pending-name">{pendingDisplayName(pending)}</span>
              <span className="mkt-pending-meta">
                {pending.movementCount} movimiento{pending.movementCount !== 1 ? "s" : ""}
                {" · "}
                {formatQuantity(pending.totalQuantity)} unidad{pending.totalQuantity !== 1 ? "es" : ""}
              </span>
            </div>
            <button type="button" className="mkt-btn-submit mkt-pending-complete-btn" onClick={() => setCompleting(pending)}>
              Completar
            </button>
          </div>
        ))}
      </div>

      {completing && (
        <CompletePendingProduct
          pending={completing}
          onClose={() => setCompleting(null)}
          onCompleted={() => {
            setCompleting(null);
            refetch();
            onCompleted?.();
          }}
        />
      )}
    </div>
  );
}