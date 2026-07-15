import type { CreateCategory, UpdateCategory } from '@/domain/market/entities/category';
import type { ICategoryRepository } from '@/domain/market/repositories/category-repository';

export class CategoryUseCases {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async findById(id: string) {
    return this.categoryRepository.findById(id);
  }

  async create(category: CreateCategory) {
    if (!category.name.trim()) {
      throw new Error('Category name is required');
    }
    return this.categoryRepository.create(category);
  }

  async update(id: string, category: UpdateCategory) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.categoryRepository.update(id, category);
  }

  async remove(id: string) {
    return this.categoryRepository.remove(id);
  }
}
