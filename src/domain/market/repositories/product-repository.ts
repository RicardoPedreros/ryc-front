import type { Product, CreateProduct, UpdateProduct } from '../entities/product';

export interface ProductSearchResult {
  readonly id: string;
  readonly name: string;
  readonly brandId: string | null;
  readonly brandName: string | null;
  readonly parentProductId: string | null;
  readonly categoryId: string;
  readonly categoryName: string | null;
  readonly unitId: string;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly stockQuantity: number;
  readonly minStock: number;
  readonly minDays: number;
  readonly barcode: string | null;
}

export interface IProductRepository {
  findAll(): Promise<readonly Product[]>;
  findAllWithDetails(): Promise<readonly ProductSearchResult[]>;
  findById(id: string): Promise<Product | null>;
  searchByName(query: string): Promise<readonly ProductSearchResult[]>;
  findByBarcode(barcode: string): Promise<ProductSearchResult | null>;
  create(product: CreateProduct): Promise<Product>;
  update(id: string, product: UpdateProduct): Promise<Product | null>;
  remove(id: string): Promise<boolean>;
}
