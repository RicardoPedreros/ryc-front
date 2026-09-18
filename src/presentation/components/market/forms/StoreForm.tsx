"use client";

interface StoreFormProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export function StoreForm({ onClose, onCreated }: StoreFormProps) {
  return (
    <>
      <h2>Agregar tienda</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          await fetch("/api/market/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              address: form.get("address") || null,
              city: form.get("city") || null,
            }),
          });
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. La Anónima" required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Dirección (opcional)</label>
          <input name="address" className="mkt-form-input" type="text" placeholder="ej. Av. San Martín 4520" />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Ciudad (opcional)</label>
          <input name="city" className="mkt-form-input" type="text" placeholder="ej. Villa Urquiza" />
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar tienda</button>
        </div>
      </form>
    </>
  );
}