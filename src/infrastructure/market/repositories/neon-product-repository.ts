import type { Product, CreateProduct, UpdateProduct } from '@/domain/market/entities/product';
import type { IProductRepository, ProductSearchResult } from '@/domain/market/repositories/product-repository';
import { getSql } from '../neon-client';

interface ProductRow {
  id: string;
  category_id: string;
  unit_id: string;
  name: string;
  brand_id: string | null;
  parent_product_id: string | null;
  presentation_quantity: number | null;
  stock_quantity: number;
  min_stock: number;
  min_days: number;
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
    parentProductId: row.parent_product_id,
    presentationQuantity: row.presentation_quantity,
    stockQuantity: row.stock_quantity,
    minStock: row.min_stock,
    minDays: row.min_days,
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
      INSERT INTO products (category_id, unit_id, name, brand_id, parent_product_id, presentation_quantity, stock_quantity, min_stock, min_days, barcode)
      VALUES (${product.categoryId}, ${product.unitId}, ${product.name}, ${product.brandId ?? null}, ${product.parentProductId ?? null}, ${product.presentationQuantity ?? null}, ${product.stockQuantity ?? 1}, ${product.minStock ?? 1}, ${product.minDays ?? 7}, ${product.barcode ?? null})
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
        parent_product_id = COALESCE(${product.parentProductId ?? null}, parent_product_id),
        presentation_quantity = COALESCE(${product.presentationQuantity ?? null}, presentation_quantity),
        stock_quantity = COALESCE(${product.stockQuantity ?? null}, stock_quantity),
        min_stock = COALESCE(${product.minStock ?? null}, min_stock),
        min_days = COALESCE(${product.minDays ?? null}, min_days),
        barcode = COALESCE(${product.barcode ?? null}, barcode),
        is_active = COALESCE(${product.isActive ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    ` as ProductRow[];
    return rows.length > 0 ? toProduct(rows[0]) : null;
  }

  async findAllWithDetails(): Promise<readonly ProductSearchResult[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        p.brand_id AS "brandId",
        b.name AS "brandName",
        p.parent_product_id AS "parentProductId",
        p.category_id AS "categoryId",
        c.name AS "categoryName",
        p.unit_id AS "unitId",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        p.stock_quantity AS "stockQuantity",
        p.min_stock AS "minStock",
        p.min_days AS "minDays",
        p.barcode
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = true
      ORDER BY p.name
    ` as ProductSearchResult[];
    return rows;
  }

  async searchByName(query: string): Promise<readonly ProductSearchResult[]> {
    const sql = getSql();
    const pattern = `%${query}%`;
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        p.brand_id AS "brandId",
        b.name AS "brandName",
        p.parent_product_id AS "parentProductId",
        p.category_id AS "categoryId",
        c.name AS "categoryName",
        p.unit_id AS "unitId",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        p.stock_quantity AS "stockQuantity",
        p.min_stock AS "minStock",
        p.min_days AS "minDays",
        p.barcode
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = true
        AND (p.name ILIKE ${pattern} OR b.name ILIKE ${pattern})
      ORDER BY p.name
      LIMIT 20
    ` as ProductSearchResult[];
    return rows;
  }

  async findByBarcode(barcode: string): Promise<ProductSearchResult | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        p.brand_id AS "brandId",
        b.name AS "brandName",
        p.parent_product_id AS "parentProductId",
        p.category_id AS "categoryId",
        c.name AS "categoryName",
        p.unit_id AS "unitId",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        p.stock_quantity AS "stockQuantity",
        p.min_stock AS "minStock",
        p.min_days AS "minDays",
        p.barcode
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = true AND p.barcode = ${barcode}
      LIMIT 1
    ` as ProductSearchResult[];
    return rows.length > 0 ? rows[0] : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
}
