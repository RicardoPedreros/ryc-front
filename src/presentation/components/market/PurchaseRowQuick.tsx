"use client";

import { useEffect, useRef, useState } from "react";
import { BrandChip } from "./BrandChip";
import type { BrandPathLookup } from "./BrandChip";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";
import { itemKey, isTemporal, temporalDisplayName } from "./purchase-draft";
import type { PurchaseItemDraft } from "./purchase-draft";

interface PurchaseRowQuickProps {
  readonly item: PurchaseItemDraft;
  readonly index: number;
  readonly productMap: ReadonlyMap<string, ProductSearchResult>;
  readonly brandPathLookup: BrandPathLookup;
  readonly brandIcons: ReadonlyMap<string, string | null>;
  readonly lastPrice: number | null;
  readonly focusKey: string | null;
  readonly onChange: (index: number, field: keyof PurchaseItemDraft, value: string | number) => void;
  readonly onRemove: (index: number) => void;
  readonly onEnterVence: () => void;
}

function formatPresentation(p: ProductSearchResult): string {
  const parts: string[] = [];
  if (p.presentationQuantity != null && p.unitSymbol) {
    parts.push(`${p.presentationQuantity}${p.unitSymbol}`);
  }
  return parts.join(" · ");
}

function formatPrice(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export function PurchaseRowQuick({
  item,
  index,
  productMap,
  brandPathLookup,
  brandIcons,
  lastPrice,
  focusKey,
  onChange,
  onRemove,
  onEnterVence,
}: PurchaseRowQuickProps) {
  const product = item.productId ? productMap.get(item.productId) : undefined;
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const venceRef = useRef<HTMLInputElement>(null);
  const [showMini, setShowMini] = useState(false);

  const key = itemKey(item);
  const isFocused = focusKey === key;

  useEffect(() => {
    if (focusKey === key) {
      qtyRef.current?.focus();
      qtyRef.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const chainTo = (from: number) => {
    if (from === 1) priceRef.current?.focus();
    else if (from === 2) venceRef.current?.focus();
    else onEnterVence();
  };

  return (
    <div className={`mkt-purchase-quick-item ${isFocused ? "focusing" : ""}`}>
      <div className="mkt-purchase-quick-head">
        <span className="mkt-purchase-quick-name">
          {isTemporal(item) ? (
            <>
              {temporalDisplayName(item)}
              <span className="mkt-pending-badge">Pendiente</span>
            </>
          ) : (
            product?.name ?? "—"
          )}
          {product?.brandName && (
            <span className="mkt-purchase-form-item-meta">
              {" — "}
              <BrandChip
                brandName={product.brandName}
                brandPath={product.brandId ? (brandPathLookup.byId.get(product.brandId) ?? null) : null}
                brandIcon={product.brandId ? (brandIcons.get(product.brandId) ?? null) : null}
              />
            </span>
          )}
          {(() => {
            if (!product) return null;
            const pres = formatPresentation(product);
            return pres ? <span className="mkt-purchase-form-item-meta"> ({pres})</span> : null;
          })()}
        </span>
        {lastPrice != null && lastPrice > 0 && (
          <span className="mkt-purchase-quick-last" title="Último precio cargado">
            últ. {formatPrice(lastPrice)}
          </span>
        )}
        <button type="button" className="mkt-purchase-form-item-remove" onClick={() => onRemove(index)} aria-label="Quitar producto">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="mkt-purchase-quick-fields">
        <div className="mkt-form-group">
          <label className="mkt-form-label-sm">Cant.</label>
          <input
            ref={qtyRef}
            className="mkt-form-input-sm"
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chainTo(1); } }}
          />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label-sm">Precio/u</label>
          <input
            ref={priceRef}
            className="mkt-form-input-sm"
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice || ""}
            placeholder="$0.00"
            onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chainTo(2); } }}
          />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label-sm">Vence</label>
          <input
            ref={venceRef}
            className="mkt-form-input-sm"
            type="date"
            value={item.expirationDate}
            onChange={(e) => onChange(index, "expirationDate", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); chainTo(3); } }}
          />
        </div>
      </div>

      <button type="button" className="mkt-purchase-quick-more" onClick={() => setShowMini((s) => !s)}>
        {showMini ? "− Ocultar opciones" : "+ Lote · Descuento (opcional)"}
      </button>

      {showMini && (
        <div className="mkt-purchase-quick-mini">
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Lote</label>
            <input
              className="mkt-form-input-sm"
              type="text"
              value={item.lot}
              placeholder="—"
              onChange={(e) => onChange(index, "lot", e.target.value)}
            />
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label-sm">Descuento</label>
            <input
              className="mkt-form-input-sm"
              type="number"
              min="0"
              step="0.01"
              value={item.discount || ""}
              placeholder="$0"
              onChange={(e) => onChange(index, "discount", Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}