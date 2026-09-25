"use client";

import { Icon } from "@/presentation/components/ui/Icon";
import type { ShoppingItem } from "@/shared/types/shopping-item";

function formatPresentation(qty: number | null, unit: string | null): string {
  if (qty == null) return "";
  const unitStr = unit ?? "";
  return `${qty}${unitStr}`;
}

interface ShoppingItemRowProps {
  readonly item: ShoppingItem;
  readonly done: boolean;
  readonly onToggle: (id: string) => void;
  readonly onRemove: (id: string) => void;
}

export function ShoppingItemRow({ item, done, onToggle, onRemove }: ShoppingItemRowProps) {
  return (
    <div
      className={`mkt-list-item ${done ? "done" : ""}`}
      onClick={() => onToggle(item.id)}
    >
      <button
        type="button"
        className={done ? "mkt-list-check checked" : "mkt-list-check"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id);
        }}
        aria-label={done ? `Desmarcar ${item.name}` : `Marcar ${item.name}`}
      >
        <Icon name="check" size={12} stroke="#fff" strokeWidth={2.5} />
      </button>
      <div className="mkt-list-item-body">
        <span className={done ? "mkt-list-item-name done" : "mkt-list-item-name"}>{item.name}</span>
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
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        aria-label={`Eliminar ${item.name}`}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}