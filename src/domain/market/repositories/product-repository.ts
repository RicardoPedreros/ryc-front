import type { Product, CreateProduct, UpdateProduct } from '../entities/product';

export interface IProductRepository {
  findAll(): Promise<readonly Product[]>;
  findById(id: string): Promise<Product | null>;
  create(product: CreateProduct): Promise<Product>;
  update(id: string, product: UpdateProduct): Promise<Product | null>;
  remove(id: string): Promise<boolean>;
}
