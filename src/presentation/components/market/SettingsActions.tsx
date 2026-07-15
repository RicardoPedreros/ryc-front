"use client";

import { useCallback, useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { EntityTabs } from "@/presentation/components/market/EntityTabs";
import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import type { Store } from "@/domain/market/entities/store";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";

type ModalType = "producto" | "tienda" | "categoria" | "unidad" | "marca" | null;

export function SettingsActions() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <>
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Crear registros</h2>
        </div>
        <div className="mkt-quick-actions">
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("producto")}>
            <div className="mkt-action-icon accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <div className="mkt-action-body">
              <h3>Producto</h3>
              <p>Agregar un producto nuevo al catálogo</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("tienda")}>
            <div className="mkt-action-icon secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="mkt-action-body">
              <h3>Tienda</h3>
              <p>Registrar una tienda o supermercado</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("categoria")}>
            <div className="mkt-action-icon success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div className="mkt-action-body">
              <h3>Categoría</h3>
              <p>Crear categorías para organizar</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("unidad")}>
            <div className="mkt-action-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div className="mkt-action-body">
              <h3>Unidad</h3>
              <p>Agregar unidades de medida</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("marca")}>
            <div className="mkt-action-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div className="mkt-action-body">
              <h3>Marca</h3>
              <p>Agregar marcas para productos</p>
            </div>
          </button>
        </div>
      </div>

      <EntityTabs />
      <SettingsModalsInline activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </>
  );
}

function SettingsModalsInline({
  activeModal,
  onClose,
}: {
  readonly activeModal: ModalType;
  readonly onClose: () => void;
}) {
  const { refetch: refetchStores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: categories, refetch: refetchCategories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: units, refetch: refetchUnits } = useFetch<readonly Unit[]>("/api/market/units");
  const { data: brands, refetch: refetchBrands } = useFetch<readonly Brand[]>("/api/market/brands");

  const refetchAll = () => {
    refetchStores();
    refetchCategories();
    refetchUnits();
    refetchBrands();
  };

  const closeModal = () => {
    onClose();
    document.body.style.overflow = "";
  };

  const isOpen = activeModal !== null;

  return (
    <div
      className={`mkt-modal-overlay ${isOpen ? "visible" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />

        {activeModal === "producto" && (
          <ProductForm categories={categories ?? []} units={units ?? []} brands={brands ?? []} onClose={closeModal} onCreated={refetchAll} />
        )}
        {activeModal === "tienda" && (
          <StoreForm onClose={closeModal} onCreated={refetchAll} />
        )}
        {activeModal === "categoria" && (
          <CategoryForm onClose={closeModal} onCreated={refetchAll} />
        )}
        {activeModal === "unidad" && (
          <UnitForm onClose={closeModal} onCreated={refetchAll} />
        )}
        {activeModal === "marca" && (
          <BrandForm onClose={closeModal} onCreated={refetchAll} />
        )}
      </div>
    </div>
  );
}

function ProductForm({
  categories,
  units,
  brands,
  onClose,
  onCreated,
}: {
  readonly categories: readonly Category[];
  readonly units: readonly Unit[];
  readonly brands: readonly Brand[];
  readonly onClose: () => void;
  readonly onCreated: () => void;
}) {
  const [barcode, setBarcode] = useState("");

  const handleScan = useCallback((code: string) => {
    setBarcode(code);
  }, []);

  return (
    <>
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
              barcode: barcode || null,
            }),
          });
          onClose();
          onCreated();
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
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Categoría</label>
            <select name="categoryId" className="mkt-form-select" defaultValue="" required>
              <option value="" disabled>Seleccionar...</option>
              {categories.map((cat) => (
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
              {units.map((unit) => (
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
          <div className="mkt-form-input-wrap">
            <input
              name="barcode"
              className="mkt-form-input"
              type="text"
              placeholder="Escanear o escribir..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <BarcodeScanner onScan={handleScan} />
          </div>
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar producto</button>
        </div>
      </form>
    </>
  );
}

function StoreForm({ onClose, onCreated }: { readonly onClose: () => void; readonly onCreated: () => void }) {
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

function CategoryForm({ onClose, onCreated }: { readonly onClose: () => void; readonly onCreated: () => void }) {
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
              color: form.get("color") || null,
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
            <input name="color" className="mkt-form-input" type="text" placeholder="ej. #22C55E" />
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

function UnitForm({ onClose, onCreated }: { readonly onClose: () => void; readonly onCreated: () => void }) {
  return (
    <>
      <h2>Agregar unidad</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          const symbol = form.get("symbol") as string;
          if (!name || !symbol) return;
          await fetch("/api/market/units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, symbol }),
          });
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. Kilogramo" required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Símbolo</label>
          <input name="symbol" className="mkt-form-input" type="text" placeholder="ej. kg" required />
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar unidad</button>
        </div>
      </form>
    </>
  );
}

function BrandForm({ onClose, onCreated }: { readonly onClose: () => void; readonly onCreated: () => void }) {
  return (
    <>
      <h2>Agregar marca</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          await fetch("/api/market/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. La Serenísima" required />
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar marca</button>
        </div>
      </form>
    </>
  );
}
