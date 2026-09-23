"use client";

import type { Store } from "@/domain/market/entities/store";

interface StoreFormProps {
  readonly initial?: Store | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function StoreForm({ initial, onClose, onSaved }: StoreFormProps) {
  const isEdit = initial != null;
  return (
    <>
      <h2>{isEdit ? "Editar tienda" : "Agregar tienda"}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          await fetch(isEdit ? `/api/market/stores?id=${initial.id}` : "/api/market/stores", {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              address: form.get("address") || null,
              city: form.get("city") || null,
            }),
          });
          onClose();
          onSaved();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. La Anónima" defaultValue={initial?.name ?? ""} required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Dirección (opcional)</label>
          <input name="address" className="mkt-form-input" type="text" placeholder="ej. Av. San Martín 4520" defaultValue={initial?.address ?? ""} />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Ciudad (opcional)</label>
          <input name="city" className="mkt-form-input" type="text" placeholder="ej. Villa Urquiza" defaultValue={initial?.city ?? ""} />
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">{isEdit ? "Guardar cambios" : "Agregar tienda"}</button>
        </div>
      </form>
    </>
  );
}