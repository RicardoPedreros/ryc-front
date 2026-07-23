"use client";

import { useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
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

interface EntityListProps {
  readonly onAdd: (tab: EntityTab) => void;
}

function ProductList({ onAdd }: EntityListProps) {
  const { data: products, loading } = useFetch<readonly Product[]>("/api/market/products");
  const { data: stock } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const brandMap = new Map((brands ?? []).map((b) => [b.id, b.name]));
  const stockMap = new Map((stock ?? []).map((s) => [s.id, s.currentStock]));

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  if (!products || products.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>Sin productos</p>
        <p className="mkt-empty-sub">Agregá tu primer producto</p>
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {products.map((product) => {
          const qty = stockMap.get(product.id) ?? 0;
          const isLow = qty <= 2;
          const brandName = product.brandId ? brandMap.get(product.brandId) ?? null : null;
          return (
            <div key={product.id} className="mkt-entity-item">
              <div className="mkt-entity-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <div className="mkt-entity-body">
                <span className="mkt-entity-name">{product.name}</span>
                <span className="mkt-entity-meta">
                  {brandName && `${brandName} · `}
                  {catMap.get(product.categoryId) ?? "Sin categoría"}
                </span>
              </div>
              <span className={`mkt-entity-badge ${isLow ? (qty === 0 ? "danger" : "warning") : ""}`}>
                {qty} uds
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("productos")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar producto
      </button>
    </>
  );
}

function StoreList({ onAdd }: EntityListProps) {
  const { data: stores, loading } = useFetch<readonly Store[]>("/api/market/stores");

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  if (!stores || stores.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>Sin tiendas</p>
        <p className="mkt-empty-sub">Agregá tu primera tienda</p>
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {stores.map((store) => (
          <div key={store.id} className="mkt-entity-item">
            <div className="mkt-entity-icon" style={{ background: "var(--secondary-soft)", color: "var(--secondary)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="mkt-entity-body">
              <span className="mkt-entity-name">{store.name}</span>
              <span className="mkt-entity-meta">
                {store.address && `${store.address}`}
                {store.city && ` · ${store.city}`}
                {!store.address && !store.city && "Sin dirección"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("tiendas")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar tienda
      </button>
    </>
  );
}

function CategoryList({ onAdd }: EntityListProps) {
  const { data: categories, loading } = useFetch<readonly Category[]>("/api/market/categories");

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  if (!categories || categories.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>Sin categorías</p>
        <p className="mkt-empty-sub">Agregá categorías para organizar tus productos</p>
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {categories.map((cat) => (
          <div key={cat.id} className="mkt-entity-item">
            <div className="mkt-entity-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div className="mkt-entity-body">
              <span className="mkt-entity-name">{cat.name}</span>
              {cat.icon && <span className="mkt-entity-meta">{cat.icon}</span>}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("categorias")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar categoría
      </button>
    </>
  );
}

function UnitList({ onAdd }: EntityListProps) {
  const { data: units, loading } = useFetch<readonly Unit[]>("/api/market/units");

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  if (!units || units.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>Sin unidades</p>
        <p className="mkt-empty-sub">Agregá unidades de medida para tus productos</p>
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {units.map((unit) => (
          <div key={unit.id} className="mkt-entity-item">
            <div className="mkt-entity-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div className="mkt-entity-body">
              <span className="mkt-entity-name">{unit.name}</span>
              {unit.symbol && <span className="mkt-entity-meta">{unit.symbol}</span>}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("unidades")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar unidad
      </button>
    </>
  );
}

function BrandList({ onAdd }: EntityListProps) {
  const { data: brands, loading } = useFetch<readonly Brand[]>("/api/market/brands");

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  if (!brands || brands.length === 0) {
    return (
      <div className="mkt-empty-state">
        <p>Sin marcas</p>
        <p className="mkt-empty-sub">Agregá marcas para tus productos</p>
      </div>
    );
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
        <div className="mkt-entity-item" style={{ paddingLeft: `${1 + depth * 1.5}rem` }}>
          <div className="mkt-entity-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div className="mkt-entity-body">
            <span className="mkt-entity-name">{brand.name}</span>
            {depth > 0 && <span className="mkt-entity-meta">submarca</span>}
          </div>
        </div>
        {children.map((child) => renderBrand(child, depth + 1))}
      </div>
    );
  }

  return (
    <>
      <div className="mkt-entity-list">
        {parentBrands.map((brand) => renderBrand(brand, 0))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("marcas")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar marca
      </button>
    </>
  );
}

export function EntityTabs() {
  const [activeTab, setActiveTab] = useState<EntityTab>("productos");

  const handleAdd = (tab: EntityTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="mkt-section">
      <div className="mkt-pill-tabs">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mkt-pill-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mkt-card">
        {activeTab === "productos" && <ProductList onAdd={handleAdd} />}
        {activeTab === "tiendas" && <StoreList onAdd={handleAdd} />}
        {activeTab === "categorias" && <CategoryList onAdd={handleAdd} />}
        {activeTab === "unidades" && <UnitList onAdd={handleAdd} />}
        {activeTab === "marcas" && <BrandList onAdd={handleAdd} />}
      </div>
    </div>
  );
}
