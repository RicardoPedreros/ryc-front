import type { InventoryMovement, CreateInventoryMovement, InventoryStock, ProductLot } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { getSql } from '../neon-client';

interface InventoryMovementRow {
  id: string;
  product_id: string;
  purchase_id: string | null;
  movement_type_id: string;
  quantity: number;
  unit_price: number | null;
  discount: number | null;
  expiration_date: Date | null;
  lot: string | null;
  movement_date: Date;
  notes: string | null;
}

interface InventoryStockRow {
  id: string;
  name: string;
  brand: string | null;
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

function toInventoryMovement(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    purchaseId: row.purchase_id,
    movementTypeId: row.movement_type_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    expirationDate: row.expiration_date instanceof Date
      ? row.expiration_date.toISOString().split('T')[0]
      : row.expiration_date ? String(row.expiration_date) : null,
    lot: row.lot,
    movementDate: row.movement_date,
    notes: row.notes,
  };
}

function toInventoryStock(row: InventoryStockRow): InventoryStock {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
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
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        p.parent_product_id AS "parentProductId",
        c.name AS "categoryName",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        1 AS stock_quantity,
        p.min_stock,
        p.min_days,
        p.notificate,
        COALESCE((
          SELECT SUM(
            im2.quantity * mt2.stock_multiplier *
            CASE WHEN pp.id != p.id THEN COALESCE(pp.stock_quantity, 1) ELSE 1 END
          )
          FROM inventory_movements im2
          JOIN movement_types mt2 ON mt2.id = im2.movement_type_id
          JOIN products pp ON pp.id = im2.product_id
          WHERE im2.product_id = p.id
            OR pp.parent_product_id = p.id
        ), 0)::int AS current_stock,
        expiry.nearest_expiry,
        CASE
          WHEN expiry.nearest_expiry IS NOT NULL
            THEN (expiry.nearest_expiry::date - CURRENT_DATE)
          ELSE NULL
        END::int AS days_until_expiry
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN LATERAL (
        SELECT MIN(im.expiration_date) AS nearest_expiry
        FROM inventory_movements im
        JOIN movement_types mt ON mt.id = im.movement_type_id
        LEFT JOIN products cp ON cp.id = im.product_id
        WHERE (im.product_id = p.id OR cp.parent_product_id = p.id)
          AND im.expiration_date IS NOT NULL
          AND im.expiration_date >= CURRENT_DATE
          AND mt.stock_multiplier = 1
      ) expiry ON true
      WHERE p.parent_product_id IS NULL
        AND p.is_active = true
      ORDER BY p.name
    ` as InventoryStockRow[];
    return rows.map(toInventoryStock);
  }

  async getStockLots(productId?: string): Promise<readonly ProductLot[]> {
    const sql = getSql();
    const rows = productId != null
      ? await sql`
          SELECT
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END AS product_id,
            COALESCE(im.lot, 'Sin lote') AS lot,
            SUM(im.quantity * mt.stock_multiplier *
              CASE WHEN pp.parent_product_id IS NOT NULL THEN COALESCE(pp.stock_quantity, 1) ELSE 1 END
            )::int AS quantity,
            MAX(im.expiration_date) AS expiration_date,
            CASE
              WHEN MAX(im.expiration_date) IS NOT NULL
                THEN (MAX(im.expiration_date)::date - CURRENT_DATE)
              ELSE NULL
            END::int AS days_until_expiry,
            MAX(im.movement_date) AS latest_movement_date
          FROM inventory_movements im
          JOIN movement_types mt ON mt.id = im.movement_type_id
          JOIN products pp ON pp.id = im.product_id
          WHERE im.product_id = ${productId} OR pp.parent_product_id = ${productId}
          GROUP BY
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END,
            COALESCE(im.lot, 'Sin lote')
          HAVING SUM(im.quantity * mt.stock_multiplier *
            CASE WHEN pp.parent_product_id IS NOT NULL THEN COALESCE(pp.stock_quantity, 1) ELSE 1 END
          ) > 0
          ORDER BY
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END,
            MAX(im.expiration_date) ASC NULLS LAST
        ` as ProductLotRow[]
      : await sql`
          SELECT
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END AS product_id,
            COALESCE(im.lot, 'Sin lote') AS lot,
            SUM(im.quantity * mt.stock_multiplier *
              CASE WHEN pp.parent_product_id IS NOT NULL THEN COALESCE(pp.stock_quantity, 1) ELSE 1 END
            )::int AS quantity,
            MAX(im.expiration_date) AS expiration_date,
            CASE
              WHEN MAX(im.expiration_date) IS NOT NULL
                THEN (MAX(im.expiration_date)::date - CURRENT_DATE)
              ELSE NULL
            END::int AS days_until_expiry,
            MAX(im.movement_date) AS latest_movement_date
          FROM inventory_movements im
          JOIN movement_types mt ON mt.id = im.movement_type_id
          JOIN products pp ON pp.id = im.product_id
          GROUP BY
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END,
            COALESCE(im.lot, 'Sin lote')
          HAVING SUM(im.quantity * mt.stock_multiplier *
            CASE WHEN pp.parent_product_id IS NOT NULL THEN COALESCE(pp.stock_quantity, 1) ELSE 1 END
          ) > 0
          ORDER BY
            CASE WHEN pp.parent_product_id IS NOT NULL THEN pp.parent_product_id ELSE im.product_id END,
            MAX(im.expiration_date) ASC NULLS LAST
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
    const results: InventoryMovement[] = [];
    for (const m of movements) {
      const rows = await sql`
        INSERT INTO inventory_movements (product_id, movement_type_id, quantity, expiration_date, lot, notes)
        VALUES (${m.productId}, ${m.movementTypeId}, ${m.quantity}, ${m.expirationDate ?? null}, ${m.lot ?? null}, ${m.notes ?? null})
        RETURNING *
      ` as InventoryMovementRow[];
      results.push(toInventoryMovement(rows[0]));
    }
    return results;
  }

  async createPurchaseMovements(
    purchaseId: string,
    items: readonly { productId: string; movementTypeId: string; quantity: number; unitPrice: number; discount: number; expirationDate: string | null; lot: string | null }[]
  ): Promise<readonly InventoryMovement[]> {
    if (items.length === 0) return [];
    const sql = getSql();
    const results: InventoryMovement[] = [];
    for (const item of items) {
      const rows = await sql`
        INSERT INTO inventory_movements (product_id, purchase_id, movement_type_id, quantity, unit_price, discount, expiration_date, lot)
        VALUES (${item.productId}, ${purchaseId}, ${item.movementTypeId}, ${item.quantity}, ${item.unitPrice}, ${item.discount}, ${item.expirationDate ?? null}, ${item.lot ?? null})
        RETURNING *
      ` as InventoryMovementRow[];
      results.push(toInventoryMovement(rows[0]));
    }
    return results;
  }
}
