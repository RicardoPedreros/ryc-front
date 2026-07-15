export interface InventoryMovement {
  readonly id: string;
  readonly productId: string;
  readonly purchaseItemId: string | null;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly movementDate: Date;
  readonly notes: string | null;
}

export interface CreateInventoryMovement {
  readonly productId: string;
  readonly purchaseItemId?: string | null;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly notes?: string | null;
}

export interface InventoryStock {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly currentStock: number;
}
