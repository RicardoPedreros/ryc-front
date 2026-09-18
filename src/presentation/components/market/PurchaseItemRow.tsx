"use client";

import { BrandChip } from "./BrandChip";
import { Icon } from "@/presentation/components/ui/Icon";
import type { BrandPathLookup } from "./BrandChip";
import type { ProductSearchResult } from "@/domain/market/repositories/product-repository";
import { itemKey, isTemporal, temporalDisplayName } from "./purchase-draft";
import type { PurchaseItemDraft } from "./purchase-draft";

interface PurchaseItemRowProps {
  readonly item: PurchaseItemDraft;
  readonly productMap: ReadonlyMap<string, ProductSearchResult>;
  readonly brandPathLookup: BrandPathLookup;
  readonly brandIcons: ReadonlyMap<string, string | null>;
  readonly onChange: (index: number, field: keyof PurchaseItemDraft, value: string | number) => void;
  readonly onRemove: (index: number) => void;
  readonly index: number;
}

function formatPresentation(p: ProductSearchResult): string {
  const parts: string[] = [];
  if (p.presentationQuantity != null && p.unitSymbol) {
    parts.push(`${p.presentationQuantity}${p.unitSymbol}`);
  }
  return parts.join(" · ");
}

export function PurchaseItemRow({
  item,
  productMap,
  brandPathLookup,
  brandIcons,
  onChange,
  onRemove,
  index,
}: PurchaseItemRowProps) {
  const product = item.productId ? productMap.get(item.productId) : undefined;

  return (
    <div key={itemKey(item)} className="mkt-purchase-form-item">
      <div className="mkt-purchase-form-item-header">
        <span className="mkt-purchase-form-item-name">
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
        <button type="button" className="mkt-purchase-form-item-remove" onClick={() => onRemove(index)} aria-label="Quitar producto">
          <Icon name="x" size={16} />
        </button>
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
            onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
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
            onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
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
            onChange={(e) => onChange(index, "discount", Number(e.target.value))}
          />
        </div>
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
          <label className="mkt-form-label-sm">Vence</label>
          <input
            className="mkt-form-input-sm"
            type="date"
            value={item.expirationDate}
            onChange={(e) => onChange(index, "expirationDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}