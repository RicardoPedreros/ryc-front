"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";
import { buildBrandPathLookup } from "./BrandChip";
import type { Brand } from "@/domain/market/entities/brand";
import { Icon } from "@/presentation/components/ui/Icon";
import { PurchaseItemRow } from "./PurchaseItemRow";
import { PurchaseItemSearch } from "./PurchaseItemSearch";
import { createPurchaseItem, isTemporal, itemKey } from "./purchase-draft";
import type { PurchaseItemDraft } from "./purchase-draft";

export function PurchaseModals() {
  const [activeModal, setActiveModal] = useState<"compra" | null>(null);
  const { data: stores, refetch: refetchStores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");
  const { data: products } = useFetch<readonly ProductSearchResult[]>("/api/market/products?details=true");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const { refetch: refetchPurchases } = useFetch<readonly Purchase[]>("/api/market/purchases");

  const brandPathLookup = buildBrandPathLookup(brands ?? []);
  const brandIcons = new Map<string, string | null>((brands ?? []).map((b) => [b.id, b.icon]));

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

    await fetch("/api/market/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: form.get("storeId") || null,
        purchaseDate: form.get("purchaseDate") || new Date().toISOString().split("T")[0],
        paymentMethodId: form.get("paymentMethodId") || null,
        notes: form.get("notes") || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          expirationDate: item.expirationDate || null,
          lot: item.lot || null,
          temporalProductName: item.temporalProductName || null,
          temporalBarcode: item.temporalBarcode || null,
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
        <Icon name="plus" size={20} />
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
            brandPathLookup={brandPathLookup}
            brandIcons={brandIcons}
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
  brandPathLookup,
  brandIcons,
  onClose,
  onSubmit,
}: {
  readonly stores: readonly Store[];
  readonly paymentMethods: readonly PaymentMethod[];
  readonly products: readonly ProductSearchResult[];
  readonly brandPathLookup: ReturnType<typeof buildBrandPathLookup>;
  readonly brandIcons: ReadonlyMap<string, string | null>;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [items, setItems] = useState<PurchaseItemDraft[]>([]);

  const isProductAdded = (productId: string) => items.some((i) => i.productId === productId);

  const isTemporalAdded = (name: string | null, barcode: string | null) =>
    items.some((i) => isTemporal(i) && i.temporalProductName === name && i.temporalBarcode === barcode);

  const addProduct = (productId: string) => {
    if (isProductAdded(productId)) return;
    setItems((prev) => [...prev, createPurchaseItem({ productId })]);
  };

  const addTemporalItem = (name: string | null, barcode: string | null) => {
    if (isTemporalAdded(name, barcode)) return;
    setItems((prev) => [...prev, createPurchaseItem({ temporalProductName: name, temporalBarcode: barcode })]);
  };

  const updateItem = (index: number, field: keyof PurchaseItemDraft, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

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
              <PurchaseItemRow
                key={itemKey(item)}
                item={item}
                index={index}
                productMap={productMap}
                brandPathLookup={brandPathLookup}
                brandIcons={brandIcons}
                onChange={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}

        <PurchaseItemSearch
          brandPathLookup={brandPathLookup}
          brandIcons={brandIcons}
          onAddProduct={addProduct}
          onAddTemporal={addTemporalItem}
          isProductAdded={isProductAdded}
          isTemporalAdded={isTemporalAdded}
        />

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