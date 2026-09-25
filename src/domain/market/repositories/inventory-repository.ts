import type { InventoryMovement, CreateInventoryMovement, UpdateInventoryMovement, InventoryStock, ProductLot, AdjustableProduct, PendingTemporalProduct } from '../entities/inventory-movement';

export interface CreateBatchAdjustment {
  readonly productId: string;
  readonly quantity: number;
  readonly movementTypeId: string;
  readonly expirationDate?: string | null;
  readonly lot?: string | null;
  readonly notes?: string | null;
  readonly createdBy?: string | null;
}

export interface CreatePurchaseMovementItem {
  readonly productId: string | null;
  readonly movementTypeId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly expirationDate: string | null;
  readonly lot: string | null;
  readonly temporalProductName?: string | null;
  readonly temporalBarcode?: string | null;
  readonly createdBy?: string | null;
}

export interface IInventoryRepository {
  findAllMovements(userId?: string | null, roleCode?: string | null): Promise<readonly InventoryMovement[]>;
  findMovementsByProductId(productId: string, userId?: string | null, roleCode?: string | null): Promise<readonly InventoryMovement[]>;
  findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]>;
  findMovementById(id: string): Promise<InventoryMovement | null>;
  updateMovement(id: string, updates: UpdateInventoryMovement): Promise<InventoryMovement | null>;
  getStock(userId?: string | null, roleCode?: string | null): Promise<readonly InventoryStock[]>;
  getStockLots(productId?: string, userId?: string | null, roleCode?: string | null): Promise<readonly ProductLot[]>;
  findAdjustableProducts(userId?: string | null, roleCode?: string | null): Promise<readonly AdjustableProduct[]>;
  createMovement(movement: CreateInventoryMovement): Promise<InventoryMovement>;
  createBatchMovements(movements: readonly CreateBatchAdjustment[]): Promise<readonly InventoryMovement[]>;
  createPurchaseMovements(purchaseId: string, items: readonly CreatePurchaseMovementItem[]): Promise<readonly InventoryMovement[]>;
  findPendingTemporalProducts(userId?: string | null, roleCode?: string | null): Promise<readonly PendingTemporalProduct[]>;
  completeTemporalMovements(name: string | null, barcode: string | null, productId: string, userId?: string | null, roleCode?: string | null): Promise<number>;
}
