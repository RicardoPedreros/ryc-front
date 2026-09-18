import type { CreateProduct, UpdateProduct } from '@/domain/market/entities/product';
import type { IProductRepository } from '@/domain/market/repositories/product-repository';
import { ValidationError } from '@/shared/errors';

export class ProductUseCases {
  constructor(private readonly productRepository: IProductRepository) {}

  async findAll() {
    return this.productRepository.findAll();
  }

  async findManyWithVisibility(userId: string | null, roleCode: string | null) {
    return this.productRepository.findManyWithVisibility(userId, roleCode);
  }

  async findAllWithDetails() {
    return this.productRepository.findAllWithDetails();
  }

  async findManyWithDetailsWithVisibility(userId: string | null, roleCode: string | null) {
    return this.productRepository.findManyWithDetailsWithVisibility(userId, roleCode);
  }

  async findById(id: string) {
    return this.productRepository.findById(id);
  }

  async searchByName(query: string, userId: string | null, roleCode: string | null) {
    return this.productRepository.searchByName(query, userId, roleCode);
  }

  async findByBarcode(barcode: string, userId: string | null, roleCode: string | null) {
    return this.productRepository.findByBarcode(barcode, userId, roleCode);
  }

  async create(product: CreateProduct) {
    if (!product.name.trim()) {
      throw new ValidationError('Product name is required');
    }
    if (!product.categoryId) {
      throw new ValidationError('Category is required');
    }
    if (!product.unitId) {
      throw new ValidationError('Unit is required');
    }
    if (product.stockQuantity != null && product.stockQuantity < 1) {
      throw new ValidationError('Stock quantity must be at least 1');
    }
    if (product.minStock != null && product.minStock < 1) {
      throw new ValidationError('Minimum stock must be at least 1');
    }
    if (product.minDays != null && product.minDays < 1) {
      throw new ValidationError('Minimum days must be at least 1');
    }
    return this.productRepository.create(product);
  }

  async update(id: string, product: UpdateProduct) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.productRepository.update(id, product);
  }

  async remove(id: string) {
    return this.productRepository.remove(id);
  }
}
