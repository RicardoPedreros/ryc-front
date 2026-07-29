"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BrandChip, buildBrandPathLookup } from "@/presentation/components/market/BrandChip";
import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import type { Product } from "@/domain/market/entities/product";
import type { Store } from "@/domain/market/entities/store";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";

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
  const { data: products, loading, refetch: refetchProducts } = useFetch<readonly Product[]>("/api/market/products");
  const { data: stock, refetch: refetchStock } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const { data: units } = useFetch<readonly Unit[]>("/api/market/units");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editNotificate, setEditNotificate] = useState(true);
  const [editStockQuantity, setEditStockQuantity] = useState(1);
  const editBarcodeRef = useRef<HTMLInputElement>(null);

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const brandNameMap = new Map((brands ?? []).map((b) => [b.id, b.name]));
  const brandPaths = buildBrandPathLookup(brands ?? []);
  const stockMap = new Map((stock ?? []).map((s) => [s.id, s.currentStock]));

  const openEdit = useCallback((product: Product) => {
    setEditProduct(product);
    setEditNotificate(product.notificate);
    setEditStockQuantity(product.stockQuantity);
  }, []);

  const closeEdit = useCallback(() => {
    setEditProduct(null);
  }, []);

  if (loading) return <div className="mkt-empty-state"><p>Cargando...</p></div>;

  const baseProducts = (products ?? []).filter((p) => p.parentProductId == null);

  if (baseProducts.length === 0) {
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
        {baseProducts.map((product) => {
          const qty = stockMap.get(product.id) ?? 0;
          const isLow = qty <= 2;
          const brandName = product.brandId ? brandNameMap.get(product.brandId) ?? null : null;
          const brandPath = product.brandId ? brandPaths.byId.get(product.brandId) ?? null : null;
          return (
            <div key={product.id} className="mkt-entity-item" role="button" tabIndex={0} onClick={() => openEdit(product)} onKeyDown={(e) => { if (e.key === "Enter") openEdit(product); }}>
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
                    {brandName && <BrandChip brandName={brandName} brandPath={brandPath} />}
                    {brandName && " · "}
                    {catMap.get(product.categoryId) ?? "Sin categoría"}
                    {product.stockQuantity > 1 && ` · x${product.stockQuantity}`}
                    {product.parentProductId != null && <span className="mkt-entity-pack-label">Pack</span>}
                    {!product.notificate && <span className="mkt-badge">Sin notif.</span>}
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

      {editProduct && (
        <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-modal-handle" />
            <h2>Editar producto</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                await fetch(`/api/market/products?id=${editProduct.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: form.get("name"),
                    brandId: form.get("brandId") || null,
                    categoryId: form.get("categoryId"),
                    unitId: form.get("unitId"),
                    presentationQuantity: form.get("presentationQuantity") ? Number(form.get("presentationQuantity")) : null,
                    stockQuantity: editStockQuantity,
                    notificate: editNotificate,
                    barcode: form.get("barcode") || null,
                  }),
                });
                setEditProduct(null);
                refetchProducts();
                refetchStock();
              }}
            >
              <div className="mkt-form-group">
                <label className="mkt-form-label">Nombre</label>
                <input name="name" className="mkt-form-input" type="text" defaultValue={editProduct.name} required />
              </div>
              <div className="mkt-form-row">
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Marca</label>
                  <select name="brandId" className="mkt-form-select" defaultValue={editProduct.brandId ?? ""}>
                    <option value="">Sin marca</option>
                    {(brands ?? []).filter((b) => !b.parentBrandId).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Categoría</label>
                  <select name="categoryId" className="mkt-form-select" defaultValue={editProduct.categoryId} required>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mkt-form-row">
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Unidad</label>
                  <select name="unitId" className="mkt-form-select" defaultValue={editProduct.unitId} required>
                    {(units ?? []).map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Presentación</label>
                  <input name="presentationQuantity" className="mkt-form-input" type="number" step="0.01" defaultValue={editProduct.presentationQuantity ?? ""} />
                </div>
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Código de barras</label>
                <div className="mkt-form-input-wrap">
                  <input ref={editBarcodeRef} name="barcode" className="mkt-form-input" type="text" defaultValue={editProduct.barcode ?? ""} />
                  <BarcodeScanner onScan={(code) => { if (editBarcodeRef.current) editBarcodeRef.current.value = code; }} />
                </div>
              </div>
              {editProduct.parentProductId != null && (
                <div className="mkt-form-row">
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Stock por pack</label>
                    <input className="mkt-form-input" type="number" min="1" step="1" value={editStockQuantity} onChange={(e) => setEditStockQuantity(Number(e.target.value))} />
                  </div>
                </div>
              )}
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                <Switch checked={editNotificate} onChange={(e) => setEditNotificate(e.target.checked)} size="small" />
                <span style={{ fontSize: "0.8125rem", color: "var(--fg)" }}>Notificar si el stock está bajo o por vencer</span>
              </Stack>
              <div className="mkt-modal-actions">
                <button type="button" className="mkt-btn-cancel" onClick={closeEdit}>Cancelar</button>
                <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StoreList({ onAdd }: EntityListProps) {
  const { data: stores, loading, refetch } = useFetch<readonly Store[]>("/api/market/stores");
  const [editStore, setEditStore] = useState<Store | null>(null);

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
          <div key={store.id} className="mkt-entity-item" role="button" tabIndex={0} onClick={() => setEditStore(store)} onKeyDown={(e) => { if (e.key === "Enter") setEditStore(store); }}>
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

      {editStore && (
        <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) setEditStore(null); }}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-modal-handle" />
            <h2>Editar tienda</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await fetch(`/api/market/stores?id=${editStore.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  address: form.get("address") || null,
                  city: form.get("city") || null,
                }),
              });
              setEditStore(null);
              refetch();
            }}>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Nombre</label>
                <input name="name" className="mkt-form-input" type="text" defaultValue={editStore.name} required />
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Dirección (opcional)</label>
                <input name="address" className="mkt-form-input" type="text" defaultValue={editStore.address ?? ""} />
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Ciudad (opcional)</label>
                <input name="city" className="mkt-form-input" type="text" defaultValue={editStore.city ?? ""} />
              </div>
              <div className="mkt-modal-actions">
                <button type="button" className="mkt-btn-cancel" onClick={() => setEditStore(null)}>Cancelar</button>
                <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryList({ onAdd }: EntityListProps) {
  const { data: categories, loading, refetch } = useFetch<readonly Category[]>("/api/market/categories");
  const [editCat, setEditCat] = useState<Category | null>(null);

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
          <div key={cat.id} className="mkt-entity-item" role="button" tabIndex={0} onClick={() => setEditCat(cat)} onKeyDown={(e) => { if (e.key === "Enter") setEditCat(cat); }}>
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

      {editCat && (
        <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) setEditCat(null); }}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-modal-handle" />
            <h2>Editar categoría</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await fetch(`/api/market/categories?id=${editCat.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                }),
              });
              setEditCat(null);
              refetch();
            }}>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Nombre</label>
                <input name="name" className="mkt-form-input" type="text" defaultValue={editCat.name} required />
              </div>
              <div className="mkt-modal-actions">
                <button type="button" className="mkt-btn-cancel" onClick={() => setEditCat(null)}>Cancelar</button>
                <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function UnitList({ onAdd }: EntityListProps) {
  const { data: units, loading, refetch } = useFetch<readonly Unit[]>("/api/market/units");
  const [editUnit, setEditUnit] = useState<Unit | null>(null);

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
          <div key={unit.id} className="mkt-entity-item" role="button" tabIndex={0} onClick={() => setEditUnit(unit)} onKeyDown={(e) => { if (e.key === "Enter") setEditUnit(unit); }}>
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

      {editUnit && (
        <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) setEditUnit(null); }}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-modal-handle" />
            <h2>Editar unidad</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await fetch(`/api/market/units?id=${editUnit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  symbol: form.get("symbol"),
                }),
              });
              setEditUnit(null);
              refetch();
            }}>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Nombre</label>
                <input name="name" className="mkt-form-input" type="text" defaultValue={editUnit.name} required />
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Símbolo</label>
                <input name="symbol" className="mkt-form-input" type="text" defaultValue={editUnit.symbol} required />
              </div>
              <div className="mkt-modal-actions">
                <button type="button" className="mkt-btn-cancel" onClick={() => setEditUnit(null)}>Cancelar</button>
                <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BrandList({ onAdd }: EntityListProps) {
  const { data: brands, loading, refetch } = useFetch<readonly Brand[]>("/api/market/brands");
  const [editBrand, setEditBrand] = useState<Brand | null>(null);

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
        <div className="mkt-entity-item" style={{ paddingLeft: `${1 + depth * 1.5}rem` }} role="button" tabIndex={0} onClick={() => setEditBrand(brand)} onKeyDown={(e) => { if (e.key === "Enter") setEditBrand(brand); }}>
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

      {editBrand && (
        <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) setEditBrand(null); }}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-modal-handle" />
            <h2>Editar marca</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await fetch(`/api/market/brands?id=${editBrand.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  parentBrandId: form.get("parentBrandId") || null,
                }),
              });
              setEditBrand(null);
              refetch();
            }}>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Nombre</label>
                <input name="name" className="mkt-form-input" type="text" defaultValue={editBrand.name} required />
              </div>
              <div className="mkt-form-group">
                <label className="mkt-form-label">Marca padre (opcional)</label>
                <select name="parentBrandId" className="mkt-form-select" defaultValue={editBrand.parentBrandId ?? ""}>
                  <option value="">Sin marca padre</option>
                  {(brands ?? []).filter((b) => !b.parentBrandId).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="mkt-modal-actions">
                <button type="button" className="mkt-btn-cancel" onClick={() => setEditBrand(null)}>Cancelar</button>
                <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
