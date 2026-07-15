import type { Brand, CreateBrand, UpdateBrand } from '../entities/brand';

export interface IBrandRepository {
  findAll(): Promise<readonly Brand[]>;
  findById(id: string): Promise<Brand | null>;
  create(brand: CreateBrand): Promise<Brand>;
  update(id: string, brand: UpdateBrand): Promise<Brand | null>;
  remove(id: string): Promise<boolean>;
}
