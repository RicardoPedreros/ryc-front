import type { CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { InventoryMovement, UpdateInventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IPurchaseRepository, PurchaseItemDetail, PurchaseWithItems } from '@/domain/market/repositories/purchase-repository';
import type { IInventoryRepository } from '@/domain/market/repositories/inventory-repository';
import type { IMovementTypeRepository } from '@/domain/market/repositories/movement-type-repository';
import { NotFoundError, ValidationError } from '@/shared/errors';

export interface PurchaseItemInput {
  readonly productId: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly expirationDate?: string | null;
  readonly lot?: string | null;
  readonly temporalProductName?: string | null;
  readonly temporalBarcode?: string | null;
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

  async findManyWithVisibility(userId: string | null, roleCode: string | null) {
    return this.purchaseRepository.findManyWithVisibility(userId, roleCode);
  }

  async findAllWithItems(): Promise<readonly PurchaseWithItems[]> {
    return this.findAllWithItemsFiltered(null, null);
  }

  async findAllWithItemsFiltered(userId: string | null, roleCode: string | null): Promise<readonly PurchaseWithItems[]> {
    const purchases = await this.purchaseRepository.findManyWithDetailsWithVisibility(userId, roleCode);
    const itemsByPurchase = await this.findItemsWithProductsForPurchases(purchases.map((p) => p.id));
    return purchases.map((p) => ({
      ...p,
      items: itemsByPurchase.get(p.id) ?? [],
      computedTotal: (itemsByPurchase.get(p.id) ?? []).reduce(
        (sum, item) => sum + ((item.unitPrice ?? 0) * item.quantity - (item.discount ?? 0)),
        0,
      ),
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
      throw new ValidationError('Purchase date is required');
    }

    const created = await this.purchaseRepository.create(purchase);

    if (items && items.length > 0) {
      const purchaseTypeId = await this.getPurchaseMovementTypeId();
      if (!purchaseTypeId) {
        throw new NotFoundError('Movement type PURCHASE not found');
      }

      for (const item of items) {
        if (!item.productId && !item.temporalProductName && !item.temporalBarcode) {
          throw new ValidationError('Product is required');
        }
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
          temporalProductName: item.temporalProductName ?? null,
          temporalBarcode: item.temporalBarcode ?? null,
          createdBy: purchase.createdBy ?? null,
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

  async findItem(id: string): Promise<InventoryMovement | null> {
    return this.inventoryRepository.findMovementById(id);
  }

  async updateItem(id: string, updates: UpdateInventoryMovement): Promise<InventoryMovement | null> {
    const existing = await this.inventoryRepository.findMovementById(id);
    if (!existing) {
      return null;
    }
    if (!Number.isFinite(updates.quantity) || updates.quantity <= 0) {
      throw new ValidationError('Item quantity must be greater than 0');
    }
    return this.inventoryRepository.updateMovement(id, updates);
  }

  async remove(id: string) {
    return this.purchaseRepository.remove(id);
  }

  private async getPurchaseMovementTypeId(): Promise<string | null> {
    const movementType = await this.movementTypeRepository.findByCode('PURCHASE');
    return movementType?.id ?? null;
  }
}
