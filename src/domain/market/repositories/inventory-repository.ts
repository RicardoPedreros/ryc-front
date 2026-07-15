import type { InventoryMovement, CreateInventoryMovement, InventoryStock } from '../entities/inventory-movement';

export interface CreateBatchAdjustment {
  readonly productId: string;
  readonly quantity: number;
  readonly movementTypeId: string;
  readonly notes?: string | null;
}

export interface IInventoryRepository {
  findAllMovements(): Promise<readonly InventoryMovement[]>;
  findMovementsByProductId(productId: string): Promise<readonly InventoryMovement[]>;
  getStock(): Promise<readonly InventoryStock[]>;
  createMovement(movement: CreateInventoryMovement): Promise<InventoryMovement>;
  createBatchMovements(movements: readonly CreateBatchAdjustment[]): Promise<readonly InventoryMovement[]>;
}
