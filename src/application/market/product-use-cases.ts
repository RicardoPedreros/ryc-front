import type { CreateProduct, UpdateProduct } from '@/domain/market/entities/product';
import type { IProductRepository } from '@/domain/market/repositories/product-repository';

export class ProductUseCases {
  constructor(private readonly productRepository: IProductRepository) {}

  async findAll() {
    return this.productRepository.findAll();
  }

  async findById(id: string) {
    return this.productRepository.findById(id);
  }

  async create(product: CreateProduct) {
    if (!product.name.trim()) {
      throw new Error('Product name is required');
    }
    if (!product.categoryId) {
      throw new Error('Category is required');
    }
    if (!product.unitId) {
      throw new Error('Unit is required');
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
