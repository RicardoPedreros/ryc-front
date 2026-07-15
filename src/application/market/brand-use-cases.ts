import type { CreateBrand, UpdateBrand } from '@/domain/market/entities/brand';
import type { IBrandRepository } from '@/domain/market/repositories/brand-repository';

export class BrandUseCases {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async findAll() {
    return this.brandRepository.findAll();
  }

  async findById(id: string) {
    return this.brandRepository.findById(id);
  }

  async create(brand: CreateBrand) {
    if (!brand.name.trim()) {
      throw new Error('Brand name is required');
    }
    return this.brandRepository.create(brand);
  }

  async update(id: string, brand: UpdateBrand) {
    const existing = await this.brandRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.brandRepository.update(id, brand);
  }

  async remove(id: string) {
    return this.brandRepository.remove(id);
  }
}
