"use client";

import type { RefObject } from "react";
import { BarcodeScanner } from "./BarcodeScanner";
import { Icon } from "@/presentation/components/ui/Icon";
import type { ShoppingItem } from "@/shared/types/shopping-item";

export interface ShoppingProductResult {
  readonly id: string;
  readonly name: string;
  readonly brandName: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly stockQuantity: number;
  readonly barcode: string | null;
}

function formatPresentation(qty: number | null, unit: string | null): string {
  if (qty == null) return "";
  const unitStr = unit ?? "";
  return `${qty}${unitStr}`;
}

function isAlreadyInList(item: ShoppingProductResult | { productId: string | null; name: string }, items: readonly ShoppingItem[]): boolean {
  const itemId = "id" in item ? item.id : item.productId;
  if (itemId != null) {
    return items.some((i) => i.productId === itemId);
  }
  return items.some(
    (i) => i.productId === null && i.name.toLowerCase() === item.name.toLowerCase()
  );
}

export interface ShoppingListSearchProps {
  readonly items: readonly ShoppingItem[];
  readonly searchMode: "name" | "barcode";
  readonly searchQuery: string;
  readonly barcodeInput: string;
  readonly results: readonly ShoppingProductResult[];
  readonly isSearching: boolean;
  readonly showResults: boolean;
  readonly quantityToAdd: number;
  readonly searchRef: RefObject<HTMLDivElement | null>;
  readonly onSearchModeChange: (mode: "name" | "barcode") => void;
  readonly onQuantityChange: (qty: number) => void;
  readonly onNameChange: (value: string) => void;
  readonly onNameKeyDown: (e: React.KeyboardEvent) => void;
  readonly onFocusInput: () => void;
  readonly onBarcodeChange: (value: string) => void;
  readonly onBarcodeKeyDown: (e: React.KeyboardEvent) => void;
  readonly onBarcodeScan: (code: string) => void;
  readonly onAddItem: (product?: ShoppingProductResult) => void;
}

export function ShoppingListSearch({
  items,
  searchMode,
  searchQuery,
  barcodeInput,
  results,
  isSearching,
  showResults,
  quantityToAdd,
  searchRef,
  onSearchModeChange,
  onQuantityChange,
  onNameChange,
  onNameKeyDown,
  onFocusInput,
  onBarcodeChange,
  onBarcodeKeyDown,
  onBarcodeScan,
  onAddItem,
}: ShoppingListSearchProps) {
  return (
    <div className="mkt-add-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
      <div className="mkt-add-controls-row">
        <div className="mkt-qty-stepper">
          <button
            type="button"
            className="mkt-qty-btn"
            onClick={() => onQuantityChange(Math.max(1, quantityToAdd - 1))}
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
              if (!isNaN(v) && v >= 1 && v <= 99) onQuantityChange(v);
            }}
            aria-label="Cantidad a agregar"
          />
          <button
            type="button"
            className="mkt-qty-btn"
            onClick={() => onQuantityChange(Math.min(99, quantityToAdd + 1))}
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <div className="mkt-search-modes">
          <button
            type="button"
            className={`mkt-search-mode-btn ${searchMode === "name" ? "active" : ""}`}
            onClick={() => onSearchModeChange("name")}
          >
            <Icon name="search" size={14} />
            Nombre
          </button>
          <button
            type="button"
            className={`mkt-search-mode-btn ${searchMode === "barcode" ? "active" : ""}`}
            onClick={() => onSearchModeChange("barcode")}
          >
            <Icon name="barcode" size={14} />
            Código de barras
          </button>
        </div>
      </div>

      {searchMode === "name" ? (
        <div className="mkt-search-input-wrap" ref={searchRef}>
          <input
            className="mkt-search-input-field"
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={onNameKeyDown}
            onFocus={onFocusInput}
          />
          {isSearching && <span className="mkt-search-spinner" />}

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
                      onClick={() => !alreadyAdded && onAddItem(product)}
                      disabled={alreadyAdded}
                    >
                       <div className="mkt-search-result-body">
                         <span className="mkt-search-result-name">
                           {product.name}
                           {product.stockQuantity > 1 && <span className="mkt-pack-chip">x{product.stockQuantity}</span>}
                         </span>
                         <span className="mkt-search-result-meta">
                           {product.brandName}{product.brandName && product.presentationQuantity != null ? " — " : ""}
                           {formatPresentation(product.presentationQuantity, product.unitSymbol)}
                           {product.categoryName ? ` · ${product.categoryName}` : ""}
                         </span>
                       </div>
                      {alreadyAdded ? (
                        <span className="mkt-search-result-badge">En lista</span>
                      ) : (
                        <Icon name="plus" size={14} stroke="var(--fg-subtle)" />
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
            <Icon name="barcode" size={14} stroke="var(--fg-subtle)" />
            <input
              className="mkt-barcode-input"
              type="text"
              placeholder="Escribe el código de barras..."
              value={barcodeInput}
              onChange={(e) => onBarcodeChange(e.target.value)}
              onKeyDown={onBarcodeKeyDown}
            />
            {isSearching && <span className="mkt-search-spinner" />}
          </div>
          <BarcodeScanner onScan={onBarcodeScan} />
          <button
            type="button"
            className="mkt-add-row-btn"
            onClick={() => onBarcodeScan(barcodeInput)}
            disabled={!barcodeInput.trim() || isSearching}
            aria-label="Buscar por código"
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}