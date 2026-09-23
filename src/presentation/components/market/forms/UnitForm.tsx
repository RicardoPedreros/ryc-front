"use client";

import { useState } from "react";
import type { Unit } from "@/domain/market/entities/unit";

interface UnitFormProps {
  readonly units: readonly Unit[];
  readonly initial?: Unit | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function UnitForm({ units, initial, onClose, onSaved }: UnitFormProps) {
  const isEdit = initial != null;
  const [parentUnitId, setParentUnitId] = useState(initial?.parentUnitId ?? "");
  return (
    <>
      <h2>{isEdit ? "Editar unidad" : "Agregar unidad"}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          const symbol = form.get("symbol") as string;
          if (!name || !symbol) return;
          await fetch(isEdit ? `/api/market/units?id=${initial.id}` : "/api/market/units", {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              symbol,
              parentUnitId: parentUnitId || null,
              parentMultiplier: parentUnitId ? Number(form.get("parentMultiplier")) || 1 : null,
            }),
          });
          onClose();
          onSaved();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. Kilogramo" defaultValue={initial?.name ?? ""} required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Símbolo</label>
          <input name="symbol" className="mkt-form-input" type="text" placeholder="ej. kg" defaultValue={initial?.symbol ?? ""} required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Unidad de referencia (opcional)</label>
          <select
            className="mkt-form-select"
            value={parentUnitId}
            onChange={(e) => setParentUnitId(e.target.value)}
          >
            <option value="">Sin unidad de referencia</option>
            {[...units]
              .filter((unit) => unit.id !== initial?.id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
              ))}
          </select>
          <span className="mkt-form-hint">ej. &quot;Kilogramo&quot; referencia a &quot;Gramo&quot;. La unidad base se convierte a esta.</span>
        </div>
        {parentUnitId && (
          <div className="mkt-form-group">
            <label className="mkt-form-label">Equivalencia</label>
            <input
              name="parentMultiplier"
              className="mkt-form-input"
              type="number"
              min="0.0001"
              step="0.0001"
              placeholder="ej. 1000"
              defaultValue={initial?.parentMultiplier ?? ""}
              required
            />
            <span className="mkt-form-hint">Cuántas unidades de referencia equivalen a 1 de esta (ej. 1 kg = 1000 g).</span>
          </div>
        )}
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">{isEdit ? "Guardar cambios" : "Agregar unidad"}</button>
        </div>
      </form>
    </>
  );
}