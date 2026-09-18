"use client";

import { useCallback, useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { EntityTabs } from "@/presentation/components/market/EntityTabs";
import { PendingTemporalProductsSection } from "@/presentation/components/market/PendingTemporalProducts";
import { Icon } from "@/presentation/components/ui/Icon";
import { ProductForm } from "@/presentation/components/market/forms/ProductForm";
import { StoreForm } from "@/presentation/components/market/forms/StoreForm";
import { CategoryForm } from "@/presentation/components/market/forms/CategoryForm";
import { UnitForm } from "@/presentation/components/market/forms/UnitForm";
import { BrandForm } from "@/presentation/components/market/forms/BrandForm";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { Store } from "@/domain/market/entities/store";

type ModalType = "producto" | "tienda" | "categoria" | "unidad" | "marca" | null;

type EntityTab = "productos" | "tiendas" | "categorias" | "unidades" | "marcas";

export function SettingsActions() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeTab, setActiveTab] = useState<EntityTab>("productos");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntityCreated = useCallback((tab: EntityTab) => {
    setActiveTab(tab);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Crear registros</h2>
        </div>
        <div className="mkt-quick-actions">
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("producto")}>
            <div className="mkt-action-icon accent">
              <Icon name="shopping-bag" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Producto</h3>
              <p>Agregar un producto nuevo al catálogo</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("tienda")}>
            <div className="mkt-action-icon secondary">
              <Icon name="home" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Tienda</h3>
              <p>Registrar una tienda o supermercado</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("categoria")}>
            <div className="mkt-action-icon success">
              <Icon name="list" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Categoría</h3>
              <p>Crear categorías para organizar</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("unidad")}>
            <div className="mkt-action-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <Icon name="package" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Unidad</h3>
              <p>Agregar unidades de medida</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("marca")}>
            <div className="mkt-action-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Icon name="tag" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Marca</h3>
              <p>Agregar marcas para productos</p>
            </div>
          </button>
        </div>
      </div>

      <PendingTemporalProductsSection onCompleted={() => handleEntityCreated("productos")} />

      <EntityTabs activeTab={activeTab} onTabChange={setActiveTab} refreshKey={refreshKey} />
      <SettingsModalsInline activeModal={activeModal} onClose={() => setActiveModal(null)} onEntityCreated={handleEntityCreated} />
    </>
  );
}

function SettingsModalsInline({
  activeModal,
  onClose,
  onEntityCreated,
}: {
  readonly activeModal: ModalType;
  readonly onClose: () => void;
  readonly onEntityCreated: (tab: EntityTab) => void;
}) {
  const { refetch: refetchStores } = useFetch<readonly Store[]>("/api/market/stores");
  const { data: categories, refetch: refetchCategories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: units, refetch: refetchUnits } = useFetch<readonly Unit[]>("/api/market/units");
  const { data: brands, refetch: refetchBrands } = useFetch<readonly Brand[]>("/api/market/brands");

  const closeModal = () => {
    onClose();
    document.body.style.overflow = "";
  };

  const handleCreated = (tab: EntityTab) => {
    refetchStores();
    refetchCategories();
    refetchUnits();
    refetchBrands();
    onEntityCreated(tab);
    closeModal();
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
          <ProductForm categories={categories ?? []} units={units ?? []} brands={brands ?? []} onClose={closeModal} onCreated={() => handleCreated("productos")} />
        )}
        {activeModal === "tienda" && (
          <StoreForm onClose={closeModal} onCreated={() => handleCreated("tiendas")} />
        )}
        {activeModal === "categoria" && (
          <CategoryForm onClose={closeModal} onCreated={() => handleCreated("categorias")} />
        )}
        {activeModal === "unidad" && (
          <UnitForm units={units ?? []} onClose={closeModal} onCreated={() => handleCreated("unidades")} />
        )}
        {activeModal === "marca" && (
          <BrandForm onClose={closeModal} onCreated={() => handleCreated("marcas")} />
        )}
      </div>
    </div>
  );
}