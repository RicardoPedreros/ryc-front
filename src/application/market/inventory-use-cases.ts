import type { CreateInventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { ValidationError } from '@/shared/errors';

export class InventoryUseCases {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async getStock() {
    return this.inventoryRepository.getStock();
  }

  async getStockLots(productId?: string) {
    return this.inventoryRepository.getStockLots(productId);
  }

  async getAdjustableProducts() {
    return this.inventoryRepository.findAdjustableProducts();
  }

  async findAllMovements() {
    return this.inventoryRepository.findAllMovements();
  }

  async findMovementsByProduct(productId: string) {
    return this.inventoryRepository.findMovementsByProductId(productId);
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

  async getPendingTemporalProducts() {
    return this.inventoryRepository.findPendingTemporalProducts();
  }

  async completeTemporalMovements(name: string | null, barcode: string | null, productId: string) {
    if (!productId) {
      throw new ValidationError('Product id is required');
    }
    return this.inventoryRepository.completeTemporalMovements(name, barcode, productId);
  }
}
