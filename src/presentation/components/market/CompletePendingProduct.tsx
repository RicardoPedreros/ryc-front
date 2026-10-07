"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import { ProductForm } from "@/presentation/components/market/forms/ProductForm";
import type { PendingTemporalProduct } from "@/domain/market/entities/inventory-movement";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";

interface CompletePendingProductProps {
  readonly pending: PendingTemporalProduct;
  readonly onClose: () => void;
  readonly onCompleted: () => void;
}

export function CompletePendingProduct({ pending, onClose, onCompleted }: CompletePendingProductProps) {
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: units } = useFetch<readonly Unit[]>("/api/market/units");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");

  const linkMovements = async (created: { id: string }) => {
    const res = await fetch("/api/market/inventory/pending-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: created.id,
        temporalProductName: pending.temporalProductName,
        temporalBarcode: pending.temporalBarcode,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "No se pudieron vincular los movimientos");
    }
  };

  return (
    <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />
        <ProductForm
          categories={categories ?? []}
          units={units ?? []}
          brands={brands ?? []}
          initialName={pending.temporalProductName ?? ""}
          initialBarcode={pending.temporalBarcode ?? ""}
          title="Completar producto"
          submitLabel="Completar producto"
          onAfterCreate={linkMovements}
          onClose={onClose}
          onSaved={onCompleted}
        />
      </div>
    </div>
  );
}