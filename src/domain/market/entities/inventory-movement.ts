export interface InventoryMovement {
  readonly id: string;
  readonly productId: string;
  readonly purchaseId: string | null;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly unitPrice: number | null;
  readonly discount: number | null;
  readonly expirationDate: string | null;
  readonly lot: string | null;
  readonly movementDate: Date;
  readonly notes: string | null;
}

export interface CreateInventoryMovement {
  readonly productId: string;
  readonly purchaseId?: string | null;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly unitPrice?: number | null;
  readonly discount?: number | null;
  readonly expirationDate?: string | null;
  readonly lot?: string | null;
  readonly notes?: string | null;
}

export interface InventoryStock {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly currentStock: number;
}
