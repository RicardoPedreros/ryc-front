"use client";

import { Icon } from "@/presentation/components/ui/Icon";
import { expiryBadgeClass, expiryLabel } from "./stock-utils";

interface IncreaseStockFormProps {
  readonly quantity: number;
  readonly hasExpiry: boolean;
  readonly expiryDate: string;
  readonly lotName: string;
  readonly saving: boolean;
  readonly onDecrementQty: () => void;
  readonly onIncrementQty: () => void;
  readonly onToggleExpiry: () => void;
  readonly onExpiryChange: (date: string) => void;
  readonly onLotChange: (name: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export function IncreaseStockForm({
  quantity,
  hasExpiry,
  expiryDate,
  lotName,
  saving,
  onDecrementQty,
  onIncrementQty,
  onToggleExpiry,
  onExpiryChange,
  onLotChange,
  onCancel,
  onSave,
}: IncreaseStockFormProps) {
  return (
    <div className="mkt-adjust-form">
      <div className="mkt-adjust-qty-row">
        <span className="mkt-adjust-qty-label">Unidades a agregar</span>
        <div className="mkt-adjust-stepper">
          <button
            className="mkt-adjust-step-btn"
            onClick={onDecrementQty}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="mkt-adjust-qty-value">{quantity}</span>
          <button
            className="mkt-adjust-step-btn"
            onClick={onIncrementQty}
          >
            +
          </button>
        </div>
      </div>

      <div className="mkt-adjust-expiry-row">
        <button
          className={`mkt-adjust-expiry-toggle ${hasExpiry ? "active" : ""}`}
          onClick={onToggleExpiry}
        >
          <span className="mkt-adjust-expiry-switch">
            <span className="mkt-adjust-expiry-switch-thumb" />
          </span>
          <Icon name="calendar" size={14} />
          <span>Tiene fecha de vencimiento</span>
        </button>

        {hasExpiry && (
          <div className="mkt-adjust-expiry-fields">
            <input
              type="date"
              className="mkt-adjust-date-input"
              value={expiryDate}
              onChange={(e) => onExpiryChange(e.target.value)}
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
          onChange={(e) => onLotChange(e.target.value)}
        />
      </div>

      <div className="mkt-adjust-save-row">
        <button className="mkt-btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="mkt-btn-primary"
          onClick={onSave}
          disabled={saving || quantity <= 0}
        >
          {saving ? "Guardando..." : `Agregar ${quantity} unidades`}
        </button>
      </div>
    </div>
  );
}