"use client";

import { useState, useCallback, useEffect } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { ProductLot } from "@/domain/market/entities/inventory-movement";

interface ProductWithStock {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly brandId: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly stockQuantity: number;
  readonly currentStock: number;
}

interface MovementType {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly stockMultiplier: number;
}

type AdjustMode = "increase" | "decrease";

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryBadgeClass(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

function expiryLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `Venció hace ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Mañana";
  return `${days}d`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function StockAdjustment() {
  const { data: products, loading: loadingProducts } = useFetch<readonly ProductWithStock[]>(
    "/api/market/inventory/adjust"
  );
  const { data: movementTypes } = useFetch<readonly MovementType[]>(
    "/api/market/movement-types"
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mode, setMode] = useState<AdjustMode>("increase");
  const [quantity, setQuantity] = useState(1);
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState("");
  const [lotName, setLotName] = useState("");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [decreaseQty, setDecreaseQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [lots, setLots] = useState<readonly ProductLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  useEffect(() => {
    if (!selectedProductId || mode !== "decrease") {
      setLots([]);
      return;
    }
    let cancelled = false;
    setLoadingLots(true);
    fetch(`/api/market/inventory/lots?productId=${selectedProductId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLots(data as readonly ProductLot[]); })
      .catch(() => { if (!cancelled) setLots([]); })
      .finally(() => { if (!cancelled) setLoadingLots(false); });
    return () => { cancelled = true; };
  }, [selectedProductId, mode]);

  const getMovementTypeId = useCallback(
    (code: string) => {
      if (!movementTypes) return null;
      return movementTypes.find((mt) => mt.code === code)?.id ?? null;
    },
    [movementTypes]
  );

  const selectedProduct = products?.find((p) => p.id === selectedProductId) ?? null;

  const filteredProducts = (products ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase().includes(q) ?? false) ||
      (p.categoryName?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);
    setMode("increase");
    setQuantity(1);
    setHasExpiry(true);
    setExpiryDate("");
    setLotName("");
    setSelectedLot(null);
    setDecreaseQty(1);
    setSaved(false);
  }

  function handleBack() {
    setSelectedProductId(null);
    setQuantity(1);
    setHasExpiry(true);
    setExpiryDate("");
    setLotName("");
    setSelectedLot(null);
    setDecreaseQty(1);
    setSearch("");
    setSaved(false);
  }

  function handleSwitchMode(newMode: AdjustMode) {
    setMode(newMode);
    setQuantity(1);
    setHasExpiry(true);
    setExpiryDate("");
    setLotName("");
    setSelectedLot(null);
    setDecreaseQty(1);
  }

  const canDecrease = (selectedProduct?.currentStock ?? 0) > 0;
  const availableLots = (lots ?? []).filter((l) => l.quantity > 0);
  const selectedLotData = availableLots.find((l) => l.lot === selectedLot) ?? null;
  const maxDecrease = selectedLotData?.quantity ?? 0;

  async function handleSave() {
    if (!selectedProductId) return;

    const inTypeId = getMovementTypeId("ADJUSTMENT_IN");
    const outTypeId = getMovementTypeId("ADJUSTMENT_OUT");
    if (!inTypeId || !outTypeId) return;

    if (mode === "increase" && quantity <= 0) return;
    if (mode === "decrease" && (!selectedLot || decreaseQty <= 0)) return;

    setSaving(true);
    try {
      const body = mode === "increase"
        ? {
            movements: [
              {
                productId: selectedProductId,
                quantity,
                movementTypeId: inTypeId,
                expirationDate: hasExpiry && expiryDate ? expiryDate : null,
                lot: lotName || null,
                notes: "Ajuste de stock (+)",
              },
            ],
          }
        : {
            movements: [
              {
                productId: selectedProductId,
                quantity: decreaseQty,
                movementTypeId: outTypeId,
                lot: selectedLot === "Sin lote" ? null : selectedLot,
                notes: `Ajuste de stock (-) del lote ${selectedLot}`,
              },
            ],
          };

      const res = await fetch("/api/market/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? `HTTP ${res.status}`);
      }

      setSaved(true);
      if (mode === "increase") {
        setQuantity(1);
        setExpiryDate("");
        setLotName("");
      } else {
        setDecreaseQty(1);
        setSelectedLot(null);
      }
    } catch {
      // Error silently
    } finally {
      setSaving(false);
    }
  }

  if (loadingProducts) {
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
          <p className="mkt-empty-sub">Primero creá productos en Ajustes para poder cargar stock</p>
        </div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="mkt-adjust">
        <div className="mkt-adjust-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mkt-card">
          {filteredProducts.length === 0 ? (
            <div className="mkt-empty-state">
              <p>No se encontraron productos</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="mkt-adjust-product-select"
                onClick={() => handleSelectProduct(product.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectProduct(product.id); } }}
              >
                <div className="mkt-adjust-product-select-info">
                    <span className="mkt-adjust-product-select-name">
                      {product.name}
                    </span>
                    <span className="mkt-adjust-product-select-meta">
                      {[
                        product.brand,
                        product.categoryName,
                        product.presentationQuantity && product.unitSymbol ? `${product.presentationQuantity} ${product.unitSymbol}` : null,
                      ].filter(Boolean).join(" · ")}
                    </span>
                </div>
                <div className="mkt-adjust-product-select-right">
                  <span className={`mkt-adjust-product-select-stock ${product.currentStock === 0 ? "zero" : product.currentStock <= 2 ? "low" : ""}`}>
                    {product.currentStock} uds
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="5 3 9 7 5 11" />
                  </svg>
                </div>
              </div>
            ))
          )}
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

      <button className="mkt-back-link" onClick={handleBack}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 3 5 7 9 11" />
        </svg>
        Volver a productos
      </button>

      <div className="mkt-adjust-selected">
        <div className="mkt-adjust-selected-info">
          <span className="mkt-adjust-selected-name">
            {selectedProduct.name}
          </span>
          <span className="mkt-adjust-selected-meta">
            {[
              selectedProduct.brand,
              selectedProduct.presentationQuantity && selectedProduct.unitSymbol
                ? `${selectedProduct.presentationQuantity} ${selectedProduct.unitSymbol}`
                : null,
            ].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span className="mkt-adjust-selected-stock">
          Stock actual: <strong>{selectedProduct.currentStock}</strong> uds
        </span>
      </div>

      <div className="mkt-adjust-mode-switch">
        <button
          className={`mkt-adjust-mode-btn ${mode === "increase" ? "active increase" : ""}`}
          onClick={() => handleSwitchMode("increase")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          Aumentar stock
        </button>
        <button
          className={`mkt-adjust-mode-btn ${mode === "decrease" ? "active decrease" : ""}`}
          onClick={() => handleSwitchMode("decrease")}
          disabled={!canDecrease}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          Disminuir stock
        </button>
      </div>

      {mode === "increase" && (
        <div className="mkt-adjust-form">
          <div className="mkt-adjust-qty-row">
            <span className="mkt-adjust-qty-label">Unidades a agregar</span>
            <div className="mkt-adjust-stepper">
              <button
                className="mkt-adjust-step-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="mkt-adjust-qty-value">{quantity}</span>
              <button
                className="mkt-adjust-step-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="mkt-adjust-expiry-row">
            <button
              className={`mkt-adjust-expiry-toggle ${hasExpiry ? "active" : ""}`}
              onClick={() => setHasExpiry(!hasExpiry)}
            >
              <span className="mkt-adjust-expiry-switch">
                <span className="mkt-adjust-expiry-switch-thumb" />
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
                <path d="M4 1v2.5M10 1v2.5M1.5 6.5h11" />
              </svg>
              <span>Tiene fecha de vencimiento</span>
            </button>

            {hasExpiry && (
              <div className="mkt-adjust-expiry-fields">
                <input
                  type="date"
                  className="mkt-adjust-date-input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                {expiryDate && (
                  <span className={`mkt-adjust-expiry-badge ${expiryBadgeClass(expiryDate)}`}>
                    {expiryLabel(expiryDate)}
                  </span>
                )}
              </div>
            )}

            {!hasExpiry && (
              <span className="mkt-adjust-expiry-sin-fecha">
                Sin fecha de vencimiento
              </span>
            )}
          </div>

          <div className="mkt-adjust-lot-row">
            <span className="mkt-adjust-qty-label">Nombre del lote (opcional)</span>
            <input
              type="text"
              className="mkt-form-input"
              placeholder="ej. Lote A, Compra 15/03..."
              value={lotName}
              onChange={(e) => setLotName(e.target.value)}
            />
          </div>

          <div className="mkt-adjust-save-row">
            <button className="mkt-btn-ghost" onClick={handleBack}>
              Cancelar
            </button>
            <button
              className="mkt-btn-primary"
              onClick={handleSave}
              disabled={saving || quantity <= 0}
            >
              {saving ? "Guardando..." : `Agregar ${quantity} unidades`}
            </button>
          </div>
        </div>
      )}

      {mode === "decrease" && (
        <div className="mkt-adjust-form">
          {loadingLots ? (
            <div className="mkt-empty-state">
              <p>Cargando lotes...</p>
            </div>
          ) : availableLots.length === 0 ? (
            <div className="mkt-empty-state">
              <p>No hay lotes disponibles</p>
              <p className="mkt-empty-sub">Primero agregá stock con el modo aumentar</p>
            </div>
          ) : (
            <>
              <div className="mkt-adjust-lots-label">
                Seleccioná el lote del que deseas retirar:
              </div>

              <div className="mkt-adjust-lot-list">
                {availableLots.map((lot) => {
                  const isSelected = selectedLot === lot.lot;
                  const lotExpiryClass = lot.daysUntilExpiry !== null && lot.expirationDate ? expiryBadgeClass(lot.expirationDate) : "";
                  return (
                    <div
                      key={lot.lot}
                      className={`mkt-adjust-lot-item ${isSelected ? "selected" : ""} ${lot.daysUntilExpiry !== null && lot.daysUntilExpiry <= 0 ? "expired" : ""}`}
                      onClick={() => { setSelectedLot(lot.lot); setDecreaseQty(1); }}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedLot(lot.lot); setDecreaseQty(1); } }}
                    >
                      <div className="mkt-adjust-lot-radio">
                        {isSelected && <span className="mkt-adjust-lot-radio-dot" />}
                      </div>
                      <div className="mkt-adjust-lot-info">
                        <span className="mkt-adjust-lot-name">
                          {lot.lot === "Sin lote" ? "Sin lote" : lot.lot}
                        </span>
                        {lot.expirationDate && (
                          <span className="mkt-adjust-lot-expiry">
                            Vence: {formatDate(lot.expirationDate)}
                          </span>
                        )}
                      </div>
                      <div className="mkt-adjust-lot-right">
                        <span className="mkt-adjust-lot-qty">{lot.quantity} uds</span>
                        {lot.daysUntilExpiry !== null && (
                          <span className={`mkt-badge ${lotExpiryClass}`}>
                            {expiryLabel(lot.expirationDate!)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedLot && (
                <div className="mkt-adjust-decrease-form">
                  <div className="mkt-adjust-qty-row">
                    <span className="mkt-adjust-qty-label">
                      Unidades a retirar de <strong>{selectedLot === "Sin lote" ? "Sin lote" : selectedLot}</strong>
                    </span>
                    <div className="mkt-adjust-stepper">
                      <button
                        className="mkt-adjust-step-btn"
                        onClick={() => setDecreaseQty((q) => Math.max(1, q - 1))}
                        disabled={decreaseQty <= 1}
                      >
                        −
                      </button>
                      <span className="mkt-adjust-qty-value">{decreaseQty}</span>
                      <button
                        className="mkt-adjust-step-btn"
                        onClick={() => setDecreaseQty((q) => Math.min(maxDecrease, q + 1))}
                        disabled={decreaseQty >= maxDecrease}
                      >
                        +
                      </button>
                    </div>
                    <span className="mkt-adjust-max-hint">Máx: {maxDecrease} uds</span>
                  </div>

                  <div className="mkt-adjust-save-row">
                    <button className="mkt-btn-ghost" onClick={handleBack}>
                      Cancelar
                    </button>
                    <button
                      className="mkt-btn-primary danger"
                      onClick={handleSave}
                      disabled={saving || decreaseQty <= 0}
                    >
                      {saving ? "Guardando..." : `Retirar ${decreaseQty} unidades`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
