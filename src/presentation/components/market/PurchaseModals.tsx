"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";

export function PurchaseModals() {
  const [activeModal, setActiveModal] = useState<"compra" | null>(null);
  const { data: stores, refetch: refetchStores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");
  const { refetch: refetchPurchases } = useFetch<readonly Purchase[]>("/api/market/purchases");

  const openModal = () => {
    setActiveModal("compra");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = "";
  };

  const handleCreatePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/market/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: form.get("storeId") || null,
        purchaseDate: form.get("purchaseDate") || new Date().toISOString().split("T")[0],
        paymentMethodId: form.get("paymentMethodId") || null,
        total: form.get("total") ? Number(form.get("total")) : null,
        notes: form.get("notes") || null,
      }),
    });
    closeModal();
    refetchPurchases();
    refetchStores();
  };

  return (
    <>
      <button type="button" className="mkt-fab" onClick={openModal} aria-label="Registrar compra">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div
        className={`mkt-modal-overlay ${activeModal === "compra" ? "visible" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
          <div className="mkt-modal-handle" />
          <h2>Registrar compra</h2>
          <form onSubmit={handleCreatePurchase}>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Tienda</label>
              <select name="storeId" className="mkt-form-select" defaultValue="">
                <option value="" disabled>Seleccionar tienda...</option>
                {(stores ?? []).map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div className="mkt-form-row">
              <div className="mkt-form-group">
                <label className="mkt-form-label">Fecha</label>
                <input name="purchaseDate" className="mkt-form-input" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Método de pago</label>
                <select name="paymentMethodId" className="mkt-form-select" defaultValue="">
                  <option value="" disabled>Seleccionar...</option>
                  {(paymentMethods ?? []).map((pm) => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Total</label>
              <input name="total" className="mkt-form-input" type="number" step="0.01" placeholder="$0.00" />
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Nota (opcional)</label>
              <input name="notes" className="mkt-form-input" type="text" placeholder="ej. Compra semanal" />
            </div>
            <div className="mkt-modal-actions">
              <button type="button" className="mkt-btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="mkt-btn-submit">Guardar compra</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
