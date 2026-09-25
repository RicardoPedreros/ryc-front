"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BrandChip, buildBrandPathLookup } from "@/presentation/components/market/BrandChip";
import { Icon } from "@/presentation/components/ui/Icon";
import { EntityEmpty } from "@/presentation/components/market/EntityEmpty";
import { EntityRow } from "@/presentation/components/market/EntityRow";
import { ModalShell } from "@/presentation/components/market/ModalShell";
import { ProductForm } from "@/presentation/components/market/forms/ProductForm";
import { StoreForm } from "@/presentation/components/market/forms/StoreForm";
import { CategoryForm } from "@/presentation/components/market/forms/CategoryForm";
import { UnitForm } from "@/presentation/components/market/forms/UnitForm";
import { BrandForm } from "@/presentation/components/market/forms/BrandForm";
import type { Product } from "@/domain/market/entities/product";
import type { Store } from "@/domain/market/entities/store";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";

type EntityTab = "productos" | "tiendas" | "categorias" | "unidades" | "marcas";

const TAB_LIST: readonly { id: EntityTab; label: string }[] = [
  { id: "productos", label: "Productos" },
  { id: "tiendas", label: "Tiendas" },
  { id: "categorias", label: "Categorías" },
  { id: "unidades", label: "Unidades" },
  { id: "marcas", label: "Marcas" },
] as const;

interface EntityTabsProps {
  readonly activeTab: EntityTab;
  readonly onTabChange: (tab: EntityTab) => void;
  readonly refreshKey: number;
}

type ProductModal = { readonly mode: "create" } | { readonly mode: "edit"; readonly item: Product } | null;
type StoreModal = { readonly mode: "create" } | { readonly mode: "edit"; readonly item: Store } | null;
type CategoryModal = { readonly mode: "create" } | { readonly mode: "edit"; readonly item: Category } | null;
type UnitModal = { readonly mode: "create" } | { readonly mode: "edit"; readonly item: Unit } | null;
type BrandModal = { readonly mode: "create" } | { readonly mode: "edit"; readonly item: Brand } | null;

function ProductList() {
  const { data: products, loading, refetch: refetchProducts } = useFetch<readonly Product[]>("/api/market/products");
  const { data: stock, refetch: refetchStock } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: brands, refetch: refetchBrands } = useFetch<readonly Brand[]>("/api/market/brands");
  const { data: units } = useFetch<readonly Unit[]>("/api/market/units");
  const [modal, setModal] = useState<ProductModal>(null);
  const [brandModalName, setBrandModalName] = useState<string | null>(null);

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const brandNameMap = new Map((brands ?? []).map((b) => [b.id, b.name]));
  const brandIconMap = new Map((brands ?? []).map((b) => [b.id, b.icon]));
  const brandPaths = buildBrandPathLookup(brands ?? []);
  const stockMap = new Map((stock ?? []).map((s) => [s.id, s.currentStock]));

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((item: Product) => setModal({ mode: "edit", item }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    refetchProducts();
    refetchStock();
    closeModal();
  }, [refetchProducts, refetchStock, closeModal]);
  const handleOpenBrandForm = useCallback((name: string) => {
    setModal(null);
    setBrandModalName(name);
  }, []);
  const closeBrandModal = useCallback(() => setBrandModalName(null), []);
  const handleBrandSaved = useCallback(() => {
    closeBrandModal();
    refetchBrands();
  }, [closeBrandModal, refetchBrands]);

  if (loading) return <EntityEmpty title="Cargando..." />;

  const baseProducts = (products ?? []).filter((p) => p.parentProductId == null);

  if (baseProducts.length === 0) {
    return <EntityEmpty title="Sin productos" subtitle="Agrega tu primer producto" />;
  }

  return (
    <>
      <div className="mkt-entity-list">
        {baseProducts.map((product) => {
          const qty = stockMap.get(product.id) ?? 0;
          const isLow = qty <= 2;
          const brandName = product.brandId ? brandNameMap.get(product.brandId) ?? null : null;
          const brandIcon = product.brandId ? brandIconMap.get(product.brandId) ?? null : null;
          const brandPath = product.brandId ? brandPaths.byId.get(product.brandId) ?? null : null;
          return (
            <EntityRow
              key={product.id}
              icon="shopping-bag"
              iconStyle={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              name={product.name}
              meta={(
                <>
                  {brandName && <BrandChip brandName={brandName} brandPath={brandPath} brandIcon={brandIcon} />}
                  {brandName && " · "}
                  {catMap.get(product.categoryId) ?? "Sin categoría"}
                  {product.stockQuantity > 1 && ` · x${product.stockQuantity}`}
                  {product.parentProductId != null && <span className="mkt-entity-pack-label">Pack</span>}
                  {!product.notificate && <span className="mkt-badge">Sin notif.</span>}
                </>
              )}
              badge={(
                <span className={`mkt-entity-badge ${isLow ? (qty === 0 ? "danger" : "warning") : ""}`}>
                  {qty} uds
                </span>
              )}
              onOpen={() => openEdit(product)}
            />
          );
        })}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={openCreate}>
        <Icon name="plus" size={14} />
        Agregar producto
      </button>

      <ModalShell open={modal !== null} onClose={closeModal}>
        {modal !== null && (
          <ProductForm
            categories={categories ?? []}
            units={units ?? []}
            brands={brands ?? []}
            initial={modal.mode === "edit" ? modal.item : null}
            onClose={closeModal}
            onSaved={handleSaved}
            onOpenBrandForm={handleOpenBrandForm}
          />
        )}
      </ModalShell>

      <ModalShell open={brandModalName !== null} onClose={closeBrandModal}>
        {brandModalName !== null && (
          <BrandForm
            initialName={brandModalName}
            onClose={closeBrandModal}
            onSaved={handleBrandSaved}
          />
        )}
      </ModalShell>
    </>
  );
}

function StoreList() {
  const { data: stores, loading, refetch } = useFetch<readonly Store[]>("/api/market/stores");
  const [modal, setModal] = useState<StoreModal>(null);

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((item: Store) => setModal({ mode: "edit", item }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    refetch();
    closeModal();
  }, [refetch, closeModal]);

  if (loading) return <EntityEmpty title="Cargando..." />;

  if (!stores || stores.length === 0) {
    return <EntityEmpty title="Sin tiendas" subtitle="Agrega tu primera tienda" />;
  }

  return (
    <>
      <div className="mkt-entity-list">
        {stores.map((store) => (
          <EntityRow
            key={store.id}
            icon="home"
            iconStyle={{ background: "var(--secondary-soft)", color: "var(--secondary)" }}
            name={store.name}
            meta={(
              <>
                {store.address && `${store.address}`}
                {store.city && ` · ${store.city}`}
                {!store.address && !store.city && "Sin dirección"}
              </>
            )}
            onOpen={() => openEdit(store)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={openCreate}>
        <Icon name="plus" size={14} />
        Agregar tienda
      </button>

      <ModalShell open={modal !== null} onClose={closeModal}>
        {modal !== null && (
          <StoreForm
            initial={modal.mode === "edit" ? modal.item : null}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </ModalShell>
    </>
  );
}

function CategoryList() {
  const { data: categories, loading, refetch } = useFetch<readonly Category[]>("/api/market/categories");
  const [modal, setModal] = useState<CategoryModal>(null);

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((item: Category) => setModal({ mode: "edit", item }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    refetch();
    closeModal();
  }, [refetch, closeModal]);

  if (loading) return <EntityEmpty title="Cargando..." />;

  if (!categories || categories.length === 0) {
    return <EntityEmpty title="Sin categorías" subtitle="Agrega categorías para organizar tus productos" />;
  }

  return (
    <>
      <div className="mkt-entity-list">
        {categories.map((cat) => (
          <EntityRow
            key={cat.id}
            icon="list"
            iconStyle={{ background: "var(--success-soft)", color: "var(--success)" }}
            name={cat.name}
            meta={cat.icon}
            onOpen={() => openEdit(cat)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={openCreate}>
        <Icon name="plus" size={14} />
        Agregar categoría
      </button>

      <ModalShell open={modal !== null} onClose={closeModal}>
        {modal !== null && (
          <CategoryForm
            initial={modal.mode === "edit" ? modal.item : null}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </ModalShell>
    </>
  );
}

function UnitList() {
  const { data: units, loading, refetch } = useFetch<readonly Unit[]>("/api/market/units");
  const [modal, setModal] = useState<UnitModal>(null);

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((item: Unit) => setModal({ mode: "edit", item }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    refetch();
    closeModal();
  }, [refetch, closeModal]);

  if (loading) return <EntityEmpty title="Cargando..." />;

  if (!units || units.length === 0) {
    return <EntityEmpty title="Sin unidades" subtitle="Agrega unidades de medida para tus productos" />;
  }

  return (
    <>
      <div className="mkt-entity-list">
        {units.map((unit) => (
          <EntityRow
            key={unit.id}
            icon="package"
            iconStyle={{ background: "var(--warning-soft)", color: "var(--warning)" }}
            name={unit.name}
            meta={unit.symbol}
            onOpen={() => openEdit(unit)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={openCreate}>
        <Icon name="plus" size={14} />
        Agregar unidad
      </button>

      <ModalShell open={modal !== null} onClose={closeModal}>
        {modal !== null && (
          <UnitForm
            units={units ?? []}
            initial={modal.mode === "edit" ? modal.item : null}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </ModalShell>
    </>
  );
}

function BrandList() {
  const { data: brands, loading, refetch } = useFetch<readonly Brand[]>("/api/market/brands");
  const [modal, setModal] = useState<BrandModal>(null);

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((item: Brand) => setModal({ mode: "edit", item }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    refetch();
    closeModal();
  }, [refetch, closeModal]);

  if (loading) return <EntityEmpty title="Cargando..." />;

  if (!brands || brands.length === 0) {
    return <EntityEmpty title="Sin marcas" subtitle="Agrega marcas para tus productos" />;
  }

  const parentBrands = brands.filter((b) => !b.parentBrandId);
  const childrenMap = new Map<string, Brand[]>();
  for (const brand of brands) {
    if (brand.parentBrandId) {
      if (!childrenMap.has(brand.parentBrandId)) childrenMap.set(brand.parentBrandId, []);
      childrenMap.get(brand.parentBrandId)!.push(brand);
    }
  }

  function renderBrand(brand: Brand, depth: number) {
    const children = childrenMap.get(brand.id) ?? [];
    return (
      <div key={brand.id}>
        <EntityRow
          icon="tag"
          iconStyle={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          name={brand.name}
          meta={depth > 0 ? "submarca" : undefined}
          onOpen={() => openEdit(brand)}
          style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
        />
        {children.map((child) => renderBrand(child, depth + 1))}
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {parentBrands.map((brand) => renderBrand(brand, 0))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={openCreate}>
        <Icon name="plus" size={14} />
        Agregar marca
      </button>

      <ModalShell open={modal !== null} onClose={closeModal}>
        {modal !== null && (
          <BrandForm
            initial={modal.mode === "edit" ? modal.item : null}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </ModalShell>
    </>
  );
}

export function EntityTabs({ activeTab, onTabChange, refreshKey }: EntityTabsProps) {
  return (
    <div className="mkt-section">
      <div className="mkt-pill-tabs">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mkt-pill-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mkt-card" key={refreshKey}>
        {activeTab === "productos" && <ProductList />}
        {activeTab === "tiendas" && <StoreList />}
        {activeTab === "categorias" && <CategoryList />}
        {activeTab === "unidades" && <UnitList />}
        {activeTab === "marcas" && <BrandList />}
      </div>
    </div>
  );
}