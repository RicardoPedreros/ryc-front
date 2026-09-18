import type { CreateInventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { ValidationError } from '@/shared/errors';

export class InventoryUseCases {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async getStock(userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.getStock(userId, roleCode);
  }

  async getStockLots(productId?: string, userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.getStockLots(productId, userId, roleCode);
  }

  async getAdjustableProducts(userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.findAdjustableProducts(userId, roleCode);
  }

  async findAllMovements(userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.findAllMovements(userId, roleCode);
  }

  async findMovementsByProduct(productId: string, userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.findMovementsByProductId(productId, userId, roleCode);
  }

  async createMovement(movement: CreateInventoryMovement) {
    if (!movement.productId) {
      throw new ValidationError('Product is required');
    }
    if (movement.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero');
    }
    return this.inventoryRepository.createMovement(movement);
  }

  async createBatchAdjustments(movements: readonly CreateBatchAdjustment[]) {
    const valid = movements.filter((m) => m.quantity > 0);
    if (valid.length === 0) {
      throw new ValidationError('No adjustments with quantity > 0');
    }
    return this.inventoryRepository.createBatchMovements(valid);
  }

  async getPendingTemporalProducts(userId?: string | null, roleCode?: string | null) {
    return this.inventoryRepository.findPendingTemporalProducts(userId, roleCode);
  }

  async completeTemporalMovements(name: string | null, barcode: string | null, productId: string, userId?: string | null, roleCode?: string | null) {
    if (!productId) {
      throw new ValidationError('Product id is required');
    }
    return this.inventoryRepository.completeTemporalMovements(name, barcode, productId, userId, roleCode);
  }
}
