import type { Product, CreateProduct, UpdateProduct } from '../entities/product';

export interface ProductSearchResult {
  readonly id: string;
  readonly name: string;
  readonly brandName: string | null;
  readonly categoryName: string | null;
  readonly unitSymbol: string | null;
  readonly presentationQuantity: number | null;
  readonly barcode: string | null;
}

export interface IProductRepository {
  findAll(): Promise<readonly Product[]>;
  findById(id: string): Promise<Product | null>;
  searchByName(query: string): Promise<readonly ProductSearchResult[]>;
  findByBarcode(barcode: string): Promise<ProductSearchResult | null>;
  create(product: CreateProduct): Promise<Product>;
  update(id: string, product: UpdateProduct): Promise<Product | null>;
  remove(id: string): Promise<boolean>;
}
