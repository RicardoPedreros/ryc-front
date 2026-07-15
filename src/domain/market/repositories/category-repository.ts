import type { Category, CreateCategory, UpdateCategory } from '../entities/category';

export interface ICategoryRepository {
  findAll(): Promise<readonly Category[]>;
  findById(id: string): Promise<Category | null>;
  create(category: CreateCategory): Promise<Category>;
  update(id: string, category: UpdateCategory): Promise<Category | null>;
  remove(id: string): Promise<boolean>;
}
