"use client";

import { useState, useCallback, useEffect } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { Icon } from "@/presentation/components/ui/Icon";
import { formatDate, lotKey } from "@/presentation/components/market/stock-utils";
import { ProductPicker } from "@/presentation/components/market/ProductPicker";
import { IncreaseStockForm } from "@/presentation/components/market/IncreaseStockForm";
import { DecreaseStockForm } from "@/presentation/components/market/DecreaseStockForm";
import type { ProductWithStock } from "@/presentation/components/market/ProductPicker";
import type { ProductLot } from "@/domain/market/entities/inventory-movement";

interface MovementType {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly stockMultiplier: number;
}

type AdjustMode = "increase" | "decrease";

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
  const [lotsState, setLotsState] = useState<{
    readonly requestKey: string;
    readonly lots: readonly ProductLot[];
  }>({ requestKey: "", lots: [] });

  const lotsRequestKey = selectedProductId && mode === "decrease" ? selectedProductId : "";

  useEffect(() => {
    if (!lotsRequestKey) return;
    let cancelled = false;
    fetch(`/api/market/inventory/lots?productId=${lotsRequestKey}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLotsState({ requestKey: lotsRequestKey, lots: data as readonly ProductLot[] }); })
      .catch(() => { if (!cancelled) setLotsState({ requestKey: lotsRequestKey, lots: [] }); });
    return () => { cancelled = true; };
  }, [lotsRequestKey]);

  const getMovementTypeId = useCallback(
    (code: string) => {
      if (!movementTypes) return null;
      return movementTypes.find((mt) => mt.code === code)?.id ?? null;
    },
    [movementTypes]
  );

  const selectedProduct = products?.find((p) => p.id === selectedProductId) ?? null;

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
  const hasLoadedLots = lotsState.requestKey === lotsRequestKey;
  const loadingLots = lotsRequestKey !== "" && !hasLoadedLots;
  const availableLots = hasLoadedLots ? lotsState.lots.filter((l) => l.quantity > 0) : [];
  const selectedLotData = availableLots.find((l) => lotKey(l) === selectedLot) ?? null;
  const maxDecrease = selectedLotData?.quantity ?? 0;

  async function handleSave() {
    if (!selectedProductId) return;

    const inTypeId = getMovementTypeId("ADJUSTMENT_IN");
    const outTypeId = getMovementTypeId("ADJUSTMENT_OUT");
    if (!inTypeId || !outTypeId) return;

    if (mode === "increase" && quantity <= 0) return;
    if (mode === "decrease" && (!selectedLotData || decreaseQty <= 0)) return;

    setSaving(true);
    try {
      let body: { movements: readonly unknown[] };
      if (mode === "increase") {
        body = {
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
        };
      } else {
        const lotData = selectedLotData;
        if (!lotData) return;
        body = {
          movements: [
            {
              productId: selectedProductId,
              quantity: decreaseQty,
              movementTypeId: outTypeId,
              lot: lotData.lot === "Sin lote" ? null : lotData.lot,
              expirationDate: lotData.expirationDate,
              notes: `Ajuste de stock (-) del lote ${lotData.lot}${lotData.expirationDate ? ` (vence ${lotData.expirationDate})` : ""}`,
            },
          ],
        };
      }

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
      <ProductPicker
        products={products}
        search={search}
        onSearchChange={setSearch}
        onSelect={handleSelectProduct}
      />
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
        <Icon name="chevron-left" size={14} />
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
          <Icon name="plus" size={16} />
          Aumentar stock
        </button>
        <button
          className={`mkt-adjust-mode-btn ${mode === "decrease" ? "active decrease" : ""}`}
          onClick={() => handleSwitchMode("decrease")}
          disabled={!canDecrease}
        >
          <Icon name="minus" size={16} />
          Disminuir stock
        </button>
      </div>

      {mode === "increase" && (
        <IncreaseStockForm
          quantity={quantity}
          hasExpiry={hasExpiry}
          expiryDate={expiryDate}
          lotName={lotName}
          saving={saving}
          onDecrementQty={() => setQuantity((q) => Math.max(1, q - 1))}
          onIncrementQty={() => setQuantity((q) => q + 1)}
          onToggleExpiry={() => setHasExpiry((v) => !v)}
          onExpiryChange={setExpiryDate}
          onLotChange={setLotName}
          onCancel={handleBack}
          onSave={handleSave}
        />
      )}

      {mode === "decrease" && (
        <DecreaseStockForm
          lotLabel={selectedLotData ? `${selectedLotData.lot}${selectedLotData.expirationDate ? ` · vence ${formatDate(selectedLotData.expirationDate)}` : ""}` : ""}
          loading={loadingLots}
          lots={availableLots}
          selectedLot={selectedLot}
          decreaseQty={decreaseQty}
          maxDecrease={maxDecrease}
          saving={saving}
          onSelectLot={(key) => { setSelectedLot(key); setDecreaseQty(1); }}
          onDecrementQty={() => setDecreaseQty((q) => Math.max(1, q - 1))}
          onIncrementQty={() => setDecreaseQty((q) => Math.min(maxDecrease, q + 1))}
          onCancel={handleBack}
          onSave={handleSave}
        />
      )}
    </div>
  );
}