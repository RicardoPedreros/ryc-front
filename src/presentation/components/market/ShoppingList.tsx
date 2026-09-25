"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import { ModalShell } from "@/presentation/components/market/ModalShell";
import { useBodyScrollLock } from "@/presentation/hooks/useBodyScrollLock";
import { useShoppingList } from "@/presentation/hooks/useShoppingList";
import { ShoppingItemRow } from "./ShoppingItemRow";
import { ShoppingListSearch } from "./ShoppingListSearch";
import type { ShoppingProductResult } from "./ShoppingListSearch";
import type { ShoppingItem } from "@/shared/types/shopping-item";

export function ShoppingList({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { items, add, toggle, remove, clear } = useShoppingList();
  const [searchMode, setSearchMode] = useState<"name" | "barcode">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [results, setResults] = useState<readonly ShoppingProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useBodyScrollLock(open);

  const addItem = (product?: ShoppingProductResult) => {
    if (product) {
      if (items.some((i) => i.productId === product.id)) {
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
      add(newItem);
    } else {
      const name = searchMode === "name" ? searchQuery.trim() : barcodeInput.trim();
      if (!name) return;
      if (items.some((i) => i.productId === null && i.name.toLowerCase() === name.toLowerCase())) {
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
      add(newItem);
    }
    setSearchQuery("");
    setBarcodeInput("");
    setResults([]);
    setShowResults(false);
    setQuantityToAdd(1);
    setDuplicateWarning(null);
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
        const data = (await res.json()) as readonly ShoppingProductResult[];
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
        const data = (await res.json()) as ShoppingProductResult;
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

  const handleSearchModeChange = (mode: "name" | "barcode") => {
    setSearchMode(mode);
    setResults([]);
    setShowResults(false);
    setDuplicateWarning(null);
  };

  const handleNameChange = (value: string) => {
    setSearchQuery(value);
    setDuplicateWarning(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 2500);
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

  const clearList = () => {
    clear();
    setSearchQuery("");
    setBarcodeInput("");
    setResults([]);
    setShowResults(false);
    setDuplicateWarning(null);
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="mkt-modal-list-head">
        <h2>Lista de compras</h2>
        <div className="mkt-modal-list-head-actions">
          {items.length > 0 && (
            <span className="mkt-section-meta">{pending.length} pendientes</span>
          )}
          {items.length > 0 && (
            <button type="button" className="mkt-clear-list-btn" onClick={clearList}>
              <Icon name="trash-2" size={14} />
              Limpiar lista
            </button>
          )}
        </div>
      </div>

      <div className="mkt-card">
        {items.length === 0 && !searchQuery && !barcodeInput && (
          <div className="mkt-empty-state">
            <p>Lista vacía</p>
            <p className="mkt-empty-sub">Busca un producto por nombre o escanea su código de barras</p>
          </div>
        )}

        {pending.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            done={false}
            onToggle={toggle}
            onRemove={remove}
          />
        ))}

        {done.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            done
            onToggle={toggle}
            onRemove={remove}
          />
        ))}

        {duplicateWarning && (
          <div className="mkt-duplicate-warning">
            <Icon name="alert-circle" size={14} />
            <span>&ldquo;{duplicateWarning}&rdquo; ya está en la lista</span>
          </div>
        )}

        <ShoppingListSearch
          items={items}
          searchMode={searchMode}
          searchQuery={searchQuery}
          barcodeInput={barcodeInput}
          results={results}
          isSearching={isSearching}
          showResults={showResults}
          quantityToAdd={quantityToAdd}
          searchRef={searchRef}
          onSearchModeChange={handleSearchModeChange}
          onQuantityChange={setQuantityToAdd}
          onNameChange={handleNameChange}
          onNameKeyDown={handleNameKeyDown}
          onFocusInput={() => { if (results.length > 0) setShowResults(true); }}
          onBarcodeChange={(value) => { setBarcodeInput(value); setDuplicateWarning(null); }}
          onBarcodeKeyDown={handleBarcodeKeyDown}
          onBarcodeScan={handleCameraScan}
          onAddItem={addItem}
        />
      </div>
    </ModalShell>
  );
}