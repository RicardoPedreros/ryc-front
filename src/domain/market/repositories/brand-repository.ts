import type { Brand, CreateBrand, UpdateBrand } from '../entities/brand';

export interface BrandWithChildren extends Brand {
  readonly children: readonly BrandWithChildren[];
}

export interface IBrandRepository {
  findAll(): Promise<readonly Brand[]>;
  findById(id: string): Promise<Brand | null>;
  findHierarchy(): Promise<readonly Brand[]>;
  findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Brand[]>;
  findHierarchyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Brand[]>;
  create(brand: CreateBrand): Promise<Brand>;
  update(id: string, brand: UpdateBrand): Promise<Brand | null>;
  remove(id: string): Promise<boolean>;
}
