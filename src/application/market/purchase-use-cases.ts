import type { CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { CreatePurchaseItem } from '@/domain/market/entities/purchase-item';
import type { IPurchaseRepository } from '@/domain/market/repositories/purchase-repository';

export class PurchaseUseCases {
  constructor(private readonly purchaseRepository: IPurchaseRepository) {}

  async findAll() {
    return this.purchaseRepository.findAll();
  }

  async findById(id: string) {
    return this.purchaseRepository.findById(id);
  }

  async findItems(purchaseId: string) {
    return this.purchaseRepository.findItemsByPurchaseId(purchaseId);
  }

  async create(purchase: CreatePurchase) {
    if (!purchase.purchaseDate) {
      throw new Error('Purchase date is required');
    }
    return this.purchaseRepository.create(purchase);
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

  async addItem(item: CreatePurchaseItem) {
    if (!item.productId) {
      throw new Error('Product is required');
    }
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (item.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
    return this.purchaseRepository.addItem(item);
  }

  async removeItem(id: string) {
    return this.purchaseRepository.removeItem(id);
  }
}
