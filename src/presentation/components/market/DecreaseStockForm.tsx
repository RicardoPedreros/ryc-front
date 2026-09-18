"use client";

import { expiryBadgeClass, expiryLabel, formatDate, lotKey } from "./stock-utils";
import type { ProductLot } from "@/domain/market/entities/inventory-movement";

interface DecreaseStockFormProps {
  readonly lotLabel: string;
  readonly loading: boolean;
  readonly lots: readonly ProductLot[];
  readonly selectedLot: string | null;
  readonly decreaseQty: number;
  readonly maxDecrease: number;
  readonly saving: boolean;
  readonly onSelectLot: (lotKey: string) => void;
  readonly onDecrementQty: () => void;
  readonly onIncrementQty: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export function DecreaseStockForm({
  lotLabel,
  loading,
  lots,
  selectedLot,
  decreaseQty,
  maxDecrease,
  saving,
  onSelectLot,
  onDecrementQty,
  onIncrementQty,
  onCancel,
  onSave,
}: DecreaseStockFormProps) {
  const selectedLotData = lots.find((l) => lotKey(l) === selectedLot) ?? null;

  if (loading) {
    return (
      <div className="mkt-empty-state">
        <p>Cargando lotes...</p>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>No hay lotes disponibles</p>
        <p className="mkt-empty-sub">Primero agregá stock con el modo aumentar</p>
      </div>
    );
  }

  return (
    <div className="mkt-adjust-form">
      <div className="mkt-adjust-lots-label">
        Selecciona el lote del que deseas retirar:
      </div>

      <div className="mkt-adjust-lot-list">
        {lots.map((lot) => {
          const key = lotKey(lot);
          const isSelected = selectedLot === key;
          const lotExpiryClass = lot.daysUntilExpiry !== null && lot.expirationDate ? expiryBadgeClass(lot.expirationDate) : "";
          return (
            <div
              key={key}
              className={`mkt-adjust-lot-item ${isSelected ? "selected" : ""} ${lot.daysUntilExpiry !== null && lot.daysUntilExpiry <= 0 ? "expired" : ""}`}
              onClick={() => onSelectLot(key)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectLot(key); } }}
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

      {selectedLot && selectedLotData && (
        <div className="mkt-adjust-decrease-form">
          <div className="mkt-adjust-qty-row">
            <span className="mkt-adjust-qty-label">
              Unidades a retirar de <strong>{lotLabel}</strong>
            </span>
            <div className="mkt-adjust-stepper">
              <button
                className="mkt-adjust-step-btn"
                onClick={onDecrementQty}
                disabled={decreaseQty <= 1}
              >
                −
              </button>
              <span className="mkt-adjust-qty-value">{decreaseQty}</span>
              <button
                className="mkt-adjust-step-btn"
                onClick={onIncrementQty}
                disabled={decreaseQty >= maxDecrease}
              >
                +
              </button>
            </div>
            <span className="mkt-adjust-max-hint">Máx: {maxDecrease} uds</span>
          </div>

          <div className="mkt-adjust-save-row">
            <button className="mkt-btn-ghost" onClick={onCancel}>
              Cancelar
            </button>
            <button
              className="mkt-btn-primary danger"
              onClick={onSave}
              disabled={saving || decreaseQty <= 0}
            >
              {saving ? "Guardando..." : `Retirar ${decreaseQty} unidades`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}