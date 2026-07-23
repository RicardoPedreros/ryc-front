import type { CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { IPurchaseRepository } from '@/domain/market/repositories/purchase-repository';
import type { IInventoryRepository } from '@/domain/market/repositories/inventory-repository';
import type { IProductRepository } from '@/domain/market/repositories/product-repository';

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
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll() {
    return this.purchaseRepository.findAll();
  }

  async findById(id: string) {
    return this.purchaseRepository.findById(id);
  }

  async findItems(purchaseId: string) {
    return this.purchaseRepository.findMovementsByPurchaseId(purchaseId);
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
    const sql = (await import('@/infrastructure/market/neon-client')).getSql();
    const rows = await sql`SELECT id FROM movement_types WHERE code = 'PURCHASE' LIMIT 1`;
    return rows.length > 0 ? (rows[0] as { id: string }).id : null;
  }
}
