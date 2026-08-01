import type { InventoryMovement, CreateInventoryMovement, InventoryStock, ProductLot, AdjustableProduct } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { getSql } from '../neon-client';
import { toInventoryMovement, type InventoryMovementRow } from './inventory-movement-mapper';

interface InventoryStockRow {
  id: string;
  name: string;
  brand: string | null;
  brandPath: string | null;
  parentProductId: string | null;
  categoryName: string | null;
  unitSymbol: string | null;
  presentationQuantity: number | null;
  stock_quantity: number;
  min_stock: number;
  min_days: number;
  notificate: boolean;
  current_stock: number;
  nearest_expiry: string | null;
  days_until_expiry: number | null;
}

function toInventoryStock(row: InventoryStockRow): InventoryStock {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    brandPath: row.brandPath,
    parentProductId: row.parentProductId,
    categoryName: row.categoryName,
    unitSymbol: row.unitSymbol,
    presentationQuantity: row.presentationQuantity,
    stockQuantity: row.stock_quantity,
    minStock: row.min_stock,
    minDays: row.min_days,
    notificate: row.notificate,
    currentStock: row.current_stock,
    nearestExpiry: row.nearest_expiry,
    daysUntilExpiry: row.days_until_expiry,
  };
}

interface ProductLotRow {
  product_id: string;
  lot: string | null;
  quantity: number;
  expiration_date: Date | null;
  days_until_expiry: number | null;
  latest_movement_date: Date;
}

function toProductLot(row: ProductLotRow): ProductLot {
  return {
    productId: row.product_id,
    lot: row.lot ?? "Sin lote",
    quantity: row.quantity,
    expirationDate: row.expiration_date instanceof Date
      ? row.expiration_date.toISOString().split("T")[0]
      : row.expiration_date ? String(row.expiration_date) : null,
    daysUntilExpiry: row.days_until_expiry,
    latestMovementDate: row.latest_movement_date instanceof Date
      ? row.latest_movement_date.toISOString()
      : String(row.latest_movement_date),
  };
}

interface AdjustableProductRow {
  id: string;
  name: string;
  brand: string | null;
  brandId: string | null;
  categoryName: string | null;
  unitSymbol: string | null;
  presentationQuantity: number | null;
  stock_quantity: number;
  current_stock: number;
}

function toAdjustableProduct(row: AdjustableProductRow): AdjustableProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    brandId: row.brandId,
    categoryName: row.categoryName,
    unitSymbol: row.unitSymbol,
    presentationQuantity: row.presentationQuantity,
    stockQuantity: row.stock_quantity,
    currentStock: row.current_stock,
  };
}

export class NeonInventoryRepository implements IInventoryRepository {
  async findAllMovements(): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM inventory_movements ORDER BY movement_date DESC` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findMovementsByProductId(productId: string): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM inventory_movements WHERE product_id = ${productId} ORDER BY movement_date DESC` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT im.*, p.name AS product_name
      FROM inventory_movements im
      JOIN products p ON p.id = im.product_id
      WHERE im.purchase_id = ${purchaseId}
      ORDER BY im.movement_date DESC
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async getStock(): Promise<readonly InventoryStock[]> {
    const sql = getSql();
    const rows = await sql`
      WITH RECURSIVE brand_paths AS (
        SELECT
          b.id,
          b.parent_brand_id,
          b.name::text AS full_path
        FROM brands b
        WHERE b.parent_brand_id IS NULL
        UNION ALL
        SELECT
          b.id,
          b.parent_brand_id,
          bp.full_path || ' → ' || b.name AS full_path
        FROM brands b
        JOIN brand_paths bp ON b.parent_brand_id = bp.id
      ),
      balance_agg AS (
        SELECT
          product_id,
          SUM(current_stock)::int AS current_stock,
          MIN(CASE WHEN expiration_date < DATE '9999-12-31' AND current_stock > 0 THEN expiration_date END) AS nearest_expiry
        FROM inventory_balance
        GROUP BY product_id
      )
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        CASE
          WHEN b.id IS NULL THEN NULL
          WHEN b.parent_brand_id IS NULL THEN NULL
          ELSE bp.full_path
        END AS "brandPath",
        p.parent_product_id AS "parentProductId",
        c.name AS "categoryName",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        1 AS stock_quantity,
        p.min_stock,
        p.min_days,
        p.notificate,
        COALESCE(ba.current_stock, 0) AS current_stock,
        ba.nearest_expiry,
        CASE
          WHEN ba.nearest_expiry IS NOT NULL
            THEN (ba.nearest_expiry::date - CURRENT_DATE)
          ELSE NULL
        END::int AS days_until_expiry
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN brand_paths bp ON bp.id = p.brand_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN balance_agg ba ON ba.product_id = p.id
      WHERE p.parent_product_id IS NULL
        AND p.is_active = true
      ORDER BY p.name
    ` as InventoryStockRow[];
    return rows.map(toInventoryStock);
  }

  async findAdjustableProducts(): Promise<readonly AdjustableProduct[]> {
    const sql = getSql();
    const rows = await sql`
      WITH balance_agg AS (
        SELECT product_id, SUM(current_stock)::int AS current_stock
        FROM inventory_balance
        GROUP BY product_id
      )
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        p.brand_id AS "brandId",
        c.name AS "categoryName",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        1 AS stock_quantity,
        COALESCE(ba.current_stock, 0) AS current_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN balance_agg ba ON ba.product_id = p.id
      WHERE p.parent_product_id IS NULL
        AND p.is_active = true
      ORDER BY p.name
    ` as AdjustableProductRow[];
    return rows.map(toAdjustableProduct);
  }

  async getStockLots(productId?: string): Promise<readonly ProductLot[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        ib.product_id,
        COALESCE(latest.lot, 'Sin lote') AS lot,
        ib.current_stock::int AS quantity,
        ib.expiration_date AS expiration_date,
        CASE
          WHEN ib.expiration_date < DATE '9999-12-31'
            THEN (ib.expiration_date::date - CURRENT_DATE)
          ELSE NULL
        END::int AS days_until_expiry,
        COALESCE(latest.movement_date, ib.updated_at) AS latest_movement_date
      FROM inventory_balance ib
      LEFT JOIN LATERAL (
        SELECT im.lot, im.movement_date
        FROM inventory_movements im
        LEFT JOIN products pp ON pp.id = im.product_id
        WHERE COALESCE(pp.parent_product_id, im.product_id) = ib.product_id
          AND COALESCE(im.expiration_date, DATE '9999-12-31') = ib.expiration_date
        ORDER BY im.movement_date DESC
        LIMIT 1
      ) latest ON true
      WHERE ib.current_stock > 0
      ${productId != null
        ? sql`
            AND ib.product_id = ${productId}
          `
        : sql``}
      ORDER BY ib.product_id, ib.expiration_date ASC NULLS LAST
    ` as ProductLotRow[];
    return rows.map(toProductLot);
  }

  async createMovement(movement: CreateInventoryMovement): Promise<InventoryMovement> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, purchase_id, movement_type_id, quantity, unit_price, discount, expiration_date, lot, notes)
      VALUES (${movement.productId}, ${movement.purchaseId ?? null}, ${movement.movementTypeId}, ${movement.quantity}, ${movement.unitPrice ?? null}, ${movement.discount ?? 0}, ${movement.expirationDate ?? null}, ${movement.lot ?? null}, ${movement.notes ?? null})
      RETURNING *
    ` as InventoryMovementRow[];
    return toInventoryMovement(rows[0]);
  }

  async createBatchMovements(movements: readonly CreateBatchAdjustment[]): Promise<readonly InventoryMovement[]> {
    if (movements.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, movement_type_id, quantity, expiration_date, lot, notes)
      SELECT * FROM unnest(
        ${movements.map((m) => m.productId)}::uuid[],
        ${movements.map((m) => m.movementTypeId)}::uuid[],
        ${movements.map((m) => m.quantity)}::numeric[],
        ${movements.map((m) => m.expirationDate ?? null)}::date[],
        ${movements.map((m) => m.lot ?? null)}::text[],
        ${movements.map((m) => m.notes ?? null)}::text[]
      )
      RETURNING *
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async createPurchaseMovements(
    purchaseId: string,
    items: readonly { productId: string; movementTypeId: string; quantity: number; unitPrice: number; discount: number; expirationDate: string | null; lot: string | null }[]
  ): Promise<readonly InventoryMovement[]> {
    if (items.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, purchase_id, movement_type_id, quantity, unit_price, discount, expiration_date, lot)
      SELECT * FROM unnest(
        ${items.map((i) => i.productId)}::uuid[],
        ${Array(items.length).fill(purchaseId)}::uuid[],
        ${items.map((i) => i.movementTypeId)}::uuid[],
        ${items.map((i) => i.quantity)}::numeric[],
        ${items.map((i) => i.unitPrice)}::numeric[],
        ${items.map((i) => i.discount)}::numeric[],
        ${items.map((i) => i.expirationDate ?? null)}::date[],
        ${items.map((i) => i.lot ?? null)}::text[]
      )
      RETURNING *
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }
}
