"use client";

import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import { Icon } from "@/presentation/components/ui/Icon";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";
import type { Product } from "@/domain/market/entities/product";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";

export interface ProductFormProps {
  readonly categories: readonly Category[];
  readonly units: readonly Unit[];
  readonly brands: readonly Brand[];
  readonly initial?: Product | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function ProductForm({
  categories,
  units,
  brands,
  initial,
  onClose,
  onSaved,
}: ProductFormProps) {
  const isEdit = initial != null;
  const isEditPack = isEdit && initial.parentProductId != null;
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [packBarcode, setPackBarcode] = useState("");
  const [isPack, setIsPack] = useState(false);
  const [customAlarms, setCustomAlarms] = useState(false);
  const [notificate, setNotificate] = useState(initial?.notificate ?? true);
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
    debounceRef.current = setTimeout(() => doSearch(v), 2500);
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

  const activePack = isEdit ? isEditPack : isPack && baseProduct != null;

  const title = isEdit
    ? (isEditPack ? "Editar pack" : "Editar producto")
    : (activePack ? "Agregar pack" : "Agregar producto");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (isEdit) {
      if (isEditPack) {
        await fetch(`/api/market/products?id=${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode: barcode || null,
            stockQuantity: Number(form.get("stockQuantity")) || 1,
            notificate,
          }),
        });
        onClose();
        onSaved();
        return;
      }
      const categoryId = form.get("categoryId") as string;
      const unitId = form.get("unitId") as string;
      if (!categoryId || !unitId) return;
      await fetch(`/api/market/products?id=${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          brandId: form.get("brandId") || null,
          categoryId,
          unitId,
          presentationQuantity: form.get("presentationQuantity") ? Number(form.get("presentationQuantity")) : null,
          minStock: customAlarms ? Number(form.get("minStock")) || 1 : undefined,
          minDays: customAlarms ? Number(form.get("minDays")) || 7 : undefined,
          notificate,
          barcode: barcode || null,
        }),
      });
      onClose();
      onSaved();
      return;
    }
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
      onSaved();
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
    onSaved();
  };

  return (
    <>
      <h2>{title}</h2>
      <form
        onSubmit={handleSubmit}
        data-testid="product-form"
      >
        {isEdit ? (
          <>
            {!isEditPack ? (
              <>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                  <Switch checked={notificate} onChange={(e) => setNotificate(e.target.checked)} size="small" />
                  <span style={{ fontSize: "0.8125rem", color: "var(--fg)" }}>Notificar si el stock está bajo o por vencer</span>
                </Stack>
                <div className="mkt-form-group">
                  <label className="mkt-form-label">Nombre</label>
                  <input name="name" className="mkt-form-input" type="text" placeholder="ej. Leche entera" defaultValue={initial.name} required />
                </div>
                <div className="mkt-form-row">
                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Marca (opcional)</label>
                    <select name="brandId" className="mkt-form-select" defaultValue={initial.brandId ?? ""}>
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
                    <select name="categoryId" className="mkt-form-select" defaultValue={initial.categoryId} required>
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
                    <select name="unitId" className="mkt-form-select" defaultValue={initial.unitId} required>
                      <option value="" disabled>Seleccionar...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Presentación</label>
                    <input name="presentationQuantity" className="mkt-form-input" type="number" step="0.01" placeholder="ej. 1, 0.5" defaultValue={initial.presentationQuantity ?? ""} />
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
                          <input name="minStock" className="mkt-form-input" type="number" min="1" step="1" defaultValue={initial.minStock} />
                          <span className="mkt-form-hint">Alerta cuando queden ≤ N unidades</span>
                        </div>
                        <div className="mkt-form-group">
                          <label className="mkt-form-label-sm">Días mínimos</label>
                          <input name="minDays" className="mkt-form-input" type="number" min="1" step="1" defaultValue={initial.minDays} />
                          <span className="mkt-form-hint">Alerta cuando falten ≤ N días para vencer</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mkt-pack-selected">
                  <div className="mkt-pack-selected-header">
                    <span className="mkt-pack-selected-label">Pack de {initial.name}</span>
                  </div>
                  <div className="mkt-pack-selected-details">
                    <div className="mkt-pack-selected-detail">
                      <span className="mkt-pack-selected-detail-label">Alarma stock</span>
                      <span>≤ {initial.minStock} uds</span>
                    </div>
                    <div className="mkt-pack-selected-detail">
                      <span className="mkt-pack-selected-detail-label">Alarma vencimiento</span>
                      <span>≤ {initial.minDays} días</span>
                    </div>
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Unidades del pack</label>
                    <input name="stockQuantity" className="mkt-form-input" type="number" min="1" step="1" defaultValue={initial.stockQuantity} placeholder="ej. 6, 12" required />
                    <span className="mkt-form-hint">Cada 1 de este producto equivale a esta cantidad de unidades</span>
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
                    <span className="mkt-form-hint">El pack puede tener su propio código de barras</span>
                  </div>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                    <Switch checked={notificate} onChange={(e) => setNotificate(e.target.checked)} size="small" />
                    <span style={{ fontSize: "0.8125rem", color: "var(--fg)" }}>Notificar si el stock está bajo o por vencer</span>
                  </Stack>
                </div>
              </>
            )}
          </>
        ) : (
          <>
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
                      Busca el producto base para heredar sus datos (marca, categoría, presentación).
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
                            placeholder="Escribe para buscar productos..."
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
                      <Icon name="x" size={14} />
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
          </>
        )}

        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit" disabled={!isEdit && isPack && !baseProduct}>
            {isEdit ? "Guardar cambios" : (activePack ? "Agregar pack" : "Agregar producto")}
          </button>
        </div>
      </form>
    </>
  );
}