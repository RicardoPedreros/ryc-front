export interface ShoppingItem {
  readonly id: string;
  readonly productId: string | null;
  readonly name: string;
  readonly brand: string;
  readonly presentationQuantity: number | null;
  readonly unitSymbol: string | null;
  readonly checked: boolean;
  readonly quantity: number;
}

function parseShoppingItem(raw: unknown): ShoppingItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? crypto.randomUUID()),
    productId: item.productId != null ? String(item.productId) : null,
    name: String(item.name ?? ""),
    brand: String(item.brand ?? ""),
    presentationQuantity:
      item.presentationQuantity != null ? Number(item.presentationQuantity) : null,
    unitSymbol: item.unitSymbol != null ? String(item.unitSymbol) : null,
    checked: Boolean(item.checked),
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
}

export function parseShoppingList(raw: string): ShoppingItem[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(parseShoppingItem);
}