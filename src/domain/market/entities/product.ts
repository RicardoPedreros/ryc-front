export interface Product {
  readonly id: string;
  readonly categoryId: string;
  readonly unitId: string;
  readonly name: string;
  readonly brandId: string | null;
  readonly presentationQuantity: number | null;
  readonly barcode: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface CreateProduct {
  readonly categoryId: string;
  readonly unitId: string;
  readonly name: string;
  readonly brandId?: string | null;
  readonly presentationQuantity?: number | null;
  readonly barcode?: string | null;
}

export interface UpdateProduct {
  readonly categoryId?: string;
  readonly unitId?: string;
  readonly name?: string;
  readonly brandId?: string | null;
  readonly presentationQuantity?: number | null;
  readonly barcode?: string | null;
  readonly isActive?: boolean;
}
