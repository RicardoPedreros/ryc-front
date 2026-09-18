"use client";

import { ColorInput } from "./ColorInput";
import { useState } from "react";

interface CategoryFormProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export function CategoryForm({ onClose, onCreated }: CategoryFormProps) {
  const [categoryColor, setCategoryColor] = useState("");
  return (
    <>
      <h2>Agregar categoría</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          await fetch("/api/market/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              icon: form.get("icon") || null,
              color: categoryColor || null,
            }),
          });
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. Lácteos" required />
        </div>
        <div className="mkt-form-row">
          <div className="mkt-form-group">
            <label className="mkt-form-label">Ícono (opcional)</label>
            <input name="icon" className="mkt-form-input" type="text" placeholder="ej. utensils" />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Color (opcional)</label>
            <ColorInput value={categoryColor} onChange={setCategoryColor} />
          </div>
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar categoría</button>
        </div>
      </form>
    </>
  );
}