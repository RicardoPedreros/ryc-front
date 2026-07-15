import type { Product, CreateProduct, UpdateProduct } from '@/domain/market/entities/product';
import type { IProductRepository } from '@/domain/market/repositories/product-repository';
import { getSql } from '../neon-client';

interface ProductRow {
  id: string;
  category_id: string;
  unit_id: string;
  name: string;
  brand_id: string | null;
  presentation_quantity: number | null;
  barcode: string | null;
  is_active: boolean;
  created_at: Date;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    unitId: row.unit_id,
    name: row.name,
    brandId: row.brand_id,
    presentationQuantity: row.presentation_quantity,
    barcode: row.barcode,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export class NeonProductRepository implements IProductRepository {
  async findAll(): Promise<readonly Product[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM products ORDER BY name` as ProductRow[];
    return rows.map(toProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM products WHERE id = ${id}` as ProductRow[];
    return rows.length > 0 ? toProduct(rows[0]) : null;
  }

  async create(product: CreateProduct): Promise<Product> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO products (category_id, unit_id, name, brand_id, presentation_quantity, barcode)
      VALUES (${product.categoryId}, ${product.unitId}, ${product.name}, ${product.brandId ?? null}, ${product.presentationQuantity ?? null}, ${product.barcode ?? null})
      RETURNING *
    ` as ProductRow[];
    return toProduct(rows[0]);
  }

  async update(id: string, product: UpdateProduct): Promise<Product | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE products
      SET
        category_id = COALESCE(${product.categoryId}, category_id),
        unit_id = COALESCE(${product.unitId}, unit_id),
        name = COALESCE(${product.name}, name),
        brand_id = COALESCE(${product.brandId ?? null}, brand_id),
        presentation_quantity = COALESCE(${product.presentationQuantity ?? null}, presentation_quantity),
        barcode = COALESCE(${product.barcode ?? null}, barcode),
        is_active = COALESCE(${product.isActive ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    ` as ProductRow[];
    return rows.length > 0 ? toProduct(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
}
