"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { Store } from "@/domain/market/entities/store";
import type { PaymentMethod } from "@/domain/market/entities/payment-method";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";
import { BrandChip, buildBrandPathLookup } from "./BrandChip";
import type { Brand } from "@/domain/market/entities/brand";
import { BarcodeScanner } from "./BarcodeScanner";

interface SearchResult {
  readonly id: string;
  readonly name: string;
  readonly brandName: string | null;
  readonly brandId: string | null;
  readonly presentationQuantity: number | null;
  readonly unitSymbol: string | null;
  readonly stockQuantity: number;
  readonly barcode: string | null;
}

interface PurchaseItemDraft {
  readonly productId: string | null;
  readonly temporalProductName: string | null;
  readonly temporalBarcode: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string;
  readonly lot: string;
}

function itemKey(item: PurchaseItemDraft): string {
  return item.productId ?? `temporal:${item.temporalProductName ?? ""}|${item.temporalBarcode ?? ""}`;
}

function isTemporal(item: PurchaseItemDraft): boolean {
  return item.productId == null;
}

function temporalDisplayName(item: PurchaseItemDraft): string {
  if (item.temporalProductName) return item.temporalProductName;
  if (item.temporalBarcode) return `Código ${item.temporalBarcode}`;
  return "Producto pendiente";
}

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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
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
  readonly brandPathLookup: { readonly byId: ReadonlyMap<string, string>; readonly byName: ReadonlyMap<string, string> };
  readonly brandIcons: ReadonlyMap<string, string | null>;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [items, setItems] = useState<PurchaseItemDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"name" | "barcode">("barcode");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSearch = () => {
    setSearchQuery("");
    setBarcodeInput("");
    setBarcodeNotFound(null);
    setSearchResults([]);
    setShowResults(false);
  };

  const alreadyAddedTemporal = (name: string | null, barcode: string | null) =>
    items.some((i) => isTemporal(i) && i.temporalProductName === name && i.temporalBarcode === barcode);

  const addItem = (productId: string) => {
    if (items.some((i) => i.productId === productId)) return;
    setItems((prev) => [...prev, { productId, temporalProductName: null, temporalBarcode: null, quantity: 1, unitPrice: 0, discount: 0, expirationDate: "", lot: "" }]);
    resetSearch();
  };

  const addTemporalItem = (name: string | null, barcode: string | null) => {
    if (alreadyAddedTemporal(name, barcode)) return;
    setItems((prev) => [...prev, { productId: null, temporalProductName: name, temporalBarcode: barcode, quantity: 1, unitPrice: 0, discount: 0, expirationDate: "", lot: "" }]);
    resetSearch();
  };

  const updateItem = (index: number, field: keyof PurchaseItemDraft, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  function formatPresentation(p: ProductSearchResult): string {
    const parts: string[] = [];
    if (p.presentationQuantity != null && p.unitSymbol) {
      parts.push(`${p.presentationQuantity}${p.unitSymbol}`);
    }
    return parts.join(" · ");
  }

  const searchProducts = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/market/products?q=${encodeURIComponent(query)}&details=true`);
      if (res.ok) {
        const data = (await res.json()) as readonly SearchResult[];
        setSearchResults(data);
        setShowResults(true);
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsSearching(true);
    setBarcodeNotFound(null);
    try {
      const res = await fetch(`/api/market/products?barcode=${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const data = (await res.json()) as SearchResult;
        addItem(data.id);
        return;
      }
      if (res.status === 404) {
        setBarcodeNotFound(barcode);
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleNameChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 2500);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0 && showResults) {
        addItem(searchResults[0].id);
      }
    }
    if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchByBarcode(barcodeInput);
    }
  };

  const handleCameraScan = (code: string) => {
    setBarcodeInput(code);
    searchByBarcode(code);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
              <div key={itemKey(item)} className="mkt-purchase-form-item">
                <div className="mkt-purchase-form-item-header">
                  <span className="mkt-purchase-form-item-name">
                    {isTemporal(item) ? (
                      <>
                        {temporalDisplayName(item)}
                        <span className="mkt-pending-badge">Pendiente</span>
                      </>
                    ) : (
                      productMap.get(item.productId!)?.name ?? "—"
                    )}
                    {!isTemporal(item) && (() => {
                      const p = productMap.get(item.productId!);
                      if (!p?.brandName) return null;
                      return (
                        <span className="mkt-purchase-form-item-meta">
                          {" — "}
                          <BrandChip
                            brandName={p.brandName}
                            brandPath={p.brandId ? (brandPathLookup.byId.get(p.brandId) ?? null) : null}
                            brandIcon={p.brandId ? (brandIcons.get(p.brandId) ?? null) : null}
                          />
                        </span>
                      );
                    })()}
                    {(() => {
                      const p = item.productId ? productMap.get(item.productId) : undefined;
                      if (!p) return null;
                      const pres = formatPresentation(p);
                      return pres ? <span className="mkt-purchase-form-item-meta"> ({pres})</span> : null;
                    })()}
                  </span>
                  <button type="button" className="mkt-purchase-form-item-remove" onClick={() => removeItem(index)}>×</button>
                </div>
                <div className="mkt-purchase-form-item-fields">
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Cant.</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Precio/u</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ""}
                      placeholder="$0.00"
                      onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Desc.</label>
                    <input
                      className="mkt-form-input-sm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount || ""}
                      placeholder="$0"
                      onChange={(e) => updateItem(index, "discount", Number(e.target.value))}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Lote</label>
                    <input
                      className="mkt-form-input-sm"
                      type="text"
                      value={item.lot}
                      placeholder="—"
                      onChange={(e) => updateItem(index, "lot", e.target.value)}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Vence</label>
                    <input
                      className="mkt-form-input-sm"
                      type="date"
                      value={item.expirationDate}
                      onChange={(e) => updateItem(index, "expirationDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search modes: name + barcode */}
        <div className="mkt-search-modes" style={{ marginBottom: "0.5rem" }}>
          <button
            type="button"
            className={`mkt-search-mode-btn ${searchMode === "name" ? "active" : ""}`}
            onClick={() => { setSearchMode("name"); setSearchQuery(""); setSearchResults([]); setShowResults(false); }}
          >
            Por nombre
          </button>
          <button
            type="button"
            className={`mkt-search-mode-btn ${searchMode === "barcode" ? "active" : ""}`}
            onClick={() => { setSearchMode("barcode"); setBarcodeInput(""); setSearchResults([]); setShowResults(false); }}
          >
            Código de barras
          </button>
        </div>

        <div className="mkt-search-input-wrap" ref={searchRef}>
          {searchMode === "name" ? (
            <>
              <input
                className="mkt-search-input-field"
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              />
              {isSearching && <span className="mkt-search-spinner" />}
              {showResults && searchResults.length > 0 && (
                <div className="mkt-search-dropdown">
                  {searchResults.map((p) => {
                    const added = items.some((i) => i.productId === p.id);
                    const pres = p.presentationQuantity != null && p.unitSymbol ? `${p.presentationQuantity}${p.unitSymbol}` : "";
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`mkt-search-result ${added ? "already-added" : ""}`}
                        disabled={added}
                        onClick={() => { if (!added) addItem(p.id); }}
                      >
                         <div className="mkt-search-result-body">
                           <span className="mkt-search-result-name">
                             {p.name}
                             {p.stockQuantity > 1 && <span className="mkt-pack-chip">x{p.stockQuantity}</span>}
                             {p.brandName ? <>{` `}<BrandChip brandName={p.brandName} brandPath={p.brandId ? (brandPathLookup.byId.get(p.brandId) ?? null) : null} brandIcon={p.brandId ? (brandIcons.get(p.brandId) ?? null) : null} /></> : null}
                           </span>
                           {pres && <span className="mkt-search-result-meta">{pres}</span>}
                         </div>
                        {added && <span className="mkt-search-result-badge">En la compra</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                <div className="mkt-search-dropdown">
                  <span className="mkt-search-no-results">No se encontraron productos</span>
                  <button
                    type="button"
                    className="mkt-search-add-temporal"
                    disabled={alreadyAddedTemporal(searchQuery, null)}
                    onClick={() => addTemporalItem(searchQuery, null)}
                  >
                    {alreadyAddedTemporal(searchQuery, null)
                      ? "Ya en la compra"
                      : `Agregar "${searchQuery}" como producto sin registrar`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <input
                className="mkt-search-input-field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Escanear o escribir código..."
                value={barcodeInput}
                onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeNotFound(null); }}
                onKeyDown={handleBarcodeKeyDown}
              />
              {isSearching && <span className="mkt-search-spinner" />}
              <BarcodeScanner onScan={handleCameraScan} />
              {barcodeNotFound && (
                <div className="mkt-search-add-temporal-wrap">
                  <span className="mkt-search-no-results">El código {barcodeNotFound} no está registrado</span>
                  <button
                    type="button"
                    className="mkt-search-add-temporal"
                    disabled={alreadyAddedTemporal(null, barcodeNotFound)}
                    onClick={() => addTemporalItem(null, barcodeNotFound)}
                  >
                    {alreadyAddedTemporal(null, barcodeNotFound)
                      ? "Ya en la compra"
                      : "Agregar el código como producto sin registrar"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

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
