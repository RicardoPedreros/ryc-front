export interface PurchaseItemDraft {
  readonly productId: string | null;
  readonly temporalProductName: string | null;
  readonly temporalBarcode: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string;
  readonly lot: string;
}

export function itemKey(item: PurchaseItemDraft): string {
  return item.productId ?? `temporal:${item.temporalProductName ?? ""}|${item.temporalBarcode ?? ""}`;
}

export function isTemporal(item: PurchaseItemDraft): boolean {
  return item.productId == null;
}

export function temporalDisplayName(item: PurchaseItemDraft): string {
  if (item.temporalProductName) return item.temporalProductName;
  if (item.temporalBarcode) return `Código ${item.temporalBarcode}`;
  return "Producto pendiente";
}

export function createPurchaseItem(overrides?: {
  readonly productId?: string;
  readonly temporalProductName?: string | null;
  readonly temporalBarcode?: string | null;
  readonly unitPrice?: number;
}): PurchaseItemDraft {
  return {
    productId: overrides?.productId ?? null,
    temporalProductName: overrides?.temporalProductName ?? null,
    temporalBarcode: overrides?.temporalBarcode ?? null,
    quantity: 1,
    unitPrice: overrides?.unitPrice ?? 0,
    discount: 0,
    expirationDate: "",
    lot: "",
  };
}