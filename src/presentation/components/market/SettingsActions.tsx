"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import { EntityTabs } from "@/presentation/components/market/EntityTabs";
import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import type { Store } from "@/domain/market/entities/store";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";

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
  const [packBarcode, setPackBarcode] = useState("");
  const [isPack, setIsPack] = useState(false);
  const [customAlarms, setCustomAlarms] = useState(false);
  const [notificate, setNotificate] = useState(true);
  const [baseProduct, setBaseProduct] = useState<ProductSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchMode, setSearchMode] = useState<"nombre" | "barcode">("nombre");
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback((q: string) => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    if (q.length < 2) { setSearchResults([]); setShowResults(false); setSearching(false); return; }
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;
    setSearching(true);
    fetch(`/api/market/products?q=${encodeURIComponent(q)}&details=true`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: readonly ProductSearchResult[]) => {
        setSearchResults(data ?? []);
        setShowResults(true);
        setSearching(false);
      })
      .catch(() => { if (!ctrl.signal.aborted) setSearching(false); });
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 300);
  }, [doSearch]);

  const selectBaseProduct = useCallback((p: ProductSearchResult) => {
    setBaseProduct(p);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setBarcode("");
    setPackBarcode("");
    setIsPack(true);
  }, []);

  const handlePackBarcodeScan = useCallback(async (code: string) => {
    setSearchQuery(code);
    try {
      const res = await fetch(`/api/market/products?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) return;
      const data: ProductSearchResult | null = await res.json();
      if (data) selectBaseProduct(data);
    } catch { /* ignore */ }
  }, [selectBaseProduct]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleScan = useCallback((code: string) => {
    setBarcode(code);
  }, []);

  const parentBrands = brands.filter((b) => !b.parentBrandId);
  const childrenMap = new Map<string, Brand[]>();
  for (const b of brands) {
    if (b.parentBrandId) {
      if (!childrenMap.has(b.parentBrandId)) childrenMap.set(b.parentBrandId, []);
      childrenMap.get(b.parentBrandId)!.push(b);
    }
  }

  const brandOptions: { readonly brand: Brand; readonly depth: number }[] = [];
  function collectBrandOptions(parentId: string | null, depth: number) {
    const list = parentId === null ? parentBrands : (childrenMap.get(parentId) ?? []);
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    for (const b of sorted) {
      brandOptions.push({ brand: b, depth });
      collectBrandOptions(b.id, depth + 1);
    }
  }
  collectBrandOptions(null, 0);

  return (
    <>
      <h2>{isPack && baseProduct ? "Agregar pack" : "Agregar producto"}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          if (baseProduct) {
            await fetch("/api/market/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: baseProduct.name,
                brandId: baseProduct.brandId,
                parentProductId: baseProduct.id,
                categoryId: baseProduct.categoryId,
                unitId: baseProduct.unitId,
                presentationQuantity: baseProduct.presentationQuantity,
                stockQuantity: Number(form.get("stockQuantity")) || 2,
                minStock: baseProduct.minStock,
                minDays: baseProduct.minDays,
                barcode: packBarcode || null,
              }),
            });
            onClose();
            onCreated();
            return;
          }
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
              stockQuantity: 1,
              minStock: customAlarms ? Number(form.get("minStock")) || 1 : 1,
              minDays: customAlarms ? Number(form.get("minDays")) || 7 : 7,
              notificate,
              barcode: barcode || null,
            }),
          });
          onClose();
          onCreated();
        }}
      >
        {isPack && (
          <>
            {!baseProduct ? (
              <div className="mkt-pack-search">
                <div className="mkt-pack-toggle-row">
                  <label className="mkt-pack-toggle-label">
                    <input type="checkbox" checked={isPack} onChange={(e) => { if (!e.target.checked) setBaseProduct(null); setIsPack(e.target.checked); }} />
                    <span className="mkt-pack-toggle-control">
                      <span className="mkt-pack-toggle-thumb" />
                    </span>
                    <span className="mkt-pack-toggle-text">Contiene varias unidades</span>
                  </label>
                </div>
                <div className="mkt-pack-search-hint">
                  Buscá el producto base para heredar sus datos (marca, categoría, presentación).
                  Solo vas a poder indicar cuántas unidades trae.
                </div>
                <div className="mkt-form-group">
                  <div className="mkt-search-mode-tabs">
                    <button
                      type="button"
                      className={`mkt-search-mode-tab ${searchMode === "nombre" ? "active" : ""}`}
                      onClick={() => setSearchMode("nombre")}
                    >Buscar por nombre</button>
                    <button
                      type="button"
                      className={`mkt-search-mode-tab ${searchMode === "barcode" ? "active" : ""}`}
                      onClick={() => setSearchMode("barcode")}
                    >Código de barras</button>
                  </div>
                  {searchMode === "nombre" ? (
                    <div className="mkt-pack-search-input-wrap" ref={searchRef}>
                      <input
                        className="mkt-form-input"
                        type="text"
                        placeholder="Escribí para buscar productos..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                      />
                      {searching && <span className="mkt-search-spinner" />}
                      {showResults && searchResults.length > 0 && (
                        <div className="mkt-pack-search-dropdown">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="mkt-pack-search-item"
                              onClick={() => selectBaseProduct(p)}
                            >
                              <span className="mkt-pack-search-item-name">{p.name}</span>
                              <span className="mkt-pack-search-item-meta">
                                {p.brandName ? `${p.brandName} · ` : ""}
                                {p.presentationQuantity != null ? `${Number(p.presentationQuantity)}` : ""}
                                {p.unitSymbol ?? ""}
                                {p.categoryName ? ` · ${p.categoryName}` : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                        <div className="mkt-pack-search-dropdown">
                          <div className="mkt-pack-search-empty">No se encontraron productos</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mkt-form-input-wrap">
                      <input
                        className="mkt-form-input"
                        type="text"
                        placeholder="Escanear o escribir código..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length > 3) handlePackBarcodeScan(e.target.value); }}
                      />
                      <BarcodeScanner onScan={handlePackBarcodeScan} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mkt-pack-selected">
                <button
                  type="button"
                  className="mkt-pack-selected-remove"
                  onClick={() => setBaseProduct(null)}
                  title="Cambiar producto base"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="mkt-pack-selected-header">
                  <span className="mkt-pack-selected-label">Producto base</span>
                  <h3 className="mkt-pack-selected-name">{baseProduct.name}</h3>
                </div>
                <div className="mkt-pack-selected-details">
                  {baseProduct.brandName != null && (
                    <div className="mkt-pack-selected-detail">
                      <span className="mkt-pack-selected-detail-label">Marca</span>
                      <span>{baseProduct.brandName}</span>
                    </div>
                  )}
                  <div className="mkt-pack-selected-detail">
                    <span className="mkt-pack-selected-detail-label">Categoría</span>
                    <span>{baseProduct.categoryName ?? "—"}</span>
                  </div>
                  <div className="mkt-pack-selected-detail">
                    <span className="mkt-pack-selected-detail-label">Presentación</span>
                    <span>
                      {baseProduct.presentationQuantity != null ? `${Number(baseProduct.presentationQuantity)}` : "—"}
                      {baseProduct.unitSymbol ?? ""}
                    </span>
                  </div>
                  <div className="mkt-pack-selected-detail">
                    <span className="mkt-pack-selected-detail-label">Alarma stock</span>
                    <span>≤ {baseProduct.minStock} uds</span>
                  </div>
                  <div className="mkt-pack-selected-detail">
                    <span className="mkt-pack-selected-detail-label">Alarma vencimiento</span>
                    <span>≤ {baseProduct.minDays} días</span>
                  </div>
                </div>
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Unidades del pack</label>
                  <input name="stockQuantity" className="mkt-form-input" type="number" min="2" step="1" defaultValue={2} placeholder="ej. 6, 12" required />
                  <span className="mkt-form-hint">Cada 1 de este producto equivale a esta cantidad de unidades</span>
                </div>
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Código de barras (opcional)</label>
                  <div className="mkt-form-input-wrap">
                    <input
                      name="packBarcode"
                      className="mkt-form-input"
                      type="text"
                      placeholder="Escanear o escribir..."
                      value={packBarcode}
                      onChange={(e) => setPackBarcode(e.target.value)}
                    />
                    <BarcodeScanner onScan={(code) => setPackBarcode(code)} />
                  </div>
                  <span className="mkt-form-hint">El pack puede tener su propio código de barras</span>
                </div>
              </div>
            )}
          </>
        )}

        {!isPack && (
          <>
            <div className="mkt-pack-toggle-row">
              <label className="mkt-pack-toggle-label">
                <input type="checkbox" checked={isPack} onChange={(e) => setIsPack(e.target.checked)} />
                <span className="mkt-pack-toggle-control">
                  <span className="mkt-pack-toggle-thumb" />
                </span>
                <span className="mkt-pack-toggle-text">Contiene varias unidades</span>
              </label>
            </div>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
              <Switch checked={notificate} onChange={(e) => setNotificate(e.target.checked)} size="small" />
              <span style={{ fontSize: "0.8125rem", color: "var(--fg)" }}>Notificar si el stock está bajo o por vencer</span>
            </Stack>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Nombre</label>
              <input name="name" className="mkt-form-input" type="text" placeholder="ej. Leche entera" required />
            </div>
            <div className="mkt-form-row">
              <div className="mkt-form-group">
                <label className="mkt-form-label">Marca (opcional)</label>
                <select name="brandId" className="mkt-form-select" defaultValue="">
                  <option value="" disabled>Seleccionar...</option>
                  {brandOptions.map(({ brand, depth }) => (
                    <option key={brand.id} value={brand.id}>
                      {"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{brand.name}
                    </option>
                  ))}
                </select>
                {brandOptions.some((o) => o.depth > 0) && (
                  <span className="mkt-form-hint">Las submarcas están indentadas con └</span>
                )}
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

            <div className="mkt-alarms-section">
              <label className="mkt-alarms-toggle">
                <input type="checkbox" checked={customAlarms} onChange={(e) => setCustomAlarms(e.target.checked)} />
                <span className="mkt-pack-toggle-control">
                  <span className="mkt-pack-toggle-thumb" />
                </span>
                <span className="mkt-alarms-toggle-text">Personalizar alarmas</span>
              </label>
              {customAlarms && (
                <div className="mkt-alarms-detail">
                  <div className="mkt-form-row">
                    <div className="mkt-form-group">
                      <label className="mkt-form-label-sm">Stock mínimo</label>
                      <input name="minStock" className="mkt-form-input" type="number" min="1" step="1" defaultValue={1} />
                      <span className="mkt-form-hint">Alerta cuando queden ≤ N unidades</span>
                    </div>
                    <div className="mkt-form-group">
                      <label className="mkt-form-label-sm">Días mínimos</label>
                      <input name="minDays" className="mkt-form-input" type="number" min="1" step="1" defaultValue={7} />
                      <span className="mkt-form-hint">Alerta cuando falten ≤ N días para vencer</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit" disabled={isPack && !baseProduct}>
            {isPack && baseProduct ? "Agregar pack" : "Agregar producto"}
          </button>
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
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const parentBrands = (brands ?? []).filter((b) => !b.parentBrandId);

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
            body: JSON.stringify({
              name,
              parentBrandId: form.get("parentBrandId") || null,
            }),
          });
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. La Serenísima" required />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Marca padre (opcional)</label>
          <select name="parentBrandId" className="mkt-form-select" defaultValue="">
            <option value="">Sin marca padre</option>
            {parentBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
          <span className="mkt-form-hint">Dejá vacío para una marca principal. Seleccioná una para crear una submarca.</span>
        </div>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar marca</button>
        </div>
      </form>
    </>
  );
}
