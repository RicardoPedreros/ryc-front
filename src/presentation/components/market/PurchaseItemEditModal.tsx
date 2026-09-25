"use client";

import { useState } from "react";
import { ModalShell } from "@/presentation/components/market/ModalShell";
import type { PurchaseItemDetail } from "@/domain/market/repositories/purchase-repository";

interface PurchaseItemEditModalProps {
  readonly item: PurchaseItemDetail;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function PurchaseItemEditModal({ item, onClose, onSaved }: PurchaseItemEditModalProps) {
  const [quantity, setQuantity] = useState<string>(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState<string>(item.unitPrice != null ? String(item.unitPrice) : "");
  const [discount, setDiscount] = useState<string>(item.discount != null ? String(item.discount) : "");
  const [lot, setLot] = useState<string>(item.lot ?? "");
  const [expirationDate, setExpirationDate] = useState<string>(item.expirationDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/purchases/items?id=${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(quantity),
          unitPrice: unitPrice ? Number(unitPrice) : null,
          discount: discount ? Number(discount) : null,
          expirationDate: expirationDate || null,
          lot: lot || null,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open onClose={saving ? () => undefined : onClose}>
      <h2>Editar producto</h2>

      <div className="mkt-purchase-form-item">
        <div className="mkt-purchase-form-item-header">
          <span className="mkt-purchase-form-item-name">
            {item.productName}
            {item.productId == null && <span className="mkt-pending-badge">Pendiente</span>}
          </span>
        </div>
        <div className="mkt-purchase-form-item-fields">
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Cant.</label>
            <input
              className="mkt-form-input-sm"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Precio/u</label>
            <input
              className="mkt-form-input-sm"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              placeholder="$0.00"
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Desc.</label>
            <input
              className="mkt-form-input-sm"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              placeholder="$0"
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Lote</label>
            <input
              className="mkt-form-input-sm"
              type="text"
              value={lot}
              placeholder="—"
              onChange={(e) => setLot(e.target.value)}
            />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Vence</label>
            <input
              className="mkt-form-input-sm"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="mkt-form-error" role="alert">{error}</p>}

      <div className="mkt-modal-actions">
        <button type="button" className="mkt-btn-cancel" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button type="button" className="mkt-btn-submit" onClick={handleSave} disabled={saving || !quantity || Number(quantity) <= 0}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </ModalShell>
  );
}