"use client";

import { Icon } from "@/presentation/components/ui/Icon";

export interface ProductWithStock {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly brandId: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly stockQuantity: number;
  readonly currentStock: number;
}

interface ProductPickerProps {
  readonly products: readonly ProductWithStock[];
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly onSelect: (productId: string) => void;
}

export function ProductPicker({ products, search, onSearchChange, onSelect }: ProductPickerProps) {
  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase().includes(q) ?? false) ||
      (p.categoryName?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="mkt-adjust">
      <div className="mkt-adjust-search">
        <Icon name="search" size={14} />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="mkt-card">
        {filteredProducts.length === 0 ? (
          <div className="mkt-empty-state">
            <p>No se encontraron productos</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="mkt-adjust-product-select"
              onClick={() => onSelect(product.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(product.id); } }}
            >
              <div className="mkt-adjust-product-select-info">
                  <span className="mkt-adjust-product-select-name">
                    {product.name}
                  </span>
                  <span className="mkt-adjust-product-select-meta">
                    {[
                      product.brand,
                      product.categoryName,
                      product.presentationQuantity && product.unitSymbol ? `${product.presentationQuantity} ${product.unitSymbol}` : null,
                    ].filter(Boolean).join(" · ")}
                  </span>
              </div>
              <div className="mkt-adjust-product-select-right">
                <span className={`mkt-adjust-product-select-stock ${product.currentStock === 0 ? "zero" : product.currentStock <= 2 ? "low" : ""}`}>
                  {product.currentStock} uds
                </span>
                <Icon name="chevron-right" size={14} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}