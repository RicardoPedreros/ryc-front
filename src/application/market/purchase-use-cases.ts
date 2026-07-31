import type { CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { InventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IPurchaseRepository, PurchaseItemDetail, PurchaseWithItems } from '@/domain/market/repositories/purchase-repository';
import type { IInventoryRepository } from '@/domain/market/repositories/inventory-repository';
import type { IMovementTypeRepository } from '@/domain/market/repositories/movement-type-repository';

export interface PurchaseItemInput {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly expirationDate?: string | null;
  readonly lot?: string | null;
}

export class PurchaseUseCases {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly inventoryRepository: IInventoryRepository,
    private readonly movementTypeRepository: IMovementTypeRepository,
  ) {}

  async findAll() {
    return this.purchaseRepository.findAll();
  }

  async findAllWithItems(): Promise<readonly PurchaseWithItems[]> {
    const purchases = await this.purchaseRepository.findAllWithDetails();
    const itemsByPurchase = await this.findItemsWithProductsForPurchases(purchases.map((p) => p.id));
    return purchases.map((p) => ({
      ...p,
      items: itemsByPurchase.get(p.id) ?? [],
    }));
  }

  async findById(id: string) {
    return this.purchaseRepository.findById(id);
  }

  async findItems(purchaseId: string) {
    return this.purchaseRepository.findMovementsByPurchaseId(purchaseId);
  }

  async findItemsForPurchases(purchaseIds: readonly string[]): Promise<ReadonlyMap<string, InventoryMovement[]>> {
    const movements = await this.purchaseRepository.findMovementsByPurchaseIds(purchaseIds);
    const byPurchase = new Map<string, InventoryMovement[]>();
    for (const m of movements) {
      if (m.purchaseId == null) continue;
      const list = byPurchase.get(m.purchaseId) ?? [];
      list.push(m);
      byPurchase.set(m.purchaseId, list);
    }
    return byPurchase;
  }

  async findItemsWithProductsForPurchases(purchaseIds: readonly string[]): Promise<ReadonlyMap<string, PurchaseItemDetail[]>> {
    const movements = await this.purchaseRepository.findMovementsWithProductByPurchaseIds(purchaseIds);
    const byPurchase = new Map<string, PurchaseItemDetail[]>();
    for (const m of movements) {
      if (m.purchaseId == null) continue;
      const list = byPurchase.get(m.purchaseId) ?? [];
      list.push(m);
      byPurchase.set(m.purchaseId, list);
    }
    return byPurchase;
  }

  async create(purchase: CreatePurchase, items?: readonly PurchaseItemInput[]) {
    if (!purchase.purchaseDate) {
      throw new Error('Purchase date is required');
    }

    const created = await this.purchaseRepository.create(purchase);

    if (items && items.length > 0) {
      const purchaseTypeId = await this.getPurchaseMovementTypeId();
      if (!purchaseTypeId) {
        throw new Error('Movement type PURCHASE not found');
      }

      await this.inventoryRepository.createPurchaseMovements(
        created.id,
        items.map((item) => ({
          productId: item.productId,
          movementTypeId: purchaseTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          expirationDate: item.expirationDate ?? null,
          lot: item.lot ?? null,
        }))
      );
    }

    return created;
  }

  async update(id: string, purchase: UpdatePurchase) {
    const existing = await this.purchaseRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.purchaseRepository.update(id, purchase);
  }

  async remove(id: string) {
    return this.purchaseRepository.remove(id);
  }

  private async getPurchaseMovementTypeId(): Promise<string | null> {
    const movementType = await this.movementTypeRepository.findByCode('PURCHASE');
    return movementType?.id ?? null;
  }
}
