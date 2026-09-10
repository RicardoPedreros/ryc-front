export interface Product {
  readonly id: string;
  readonly categoryId: string;
  readonly unitId: string;
  readonly name: string;
  readonly brandId: string | null;
  readonly parentProductId: string | null;
  readonly presentationQuantity: number | null;
  readonly stockQuantity: number;
  readonly minStock: number;
  readonly minDays: number;
  readonly notificate: boolean;
  readonly barcode: string | null;
  readonly isActive: boolean;
  readonly createdBy: string | null;
  readonly createdAt: Date;
}

export interface CreateProduct {
  readonly categoryId: string;
  readonly unitId: string;
  readonly name: string;
  readonly brandId?: string | null;
  readonly parentProductId?: string | null;
  readonly presentationQuantity?: number | null;
  readonly stockQuantity?: number;
  readonly minStock?: number;
  readonly minDays?: number;
  readonly notificate?: boolean;
  readonly barcode?: string | null;
  readonly createdBy?: string | null;
}

export interface UpdateProduct {
  readonly categoryId?: string;
  readonly unitId?: string;
  readonly name?: string;
  readonly brandId?: string | null;
  readonly parentProductId?: string | null;
  readonly presentationQuantity?: number | null;
  readonly stockQuantity?: number;
  readonly minStock?: number;
  readonly minDays?: number;
  readonly notificate?: boolean;
  readonly barcode?: string | null;
  readonly isActive?: boolean;
}
