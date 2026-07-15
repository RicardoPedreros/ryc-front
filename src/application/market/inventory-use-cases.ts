import type { CreateInventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';

export class InventoryUseCases {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async getStock() {
    return this.inventoryRepository.getStock();
  }

  async findAllMovements() {
    return this.inventoryRepository.findAllMovements();
  }

  async findMovementsByProduct(productId: string) {
    return this.inventoryRepository.findMovementsByProductId(productId);
  }

  async createMovement(movement: CreateInventoryMovement) {
    if (!movement.productId) {
      throw new Error('Product is required');
    }
    if (movement.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    return this.inventoryRepository.createMovement(movement);
  }

  async createBatchAdjustments(movements: readonly CreateBatchAdjustment[]) {
    const valid = movements.filter((m) => m.quantity > 0);
    if (valid.length === 0) {
      throw new Error('No adjustments with quantity > 0');
    }
    return this.inventoryRepository.createBatchMovements(valid);
  }
}
