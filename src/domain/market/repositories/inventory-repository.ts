import type { InventoryMovement, CreateInventoryMovement, InventoryStock } from '../entities/inventory-movement';

export interface CreateBatchAdjustment {
  readonly productId: string;
  readonly quantity: number;
  readonly movementTypeId: string;
  readonly notes?: string | null;
}

export interface CreatePurchaseMovementItem {
  readonly productId: string;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string | null;
  readonly lot: string | null;
}

export interface IInventoryRepository {
  findAllMovements(): Promise<readonly InventoryMovement[]>;
  findMovementsByProductId(productId: string): Promise<readonly InventoryMovement[]>;
  findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]>;
  getStock(): Promise<readonly InventoryStock[]>;
  createMovement(movement: CreateInventoryMovement): Promise<InventoryMovement>;
  createBatchMovements(movements: readonly CreateBatchAdjustment[]): Promise<readonly InventoryMovement[]>;
  createPurchaseMovements(purchaseId: string, items: readonly CreatePurchaseMovementItem[]): Promise<readonly InventoryMovement[]>;
}
