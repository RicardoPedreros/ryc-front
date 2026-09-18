import type { Purchase, CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { InventoryMovement } from '@/domain/market/entities/inventory-movement';
import type { IPurchaseRepository, PurchaseListItem, PurchaseItemDetail } from '@/domain/market/repositories/purchase-repository';
import { getSql } from '../neon-client';
import { getAdminIds } from '@/infrastructure/auth/admin-ids';
import { toInventoryMovement, type InventoryMovementRow } from './inventory-movement-mapper';

interface PurchaseRow {
  id: string;
  store_id: string | null;
  purchase_date: Date;
  payment_method_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
}

interface PurchaseListItemRow extends PurchaseRow {
  store_name: string | null;
  payment_method_name: string | null;
}

interface PurchaseItemDetailRow extends InventoryMovementRow {
  product_name: string;
}

function toPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    storeId: row.store_id,
    purchaseDate: row.purchase_date instanceof Date
      ? row.purchase_date.toISOString().split('T')[0]
      : String(row.purchase_date),
    paymentMethodId: row.payment_method_id,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toPurchaseListItem(row: PurchaseListItemRow): PurchaseListItem {
  return {
    ...toPurchase(row),
    storeName: row.store_name,
    paymentMethodName: row.payment_method_name,
  };
}

function toPurchaseItemDetail(row: PurchaseItemDetailRow): PurchaseItemDetail {
  return {
    ...toInventoryMovement(row),
    productName: row.product_name,
  };
}

export class NeonPurchaseRepository implements IPurchaseRepository {
  async findAll(): Promise<readonly Purchase[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM purchases ORDER BY purchase_date DESC` as PurchaseRow[];
    return rows.map(toPurchase);
  }

  async findAllWithDetails(): Promise<readonly PurchaseListItem[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT
        p.id,
        p.store_id,
        p.purchase_date,
        p.payment_method_id,
        p.notes,
        p.created_by,
        p.created_at,
        s.name AS store_name,
        pm.name AS payment_method_name
      FROM purchases p
      LEFT JOIN stores s ON s.id = p.store_id
      LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
      ORDER BY p.purchase_date DESC
    ` as PurchaseListItemRow[];
    return rows.map(toPurchaseListItem);
  }

  async findById(id: string): Promise<Purchase | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM purchases WHERE id = ${id}` as PurchaseRow[];
    return rows.length > 0 ? toPurchase(rows[0]) : null;
  }

  async findMovementsByPurchaseId(purchaseId: string): Promise<readonly InventoryMovement[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT im.*
      FROM inventory_movements im
      WHERE im.purchase_id = ${purchaseId}
      ORDER BY im.movement_date DESC
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findMovementsByPurchaseIds(purchaseIds: readonly string[]): Promise<readonly InventoryMovement[]> {
    if (purchaseIds.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      SELECT im.*
      FROM inventory_movements im
      WHERE im.purchase_id = ANY(${purchaseIds}::uuid[])
      ORDER BY im.movement_date DESC
    ` as InventoryMovementRow[];
    return rows.map(toInventoryMovement);
  }

  async findMovementsWithProductByPurchaseIds(purchaseIds: readonly string[]): Promise<readonly PurchaseItemDetail[]> {
    if (purchaseIds.length === 0) return [];
    const sql = getSql();
    const rows = await sql`
      SELECT im.*, COALESCE(prod.name, im.temporal_product_name, 'Código ' || im.temporal_barcode, 'Producto pendiente') AS product_name
      FROM inventory_movements im
      LEFT JOIN products prod ON prod.id = im.product_id
      WHERE im.purchase_id = ANY(${purchaseIds}::uuid[])
      ORDER BY im.movement_date DESC
    ` as PurchaseItemDetailRow[];
    return rows.map(toPurchaseItemDetail);
  }

  async create(purchase: CreatePurchase): Promise<Purchase> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO purchases (store_id, purchase_date, payment_method_id, notes, created_by)
      VALUES (${purchase.storeId ?? null}, ${purchase.purchaseDate}, ${purchase.paymentMethodId ?? null}, ${purchase.notes ?? null}, ${purchase.createdBy ?? null})
      RETURNING *
    ` as PurchaseRow[];
    return toPurchase(rows[0]);
  }

  async update(id: string, purchase: UpdatePurchase): Promise<Purchase | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE purchases
      SET
        store_id = COALESCE(${purchase.storeId ?? null}, store_id),
        purchase_date = COALESCE(${purchase.purchaseDate}, purchase_date),
        payment_method_id = COALESCE(${purchase.paymentMethodId ?? null}, payment_method_id),
        notes = COALESCE(${purchase.notes ?? null}, notes)
      WHERE id = ${id}
      RETURNING *
    ` as PurchaseRow[];
    return rows.length > 0 ? toPurchase(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM purchases WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  async findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Purchase[]> {
    const sql = getSql();
    if (roleCode === 'admin') {
      const rows = await sql`SELECT * FROM purchases ORDER BY purchase_date DESC` as PurchaseRow[];
      return rows.map(toPurchase);
    }
    if (!userId) {
      const rows = await sql`SELECT * FROM purchases WHERE created_by IS NULL ORDER BY purchase_date DESC` as PurchaseRow[];
      return rows.map(toPurchase);
    }
    const adminIds = await getAdminIds();
    const rows = await sql`SELECT * FROM purchases WHERE created_by IS NULL OR created_by = ${userId} OR created_by = ANY(${adminIds}::uuid[]) ORDER BY purchase_date DESC` as PurchaseRow[];
    return rows.map(toPurchase);
  }

  async findManyWithDetailsWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly PurchaseListItem[]> {
    const sql = getSql();
    if (roleCode === 'admin') {
      const rows = await sql`
        SELECT p.id, p.store_id, p.purchase_date, p.payment_method_id, p.notes, p.created_by, p.created_at,
          s.name AS store_name, pm.name AS payment_method_name
        FROM purchases p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
        ORDER BY p.purchase_date DESC
      ` as PurchaseListItemRow[];
      return rows.map(toPurchaseListItem);
    }
    if (!userId) {
      const rows = await sql`
        SELECT p.id, p.store_id, p.purchase_date, p.payment_method_id, p.notes, p.created_by, p.created_at,
          s.name AS store_name, pm.name AS payment_method_name
        FROM purchases p
        LEFT JOIN stores s ON s.id = p.store_id
        LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
        WHERE p.created_by IS NULL
        ORDER BY p.purchase_date DESC
      ` as PurchaseListItemRow[];
      return rows.map(toPurchaseListItem);
    }
    const adminIds = await getAdminIds();
    const rows = await sql`
      SELECT p.id, p.store_id, p.purchase_date, p.payment_method_id, p.notes, p.created_by, p.created_at,
        s.name AS store_name, pm.name AS payment_method_name
      FROM purchases p
      LEFT JOIN stores s ON s.id = p.store_id
      LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
      WHERE p.created_by IS NULL OR p.created_by = ${userId} OR p.created_by = ANY(${adminIds}::uuid[])
      ORDER BY p.purchase_date DESC
    ` as PurchaseListItemRow[];
    return rows.map(toPurchaseListItem);
  }
}
