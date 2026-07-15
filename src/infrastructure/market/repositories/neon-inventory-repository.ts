import type { InventoryMovement, CreateInventoryMovement, InventoryStock } from '@/domain/market/entities/inventory-movement';
import type { IInventoryRepository, CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { getSql } from '../neon-client';

interface InventoryMovementRow {
  id: string;
  product_id: string;
  purchase_item_id: string | null;
  movement_type_id: string;
  quantity: number;
  movement_date: Date;
  notes: string | null;
}

interface InventoryStockRow {
  id: string;
  name: string;
  brand: string | null;
  categoryName: string | null;
  unitSymbol: string | null;
  presentationQuantity: number | null;
  current_stock: number;
}

function toInventoryMovement(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    purchaseItemId: row.purchase_item_id,
    movementTypeId: row.movement_type_id,
    quantity: row.quantity,
    movementDate: row.movement_date,
    notes: row.notes,
  };
}

function toInventoryStock(row: InventoryStockRow): InventoryStock {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryName: row.categoryName,
    unitSymbol: row.unitSymbol,
    presentationQuantity: row.presentationQuantity,
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

  async getStock(): Promise<readonly InventoryStock[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        c.name AS "categoryName",
        u.symbol AS "unitSymbol",
        p.presentation_quantity AS "presentationQuantity",
        COALESCE(inv.current_stock, 0)::int AS current_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN inventory inv ON p.id = inv.id
      WHERE p.is_active = true
      ORDER BY p.name
    ` as InventoryStockRow[];
    return rows.map(toInventoryStock);
  }

  async createMovement(movement: CreateInventoryMovement): Promise<InventoryMovement> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO inventory_movements (product_id, purchase_item_id, movement_type_id, quantity, notes)
      VALUES (${movement.productId}, ${movement.purchaseItemId ?? null}, ${movement.movementTypeId}, ${movement.quantity}, ${movement.notes ?? null})
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
        INSERT INTO inventory_movements (product_id, movement_type_id, quantity, notes)
        VALUES (${m.productId}, ${m.movementTypeId}, ${m.quantity}, ${m.notes ?? null})
        RETURNING *
      ` as InventoryMovementRow[];
      results.push(toInventoryMovement(rows[0]));
    }
    return results;
  }
}
