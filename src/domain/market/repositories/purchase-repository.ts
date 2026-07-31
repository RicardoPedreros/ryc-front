import type { Purchase, CreatePurchase, UpdatePurchase } from '../entities/purchase';
import type { InventoryMovement } from '../entities/inventory-movement';

export interface PurchaseListItem extends Purchase {
  readonly storeName: string | null;
  readonly paymentMethodName: string | null;
}

export interface PurchaseItemDetail extends InventoryMovement {
  readonly productName: string;
}

export interface PurchaseWithItems extends PurchaseListItem {
  readonly items: readonly PurchaseItemDetail[];
}

export interface IPurchaseRepository {
  findAll(): Promise<readonly Purchase[]>;
  findAllWithDetails(): Promise<readonly PurchaseListItem[]>;
  findById(id: string): Promise<Purchase | null>;
  findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]>;
  findMovementsByPurchaseIds(purchaseIds: readonly string[]): Promise<readonly InventoryMovement[]>;
  findMovementsWithProductByPurchaseIds(purchaseIds: readonly string[]): Promise<readonly PurchaseItemDetail[]>;
  create(purchase: CreatePurchase): Promise<Purchase>;
  update(id: string, purchase: UpdatePurchase): Promise<Purchase | null>;
  remove(id: string): Promise<boolean>;
}
