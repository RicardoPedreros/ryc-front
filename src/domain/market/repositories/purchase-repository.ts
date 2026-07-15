import type { Purchase, CreatePurchase, UpdatePurchase } from '../entities/purchase';
import type { PurchaseItem, CreatePurchaseItem } from '../entities/purchase-item';

export interface IPurchaseRepository {
  findAll(): Promise<readonly Purchase[]>;
  findById(id: string): Promise<Purchase | null>;
  findItemsByPurchaseId(purchaseId: string): Promise<readonly PurchaseItem[]>;
  create(purchase: CreatePurchase): Promise<Purchase>;
  update(id: string, purchase: UpdatePurchase): Promise<Purchase | null>;
  remove(id: string): Promise<boolean>;
  addItem(item: CreatePurchaseItem): Promise<PurchaseItem>;
  removeItem(id: string): Promise<boolean>;
}
