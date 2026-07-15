"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";
import type { ShoppingItem } from "./types";

interface ProductResult {
  readonly id: string;
  readonly name: string;
  readonly brandName: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly barcode: string | null;
}

function formatPresentation(qty: number | null, unit: string | null): string {
  if (qty == null) return "";
  const unitStr = unit ?? "";
  return `${qty}${unitStr}`;
}

function isAlreadyInList(item: ProductResult | { productId: string | null; name: string }, items: readonly ShoppingItem[]): boolean {
  if (item.productId != null) {
    return items.some((i) => i.productId === item.productId);
  }
  return items.some(
    (i) => i.productId === null && i.name.toLowerCase() === item.name.toLowerCase()
  );
}

export function ShoppingList() {
  const [items, setItems] = useState<readonly ShoppingItem[]>([]);
  const [searchMode, setSearchMode] = useState<"name" | "barcode">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [results, setResults] = useState<readonly ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addItem = (product?: ProductResult) => {
    if (product) {
      if (isAlreadyInList(product, items)) {
        const label = product.brandName
          ? `${product.name} — ${product.brandName}`
          : product.name;
        setDuplicateWarning(label);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setDuplicateWarning(null), 2500);
        return;
      }
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        brand: product.brandName ?? "",
        presentationQuantity: product.presentationQuantity,
        unitSymbol: product.unitSymbol,
        checked: false,
        quantity: quantityToAdd,
      };
      setItems((prev) => [...prev, newItem]);
    } else {
      const name = searchMode === "name" ? searchQuery.trim() : barcodeInput.trim();
      if (!name) return;
      if (isAlreadyInList({ productId: null, name }, items)) {
        setDuplicateWarning(name);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setDuplicateWarning(null), 2500);
        return;
      }
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        productId: null,
        name,
        brand: "",
        presentationQuantity: null,
        unitSymbol: null,
        checked: false,
        quantity: quantityToAdd,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setSearchQuery("");
    setBarcodeInput("");
    setResults([]);
    setShowResults(false);
    setQuantityToAdd(1);
    setDuplicateWarning(null);
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const searchProducts = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/market/products?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = (await res.json()) as readonly ProductResult[];
        setResults(data);
        setShowResults(data.length > 0);
      }
    } catch {
      // ignore — user may still type manually
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/market/products?barcode=${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const data = (await res.json()) as ProductResult;
        addItem(data);
      } else {
        addItem();
      }
    } catch {
      addItem();
    } finally {
      setIsSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantityToAdd, items]);

  const handleNameChange = (value: string) => {
    setSearchQuery(value);
    setDuplicateWarning(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && showResults) {
        addItem(results[0]);
      } else {
        addItem();
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

  // Cleanup warning timeout
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  const pending = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Lista de compras</h2>
        {items.length > 0 && (
          <span className="mkt-section-meta">{pending.length} pendientes</span>
        )}
      </div>
      <div className="mkt-card">
        {items.length === 0 && !searchQuery && !barcodeInput && (
          <div className="mkt-empty-state">
            <p>Lista vacía</p>
            <p className="mkt-empty-sub">Buscá un producto por nombre o escaneá su código de barras</p>
          </div>
        )}

        {pending.map((item) => (
          <div key={item.id} className="mkt-list-item">
            <button
              type="button"
              className="mkt-list-check"
              onClick={() => toggleItem(item.id)}
              aria-label={`Marcar ${item.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="mkt-list-item-body">
              <span className="mkt-list-item-name">{item.name}</span>
              {(item.brand || item.presentationQuantity != null) && (
                <span className="mkt-list-item-meta">
                  {item.brand}{item.brand && item.presentationQuantity != null ? " — " : ""}
                  {formatPresentation(item.presentationQuantity, item.unitSymbol)}
                </span>
              )}
            </div>
            <span className="mkt-list-item-qty">{item.quantity}x</span>
            <button
              type="button"
              className="mkt-list-item-remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Eliminar ${item.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {done.map((item) => (
          <div key={item.id} className="mkt-list-item done">
            <button
              type="button"
              className="mkt-list-check checked"
              onClick={() => toggleItem(item.id)}
              aria-label={`Desmarcar ${item.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="mkt-list-item-body">
              <span className="mkt-list-item-name done">{item.name}</span>
              {(item.brand || item.presentationQuantity != null) && (
                <span className="mkt-list-item-meta">
                  {item.brand}{item.brand && item.presentationQuantity != null ? " — " : ""}
                  {formatPresentation(item.presentationQuantity, item.unitSymbol)}
                </span>
              )}
            </div>
            <span className="mkt-list-item-qty">{item.quantity}x</span>
            <button
              type="button"
              className="mkt-list-item-remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Eliminar ${item.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="mkt-duplicate-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>&ldquo;{duplicateWarning}&rdquo; ya está en la lista</span>
          </div>
        )}

        {/* Search / Add row */}
        <div className="mkt-add-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
          {/* Quantity + Mode toggle row */}
          <div className="mkt-add-controls-row">
            {/* Quantity stepper */}
            <div className="mkt-qty-stepper">
              <button
                type="button"
                className="mkt-qty-btn"
                onClick={() => setQuantityToAdd((q) => Math.max(1, q - 1))}
                aria-label="Reducir cantidad"
              >
                −
              </button>
              <input
                className="mkt-qty-input"
                type="number"
                min={1}
                max={99}
                value={quantityToAdd}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= 99) setQuantityToAdd(v);
                }}
                aria-label="Cantidad a agregar"
              />
              <button
                type="button"
                className="mkt-qty-btn"
                onClick={() => setQuantityToAdd((q) => Math.min(99, q + 1))}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mkt-search-modes">
              <button
                type="button"
                className={`mkt-search-mode-btn ${searchMode === "name" ? "active" : ""}`}
                onClick={() => { setSearchMode("name"); setResults([]); setShowResults(false); setDuplicateWarning(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Nombre
              </button>
              <button
                type="button"
                className={`mkt-search-mode-btn ${searchMode === "barcode" ? "active" : ""}`}
                onClick={() => { setSearchMode("barcode"); setResults([]); setShowResults(false); setDuplicateWarning(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 012-2h2" />
                  <path d="M17 3h2a2 2 0 012 2v2" />
                  <path d="M21 17v2a2 2 0 01-2 2h-2" />
                  <path d="M7 21H5a2 2 0 01-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
                Código de barras
              </button>
            </div>
          </div>

          {/* Input area */}
          {searchMode === "name" ? (
            <div className="mkt-search-input-wrap" ref={searchRef}>
              <input
                className="mkt-search-input-field"
                type="text"
                placeholder="Buscar producto por nombre..."
                value={searchQuery}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onFocus={() => results.length > 0 && setShowResults(true)}
              />
              {isSearching && <span className="mkt-search-spinner" />}

              {/* Results dropdown */}
              {showResults && (
                <div className="mkt-search-dropdown">
                  {results.length > 0 ? (
                    results.map((product) => {
                      const alreadyAdded = isAlreadyInList(product, items);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          className={`mkt-search-result ${alreadyAdded ? "already-added" : ""}`}
                          onClick={() => !alreadyAdded && addItem(product)}
                          disabled={alreadyAdded}
                        >
                          <div className="mkt-search-result-body">
                            <span className="mkt-search-result-name">{product.name}</span>
                            <span className="mkt-search-result-meta">
                              {product.brandName}{product.brandName && product.presentationQuantity != null ? " — " : ""}
                              {formatPresentation(product.presentationQuantity, product.unitSymbol)}
                              {product.categoryName ? ` · ${product.categoryName}` : ""}
                            </span>
                          </div>
                          {alreadyAdded ? (
                            <span className="mkt-search-result-badge">En lista</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    !isSearching && searchQuery.trim().length >= 2 && (
                      <div className="mkt-search-no-results">
                        No se encontraron productos para &ldquo;{searchQuery}&rdquo;
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mkt-barcode-input-row">
              <div className="mkt-barcode-input-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 012-2h2" />
                  <path d="M17 3h2a2 2 0 012 2v2" />
                  <path d="M21 17v2a2 2 0 01-2 2h-2" />
                  <path d="M7 21H5a2 2 0 01-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
                <input
                  className="mkt-barcode-input"
                  type="text"
                  placeholder="Escribí el código de barras..."
                  value={barcodeInput}
                  onChange={(e) => { setBarcodeInput(e.target.value); setDuplicateWarning(null); }}
                  onKeyDown={handleBarcodeKeyDown}
                />
                {isSearching && <span className="mkt-search-spinner" />}
              </div>
              <BarcodeScanner onScan={handleCameraScan} />
              <button
                type="button"
                className="mkt-add-row-btn"
                onClick={() => searchByBarcode(barcodeInput)}
                disabled={!barcodeInput.trim() || isSearching}
                aria-label="Buscar por código"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
