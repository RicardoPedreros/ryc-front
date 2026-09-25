import type { InventoryMovement, CreateInventoryMovement, UpdateInventoryMovement, InventoryStock, ProductLot, AdjustableProduct, PendingTemporalProduct } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment, CreatePurchaseMovementItem } from '@/domain/market/repositories/inventory-repository';
import { getSql } from '../neon-client';
import { getAdminIds } from '@/infrastructure/auth/admin-ids';
import { toInventoryMovement, type InventoryMovementRow } from './inventory-movement-mapper';

interface PendingTemporalProductRow {
  temporalProductName: string | null;
  temporalBarcode: string | null;
  movement_count: number;
  total_quantity: number;
  first_date: Date;
  latest_date: Date;
}

function toDateString(value: Date | string | null): string {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : '';
}

function toPendingTemporalProduct(row: PendingTemporalProductRow): PendingTemporalProduct {
  return {
    temporalProductName: row.temporalProductName,
    temporalBarcode: row.temporalBarcode,
    movementCount: Number(row.movement_count),
    totalQuantity: Number(row.total_quantity),
    firstMovementDate: toDateString(row.first_date),
    latestMovementDate: toDateString(row.latest_date),
  };
}

interface InventoryStockRow {
  id: string;
  name: string;
  brand: string | null;
  brandPath: string | null;
  brandIcon: string | null;
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
    brandIcon: row.brandIcon,
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
  async findAllMovements(userId?: string | null, roleCode?: string | null): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT im.*
      FROM inventory_movements im
      WHERE ${roleCode === 'admin'
          ? sql`TRUE`
          : userId
            ? sql`im.created_by = ${userId}`
            : sql`FALSE`}
      ORDER BY im.movement_date DESC
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findMovementsByProductId(productId: string, userId?: string | null, roleCode?: string | null): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT im.*
      FROM inventory_movements im
      WHERE im.product_id = ${productId}
        AND ${roleCode === 'admin'
          ? sql`TRUE`
          : userId
            ? sql`im.created_by = ${userId}`
            : sql`FALSE`}
      ORDER BY im.movement_date DESC
    ` as InventoryMovementRow[];
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

  async findMovementById(id: string): Promise<InventoryMovement | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT im.*
      FROM inventory_movements im
      WHERE im.id = ${id}
    ` as InventoryMovementRow[];
    return rows.length > 0 ? toInventoryMovement(rows[0]) : null;
  }

  async updateMovement(id: string, updates: UpdateInventoryMovement): Promise<InventoryMovement | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE inventory_movements
      SET
        quantity = ${updates.quantity},
        unit_price = ${updates.unitPrice},
        discount = ${updates.discount},
        expiration_date = ${updates.expirationDate},
        lot = ${updates.lot}
      WHERE id = ${id}
      RETURNING *
    ` as InventoryMovementRow[];
    return rows.length > 0 ? toInventoryMovement(rows[0]) : null;
  }

  async getStock(userId?: string | null, roleCode?: string | null): Promise<readonly InventoryStock[]> {
    if (roleCode !== 'admin' && !userId) return [];
    const sql = getSql();
    const adminIds = userId && roleCode !== 'admin' ? await getAdminIds() : [];
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
        ${roleCode !== 'admin' ? sql`WHERE created_by = ${userId}` : sql``}
        GROUP BY product_id
      )
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        b.icon AS "brandIcon",
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
        AND ${userId && roleCode !== 'admin'
          ? sql`(p.created_by IS NULL OR p.created_by = ${userId} OR p.created_by = ANY(${adminIds}::uuid[]))`
          : roleCode !== 'admin'
            ? sql`p.created_by IS NULL`
            : sql`TRUE`}
      ORDER BY p.name
    ` as InventoryStockRow[];
    return rows.map(toInventoryStock);
  }

  async findAdjustableProducts(userId?: string | null, roleCode?: string | null): Promise<readonly AdjustableProduct[]> {
    if (roleCode !== 'admin' && !userId) return [];
    const sql = getSql();
    const adminIds = userId && roleCode !== 'admin' ? await getAdminIds() : [];
    const rows = await sql`
      WITH balance_agg AS (
        SELECT product_id, SUM(current_stock)::int AS current_stock
        FROM inventory_balance
        ${roleCode !== 'admin' ? sql`WHERE created_by = ${userId}` : sql``}
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
        AND ${userId && roleCode !== 'admin'
          ? sql`(p.created_by IS NULL OR p.created_by = ${userId} OR p.created_by = ANY(${adminIds}::uuid[]))`
          : roleCode !== 'admin'
            ? sql`p.created_by IS NULL`
            : sql`TRUE`}
      ORDER BY p.name
    ` as AdjustableProductRow[];
    return rows.map(toAdjustableProduct);
  }

  async getStockLots(productId?: string, userId?: string | null, roleCode?: string | null): Promise<readonly ProductLot[]> {
    if (roleCode !== 'admin' && !userId) return [];
    const sql = getSql();
    const adminIds = userId && roleCode !== 'admin' ? await getAdminIds() : [];
    const rows = await sql`
      SELECT
        ib.product_id,
        COALESCE(ib.lot, 'Sin lote') AS lot,
        ib.current_stock::int AS quantity,
        ib.expiration_date AS expiration_date,
        CASE
          WHEN ib.expiration_date < DATE '9999-12-31'
            THEN (ib.expiration_date::date - CURRENT_DATE)
          ELSE NULL
        END::int AS days_until_expiry,
        COALESCE(latest.movement_date, ib.updated_at) AS latest_movement_date
      FROM inventory_balance ib
      JOIN products p ON p.id = ib.product_id
      LEFT JOIN LATERAL (
        SELECT im.lot, im.movement_date
        FROM inventory_movements im
        LEFT JOIN products pp ON pp.id = im.product_id
        WHERE COALESCE(pp.parent_product_id, im.product_id) = ib.product_id
          AND COALESCE(im.lot, '') = COALESCE(ib.lot, '')
          AND COALESCE(im.expiration_date, DATE '9999-12-31') = ib.expiration_date
          AND ${roleCode === 'admin'
            ? sql`TRUE`
            : sql`im.created_by = ${userId}`}
        ORDER BY im.movement_date DESC
        LIMIT 1
      ) latest ON true
      WHERE ib.current_stock > 0
        AND ${roleCode === 'admin'
          ? sql`TRUE`
          : sql`ib.created_by = ${userId}`}
        AND ${userId && roleCode !== 'admin'
          ? sql`(p.created_by IS NULL OR p.created_by = ${userId} OR p.created_by = ANY(${adminIds}::uuid[]))`
          : roleCode !== 'admin'
            ? sql`p.created_by IS NULL`
            : sql`TRUE`}
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
      INSERT INTO inventory_movements (product_id, purchase_id, movement_type_id, quantity, unit_price, discount, expiration_date, lot, temporal_product_name, temporal_barcode, notes, created_by)
      VALUES (${movement.productId ?? null}, ${movement.purchaseId ?? null}, ${movement.movementTypeId}, ${movement.quantity}, ${movement.unitPrice ?? null}, ${movement.discount ?? 0}, ${movement.expirationDate ?? null}, ${movement.lot ?? null}, ${movement.temporalProductName ?? null}, ${movement.temporalBarcode ?? null}, ${movement.notes ?? null}, ${movement.createdBy ?? null})
      RETURNING *
    ` as InventoryMovementRow[];
    return toInventoryMovement(rows[0]);
  }

  async createBatchMovements(movements: readonly CreateBatchAdjustment[]): Promise<readonly InventoryMovement[]> {
    if (movements.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, movement_type_id, quantity, expiration_date, lot, notes, created_by)
      SELECT * FROM unnest(
        ${movements.map((m) => m.productId)}::uuid[],
        ${movements.map((m) => m.movementTypeId)}::uuid[],
        ${movements.map((m) => m.quantity)}::numeric[],
        ${movements.map((m) => m.expirationDate ?? null)}::date[],
        ${movements.map((m) => m.lot ?? null)}::text[],
        ${movements.map((m) => m.notes ?? null)}::text[],
        ${movements.map((m) => m.createdBy ?? null)}::uuid[]
      )
      RETURNING *
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async createPurchaseMovements(
    purchaseId: string,
    items: readonly CreatePurchaseMovementItem[]
  ): Promise<readonly InventoryMovement[]> {
    if (items.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, purchase_id, movement_type_id, quantity, unit_price, discount, expiration_date, lot, temporal_product_name, temporal_barcode, created_by)
      SELECT * FROM unnest(
        ${items.map((i) => i.productId)}::uuid[],
        ${Array(items.length).fill(purchaseId)}::uuid[],
        ${items.map((i) => i.movementTypeId)}::uuid[],
        ${items.map((i) => i.quantity)}::numeric[],
        ${items.map((i) => i.unitPrice)}::numeric[],
        ${items.map((i) => i.discount)}::numeric[],
        ${items.map((i) => i.expirationDate ?? null)}::date[],
        ${items.map((i) => i.lot ?? null)}::text[],
        ${items.map((i) => i.temporalProductName ?? null)}::text[],
        ${items.map((i) => i.temporalBarcode ?? null)}::text[],
        ${items.map((i) => i.createdBy ?? null)}::uuid[]
      )
      RETURNING *
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findPendingTemporalProducts(userId?: string | null, roleCode?: string | null): Promise<readonly PendingTemporalProduct[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        im.temporal_product_name AS "temporalProductName",
        im.temporal_barcode AS "temporalBarcode",
        COUNT(*)::int AS movement_count,
        SUM(im.quantity)::numeric AS total_quantity,
        MIN(im.movement_date) AS first_date,
        MAX(im.movement_date) AS latest_date
      FROM inventory_movements im
      WHERE im.product_id IS NULL
        AND (im.temporal_product_name IS NOT NULL OR im.temporal_barcode IS NOT NULL)
        AND ${roleCode === 'admin'
          ? sql`TRUE`
          : userId
            ? sql`im.created_by = ${userId}`
            : sql`FALSE`}
      GROUP BY im.temporal_product_name, im.temporal_barcode
      ORDER BY latest_date DESC
    ` as PendingTemporalProductRow[];
    return rows.map(toPendingTemporalProduct);
  }

  async completeTemporalMovements(name: string | null, barcode: string | null, productId: string, userId?: string | null, roleCode?: string | null): Promise<number> {
    const sql = getSql();
    const rows = await sql`
      UPDATE inventory_movements
      SET
        product_id = ${productId},
        temporal_product_name = NULL,
        temporal_barcode = NULL
      WHERE product_id IS NULL
        AND temporal_product_name IS NOT DISTINCT FROM ${name}
        AND temporal_barcode IS NOT DISTINCT FROM ${barcode}
        AND ${roleCode === 'admin'
          ? sql`TRUE`
          : userId
            ? sql`created_by = ${userId}`
            : sql`FALSE`}
      RETURNING id
    ` as { id: string }[];
    return rows.length;
  }
}
