export interface PurchaseItem {
  readonly id: string;
  readonly purchaseId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string | null;
  readonly lot: string | null;
  readonly totalPrice: number;
}

export interface CreatePurchaseItem {
  readonly purchaseId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly expirationDate?: string | null;
  readonly lot?: string | null;
}
