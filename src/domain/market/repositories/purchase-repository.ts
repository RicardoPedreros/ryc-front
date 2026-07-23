import type { Purchase, CreatePurchase, UpdatePurchase } from '../entities/purchase';
import type { InventoryMovement } from '../entities/inventory-movement';

export interface IPurchaseRepository {
  findAll(): Promise<readonly Purchase[]>;
  findById(id: string): Promise<Purchase | null>;
  findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]>;
  create(purchase: CreatePurchase): Promise<Purchase>;
  update(id: string, purchase: UpdatePurchase): Promise<Purchase | null>;
  remove(id: string): Promise<boolean>;
}
