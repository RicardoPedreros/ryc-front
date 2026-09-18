"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandChip } from "./BrandChip";
import { BarcodeScanner } from "./BarcodeScanner";
import type { BrandPathLookup } from "./BrandChip";

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

interface PurchaseItemSearchProps {
  readonly brandPathLookup: BrandPathLookup;
  readonly brandIcons: ReadonlyMap<string, string | null>;
  readonly onAddProduct: (productId: string) => void;
  readonly onAddTemporal: (name: string | null, barcode: string | null) => void;
  readonly isProductAdded: (productId: string) => boolean;
  readonly isTemporalAdded: (name: string | null, barcode: string | null) => boolean;
}

export function PurchaseItemSearch({
  brandPathLookup,
  brandIcons,
  onAddProduct,
  onAddTemporal,
  isProductAdded,
  isTemporalAdded,
}: PurchaseItemSearchProps) {
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
        onAddProduct(data.id);
        resetSearch();
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
  }, [onAddProduct]);

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
        onAddProduct(searchResults[0].id);
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
    <>
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
                  const added = isProductAdded(p.id);
                  const pres = p.presentationQuantity != null && p.unitSymbol ? `${p.presentationQuantity}${p.unitSymbol}` : "";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`mkt-search-result ${added ? "already-added" : ""}`}
                      disabled={added}
                      onClick={() => { if (!added) { onAddProduct(p.id); resetSearch(); } }}
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
                  disabled={isTemporalAdded(searchQuery, null)}
                  onClick={() => { onAddTemporal(searchQuery, null); resetSearch(); }}
                >
                  {isTemporalAdded(searchQuery, null)
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
disabled={isTemporalAdded(null, barcodeNotFound)}
                    onClick={() => { onAddTemporal(null, barcodeNotFound); resetSearch(); }}
                >
                  {isTemporalAdded(null, barcodeNotFound)
                    ? "Ya en la compra"
                    : "Agregar el código como producto sin registrar"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}