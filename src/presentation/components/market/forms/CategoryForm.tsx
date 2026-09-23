"use client";

import { ColorInput } from "./ColorInput";
import { useState } from "react";
import type { Category } from "@/domain/market/entities/category";

interface CategoryFormProps {
  readonly initial?: Category | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function CategoryForm({ initial, onClose, onSaved }: CategoryFormProps) {
  const isEdit = initial != null;
  const [categoryColor, setCategoryColor] = useState(initial?.color ?? "");
  return (
    <>
      <h2>{isEdit ? "Editar categoría" : "Agregar categoría"}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          await fetch(isEdit ? `/api/market/categories?id=${initial.id}` : "/api/market/categories", {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              icon: form.get("icon") || null,
              color: categoryColor || null,
            }),
          });
          onClose();
          onSaved();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. Lácteos" defaultValue={initial?.name ?? ""} required />
        </div>
        <div className="mkt-form-row">
          <div className="mkt-form-group">
            <label className="mkt-form-label">Ícono (opcional)</label>
            <input name="icon" className="mkt-form-input" type="text" placeholder="ej. utensils" defaultValue={initial?.icon ?? ""} />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Color (opcional)</label>
            <ColorInput value={categoryColor} onChange={setCategoryColor} />
          </div>
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">{isEdit ? "Guardar cambios" : "Agregar categoría"}</button>
        </div>
      </form>
    </>
  );
}