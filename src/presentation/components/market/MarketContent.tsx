"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { QuickActions } from "./QuickActions";
import { ShoppingList } from "./ShoppingList";
import { EntityTabs } from "./EntityTabs";
import type { Store } from "@/domain/market/entities/store";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";

type ModalType = "compra" | "producto" | "tienda" | "categoria" | null;

export function MarketContent() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const { data: stores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: units } = useFetch<readonly Unit[]>("/api/market/units");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const { data: paymentMethods } = useFetch<readonly PaymentMethod[]>("/api/market/payment-methods");

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = "";
  };

  return (
    <>
      <QuickActions onOpenModal={openModal} />
      <ShoppingList />
      <EntityTabs />

      <ModalOverlay active={activeModal === "compra"} onClose={closeModal}>
        <h2>Registrar compra</h2>
        <form
          onSubmit={async (e) => {
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
            window.location.reload();
          }}
        >
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
              <input
                name="purchaseDate"
                className="mkt-form-input"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
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
      </ModalOverlay>

      <ModalOverlay active={activeModal === "producto"} onClose={closeModal}>
        <h2>Agregar producto</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const categoryId = form.get("categoryId") as string;
            const unitId = form.get("unitId") as string;
            if (!categoryId || !unitId) return;
            await fetch("/api/market/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.get("name"),
                brandId: form.get("brandId") || null,
                categoryId,
                unitId,
                presentationQuantity: form.get("presentationQuantity") ? Number(form.get("presentationQuantity")) : null,
                barcode: form.get("barcode") || null,
              }),
            });
            closeModal();
            window.location.reload();
          }}
        >
          <div className="mkt-form-group">
            <label className="mkt-form-label">Nombre</label>
            <input name="name" className="mkt-form-input" type="text" placeholder="ej. Leche entera" required />
          </div>
          <div className="mkt-form-row">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Marca (opcional)</label>
              <select name="brandId" className="mkt-form-select" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {(brands ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Categoría</label>
              <select name="categoryId" className="mkt-form-select" defaultValue="" required>
                <option value="" disabled>Seleccionar...</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mkt-form-row">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Unidad</label>
              <select name="unitId" className="mkt-form-select" defaultValue="" required>
                <option value="" disabled>Seleccionar...</option>
                {(units ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Presentación</label>
              <input name="presentationQuantity" className="mkt-form-input" type="number" step="0.01" placeholder="ej. 1, 0.5" />
            </div>
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Código de barras (opcional)</label>
            <input name="barcode" className="mkt-form-input" type="text" placeholder="Escanear o escribir..." />
          </div>
          <div className="mkt-modal-actions">
            <button type="button" className="mkt-btn-cancel" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="mkt-btn-submit">Agregar producto</button>
          </div>
        </form>
      </ModalOverlay>

      <ModalOverlay active={activeModal === "tienda"} onClose={closeModal}>
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
            closeModal();
            window.location.reload();
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
            <button type="button" className="mkt-btn-cancel" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="mkt-btn-submit">Agregar tienda</button>
          </div>
        </form>
      </ModalOverlay>
    </>
  );
}

function ModalOverlay({
  active,
  onClose,
  children,
}: {
  active: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!active) return null;
  return (
    <div
      className="mkt-modal-overlay visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />
        {children}
      </div>
    </div>
  );
}
