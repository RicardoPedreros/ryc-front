"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";
import type { Product } from "@/domain/market/entities/product";

interface PurchaseItemDraft {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string;
  readonly lot: string;
}

export function PurchaseModals() {
  const [activeModal, setActiveModal] = useState<"compra" | null>(null);
  const { data: stores, refetch: refetchStores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");
  const { data: products } = useFetch<readonly Product[]>("/api/market/products");
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

    const itemsRaw = form.get("itemsJson") as string;
    let items: PurchaseItemDraft[] = [];
    try {
      items = itemsRaw ? JSON.parse(itemsRaw) : [];
    } catch {
      items = [];
    }

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);

    await fetch("/api/market/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: form.get("storeId") || null,
        purchaseDate: form.get("purchaseDate") || new Date().toISOString().split("T")[0],
        paymentMethodId: form.get("paymentMethodId") || null,
        total: total || null,
        notes: form.get("notes") || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          expirationDate: item.expirationDate || null,
          lot: item.lot || null,
        })),
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
          <PurchaseFormInner
            stores={stores ?? []}
            paymentMethods={paymentMethods ?? []}
            products={products ?? []}
            onClose={closeModal}
            onSubmit={handleCreatePurchase}
          />
        </div>
      </div>
    </>
  );
}

function PurchaseFormInner({
  stores,
  paymentMethods,
  products,
  onClose,
  onSubmit,
}: {
  readonly stores: readonly Store[];
  readonly paymentMethods: readonly PaymentMethod[];
  readonly products: readonly Product[];
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [items, setItems] = useState<PurchaseItemDraft[]>([]);

  const addItem = (productId: string) => {
    if (items.some((i) => i.productId === productId)) return;
    setItems((prev) => [...prev, { productId, quantity: 1, unitPrice: 0, discount: 0, expirationDate: "", lot: "" }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItemDraft, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const productMap = new Map(products.map((p) => [p.id, p.name]));
  const availableProducts = products.filter((p) => !items.some((i) => i.productId === p.id));

  return (
    <form onSubmit={onSubmit}>
      <div className="mkt-form-group">
        <label className="mkt-form-label">Tienda</label>
        <select name="storeId" className="mkt-form-select" defaultValue="">
          <option value="" disabled>Seleccionar tienda...</option>
          {stores.map((store) => (
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
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mkt-form-group">
        <label className="mkt-form-label">Productos</label>
        {items.length > 0 && (
          <div className="mkt-purchase-form-items">
            {items.map((item, index) => (
              <div key={item.productId} className="mkt-purchase-form-item">
                <div className="mkt-purchase-form-item-header">
                  <span className="mkt-purchase-form-item-name">{productMap.get(item.productId) ?? "—"}</span>
                  <button type="button" className="mkt-purchase-form-item-remove" onClick={() => removeItem(index)}>×</button>
                </div>
                <div className="mkt-purchase-form-item-fields">
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Cant.</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Precio/u</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ""}
                      placeholder="$0.00"
                      onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Desc.</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount || ""}
                      placeholder="$0"
                      onChange={(e) => updateItem(index, "discount", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Lote</label>
                    <input
                      className="mkt-form-input-sm"
                      type="text"
                      value={item.lot}
                      placeholder="—"
                      onChange={(e) => updateItem(index, "lot", e.target.value)}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Vence</label>
                    <input
                      className="mkt-form-input-sm"
                      type="date"
                      value={item.expirationDate}
                      onChange={(e) => updateItem(index, "expirationDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {availableProducts.length > 0 && (
          <select
            className="mkt-form-select"
            defaultValue=""
            onChange={(e) => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }}
          >
            <option value="" disabled>+ Agregar producto...</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
      </div>

      <div className="mkt-form-group">
        <label className="mkt-form-label">Nota (opcional)</label>
        <input name="notes" className="mkt-form-input" type="text" placeholder="ej. Compra semanal" />
      </div>
      <div className="mkt-modal-actions">
        <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
        <button type="submit" className="mkt-btn-submit">Guardar compra</button>
      </div>
    </form>
  );
}
