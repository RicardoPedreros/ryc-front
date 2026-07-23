import type { Brand, CreateBrand, UpdateBrand } from '../entities/brand';

export interface BrandWithChildren extends Brand {
  readonly children: readonly BrandWithChildren[];
}

export interface IBrandRepository {
  findAll(): Promise<readonly Brand[]>;
  findById(id: string): Promise<Brand | null>;
  findChildren(parentId: string): Promise<readonly Brand[]>;
  findHierarchy(): Promise<readonly BrandWithChildren[]>;
  create(brand: CreateBrand): Promise<Brand>;
  update(id: string, brand: UpdateBrand): Promise<Brand | null>;
  remove(id: string): Promise<boolean>;
}
