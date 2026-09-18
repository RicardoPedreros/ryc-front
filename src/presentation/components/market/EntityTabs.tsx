"use client";

import { useState, useCallback, useRef } from "react";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BrandChip, buildBrandPathLookup } from "@/presentation/components/market/BrandChip";
import { Icon } from "@/presentation/components/ui/Icon";
import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import { EntityEmpty } from "@/presentation/components/market/EntityEmpty";
import { EntityModal } from "@/presentation/components/market/EntityModal";
import { EntityRow } from "@/presentation/components/market/EntityRow";
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

interface EntityTabsProps {
  readonly activeTab: EntityTab;
  readonly onTabChange: (tab: EntityTab) => void;
  readonly refreshKey: number;
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
  const brandIconMap = new Map((brands ?? []).map((b) => [b.id, b.icon]));
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
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("productos")}>
        <Icon name="plus" size={14} />
        Agregar producto
      </button>

      {editProduct && (
        <EntityModal
          title="Editar producto"
          onClose={closeEdit}
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
        </EntityModal>
      )}
    </>
  );
}

function StoreList({ onAdd }: EntityListProps) {
  const { data: stores, loading, refetch } = useFetch<readonly Store[]>("/api/market/stores");
  const [editStore, setEditStore] = useState<Store | null>(null);

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
            onOpen={() => setEditStore(store)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("tiendas")}>
        <Icon name="plus" size={14} />
        Agregar tienda
      </button>

      {editStore && (
        <EntityModal
          title="Editar tienda"
          onClose={() => setEditStore(null)}
          onSubmit={async (e) => {
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
          }}
        >
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
        </EntityModal>
      )}
    </>
  );
}

function CategoryList({ onAdd }: EntityListProps) {
  const { data: categories, loading, refetch } = useFetch<readonly Category[]>("/api/market/categories");
  const [editCat, setEditCat] = useState<Category | null>(null);

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
            onOpen={() => setEditCat(cat)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("categorias")}>
        <Icon name="plus" size={14} />
        Agregar categoría
      </button>

      {editCat && (
        <EntityModal
          title="Editar categoría"
          onClose={() => setEditCat(null)}
          onSubmit={async (e) => {
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
          }}
        >
          <div className="mkt-form-group">
            <label className="mkt-form-label">Nombre</label>
            <input name="name" className="mkt-form-input" type="text" defaultValue={editCat.name} required />
          </div>
        </EntityModal>
      )}
    </>
  );
}

function UnitList({ onAdd }: EntityListProps) {
  const { data: units, loading, refetch } = useFetch<readonly Unit[]>("/api/market/units");
  const [editUnit, setEditUnit] = useState<Unit | null>(null);

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
            onOpen={() => setEditUnit(unit)}
          />
        ))}
      </div>
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("unidades")}>
        <Icon name="plus" size={14} />
        Agregar unidad
      </button>

      {editUnit && (
        <EntityModal
          title="Editar unidad"
          onClose={() => setEditUnit(null)}
          onSubmit={async (e) => {
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
          }}
        >
          <div className="mkt-form-group">
            <label className="mkt-form-label">Nombre</label>
            <input name="name" className="mkt-form-input" type="text" defaultValue={editUnit.name} required />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Símbolo</label>
            <input name="symbol" className="mkt-form-input" type="text" defaultValue={editUnit.symbol} required />
          </div>
        </EntityModal>
      )}
    </>
  );
}

function BrandList({ onAdd }: EntityListProps) {
  const { data: brands, loading, refetch } = useFetch<readonly Brand[]>("/api/market/brands");
  const [editBrand, setEditBrand] = useState<Brand | null>(null);

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
          onOpen={() => setEditBrand(brand)}
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
      <button type="button" className="mkt-add-entity-btn" onClick={() => onAdd("marcas")}>
        <Icon name="plus" size={14} />
        Agregar marca
      </button>

      {editBrand && (
        <EntityModal
          title="Editar marca"
          onClose={() => setEditBrand(null)}
          onSubmit={async (e) => {
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
          }}
        >
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
        </EntityModal>
      )}
    </>
  );
}

export function EntityTabs({ activeTab, onTabChange, refreshKey }: EntityTabsProps) {
  const handleAdd = (tab: EntityTab) => {
    onTabChange(tab);
  };

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
        {activeTab === "productos" && <ProductList onAdd={handleAdd} />}
        {activeTab === "tiendas" && <StoreList onAdd={handleAdd} />}
        {activeTab === "categorias" && <CategoryList onAdd={handleAdd} />}
        {activeTab === "unidades" && <UnitList onAdd={handleAdd} />}
        {activeTab === "marcas" && <BrandList onAdd={handleAdd} />}
      </div>
    </div>
  );
}