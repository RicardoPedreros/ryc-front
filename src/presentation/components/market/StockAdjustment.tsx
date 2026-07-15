"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";

interface ProductWithStock {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly brandId: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly currentStock: number;
}

interface MovementType {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly stockMultiplier: number;
}

interface PendingAdjustment {
  readonly productId: string;
  readonly delta: number;
}

type Filter = "all" | "no_stock" | "low_stock";

export function StockAdjustment() {
  const { data: products, loading } = useFetch<readonly ProductWithStock[]>(
    "/api/market/inventory/adjust"
  );
  const { data: movementTypes } = useFetch<readonly MovementType[]>(
    "/api/market/movement-types"
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adjustments, setAdjustments] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getInitialStockTypeId = useCallback(() => {
    if (!movementTypes) return null;
    return movementTypes.find((mt) => mt.code === "INITIAL_STOCK")?.id ?? null;
  }, [movementTypes]);

  const filtered = (products ?? []).filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q) ?? false;
      const matchCategory = p.categoryName?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchBrand && !matchCategory) return false;
    }
    const stock = adjustments.has(p.id)
      ? p.currentStock + (adjustments.get(p.id) ?? 0)
      : p.currentStock;
    if (filter === "no_stock") return stock === 0;
    if (filter === "low_stock") return stock > 0 && stock <= 2;
    return true;
  });

  const noStockCount = (products ?? []).filter(
    (p) => p.currentStock === 0
  ).length;
  const lowStockCount = (products ?? []).filter(
    (p) => p.currentStock > 0 && p.currentStock <= 2
  ).length;

  const pendingAdjustments: readonly PendingAdjustment[] = Array.from(
    adjustments.entries()
  )
    .filter(([, delta]) => delta !== 0)
    .map(([productId, delta]) => ({ productId, delta }));

  function handleDelta(productId: string, delta: number) {
    if (saved) setSaved(false);
    setAdjustments((prev) => {
      const next = new Map(prev);
      const current = next.get(productId) ?? 0;
      next.set(productId, current + delta);
      return next;
    });
  }

  async function handleSave() {
    const typeId = getInitialStockTypeId();
    if (!typeId || pendingAdjustments.length === 0) return;

    setSaving(true);
    try {
      const movements = pendingAdjustments.map((a) => ({
        productId: a.productId,
        quantity: Math.abs(a.delta),
        movementTypeId: typeId,
        notes: a.delta > 0 ? "Ajuste de stock inicial (+)" : "Ajuste de stock inicial (-)",
      }));

      const res = await fetch("/api/market/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      setAdjustments(new Map());
      setSaved(true);
    } catch {
      // Error silently — the API will return an error message
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setAdjustments(new Map());
  }

  if (loading) {
    return (
      <div className="mkt-card">
        <div className="mkt-empty-state">
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mkt-card">
        <div className="mkt-empty-state">
          <p>No hay productos cargados</p>
          <p className="mkt-empty-sub">
            Primero creá productos en Ajustes para poder cargar stock
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mkt-adjust">
      {saved && (
        <div className="mkt-adjust-toast">
          Stock actualizado correctamente
        </div>
      )}

      <div className="mkt-adjust-summary">
        <div className="mkt-adjust-summary-item">
          <span className="mkt-adjust-summary-value">{products.length}</span>
          <span className="mkt-adjust-summary-label">Productos</span>
        </div>
        <div className="mkt-adjust-summary-item">
          <span className="mkt-adjust-summary-value danger">{noStockCount}</span>
          <span className="mkt-adjust-summary-label">Sin stock</span>
        </div>
        <div className="mkt-adjust-summary-item">
          <span className="mkt-adjust-summary-value warning">{lowStockCount}</span>
          <span className="mkt-adjust-summary-label">Bajo stock</span>
        </div>
      </div>

      <div className="mkt-adjust-toolbar">
        <div className="mkt-adjust-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto, marca o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mkt-adjust-filters">
          <button
            className={`mkt-adjust-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
          <button
            className={`mkt-adjust-chip ${filter === "no_stock" ? "active" : ""}`}
            onClick={() => setFilter("no_stock")}
          >
            Sin stock
          </button>
          <button
            className={`mkt-adjust-chip ${filter === "low_stock" ? "active" : ""}`}
            onClick={() => setFilter("low_stock")}
          >
            Bajo stock
          </button>
        </div>
      </div>

      <div className="mkt-card">
        {filtered.length === 0 ? (
          <div className="mkt-empty-state">
            <p>No se encontraron productos</p>
          </div>
        ) : (
          filtered.map((product) => {
            const delta = adjustments.get(product.id) ?? 0;
            const effectiveStock = product.currentStock + delta;
            const isModified = delta !== 0;
            const isOut = effectiveStock === 0;
            const isLow = effectiveStock > 0 && effectiveStock <= 2;

            return (
              <div
                key={product.id}
                className={`mkt-adjust-row ${isModified ? "modified" : ""}`}
              >
                <div className="mkt-adjust-info">
                  <span className="mkt-adjust-name">{product.name}</span>
                  <span className="mkt-adjust-meta">
                    {[product.brand, product.categoryName, product.presentationQuantity && product.unitSymbol ? `${product.presentationQuantity} ${product.unitSymbol}` : product.presentationQuantity ? `${product.presentationQuantity}` : null].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className="mkt-adjust-controls">
                  {isModified && (
                    <span className="mkt-adjust-delta">
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                  <div className="mkt-adjust-stepper">
                    <button
                      className="mkt-adjust-step-btn"
                      onClick={() => handleDelta(product.id, -1)}
                      disabled={effectiveStock <= 0}
                    >
                      −
                    </button>
                    <span
                      className={`mkt-adjust-stock ${isOut ? "zero" : ""} ${isLow ? "low" : ""}`}
                    >
                      {effectiveStock}
                    </span>
                    <button
                      className="mkt-adjust-step-btn"
                      onClick={() => handleDelta(product.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="mkt-adjust-unit">uds</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingAdjustments.length > 0 && (
        <div className="mkt-adjust-batch-bar">
          <span className="mkt-adjust-batch-count">
            {pendingAdjustments.length} producto{pendingAdjustments.length > 1 ? "s" : ""} a ajustar
          </span>
          <div className="mkt-adjust-batch-actions">
            <button
              className="mkt-btn-ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="mkt-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar ajustes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
