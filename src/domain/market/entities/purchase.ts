export interface Purchase {
  readonly id: string;
  readonly storeId: string | null;
  readonly purchaseDate: string;
  readonly paymentMethodId: string | null;
  readonly total: number | null;
  readonly notes: string | null;
  readonly createdAt: Date;
}

export interface CreatePurchase {
  readonly storeId?: string | null;
  readonly purchaseDate: string;
  readonly paymentMethodId?: string | null;
  readonly total?: number | null;
  readonly notes?: string | null;
}

export interface UpdatePurchase {
  readonly storeId?: string | null;
  readonly purchaseDate?: string;
  readonly paymentMethodId?: string | null;
  readonly total?: number | null;
  readonly notes?: string | null;
}
