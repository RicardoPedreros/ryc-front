import type { Purchase, CreatePurchase, UpdatePurchase } from '@/domain/market/entities/purchase';
import type { PurchaseItem, CreatePurchaseItem } from '@/domain/market/entities/purchase-item';
import type { IPurchaseRepository } from '@/domain/market/repositories/purchase-repository';
import { getSql } from '../neon-client';

interface PurchaseRow {
  id: string;
  store_id: string | null;
  purchase_date: Date;
  payment_method_id: string | null;
  total: number | null;
  notes: string | null;
  created_at: Date;
}

interface PurchaseItemRow {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  expiration_date: Date | null;
  lot: string | null;
  total_price: number;
}

function toPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    storeId: row.store_id,
    purchaseDate: row.purchase_date instanceof Date
      ? row.purchase_date.toISOString().split('T')[0]
      : String(row.purchase_date),
    paymentMethodId: row.payment_method_id,
    total: row.total,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toPurchaseItem(row: PurchaseItemRow): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    expirationDate: row.expiration_date instanceof Date
      ? row.expiration_date.toISOString().split('T')[0]
      : row.expiration_date ? String(row.expiration_date) : null,
    lot: row.lot,
    totalPrice: row.total_price,
  };
}

export class NeonPurchaseRepository implements IPurchaseRepository {
  async findAll(): Promise<readonly Purchase[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM purchases ORDER BY purchase_date DESC` as PurchaseRow[];
    return rows.map(toPurchase);
  }

  async findById(id: string): Promise<Purchase | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM purchases WHERE id = ${id}` as PurchaseRow[];
    return rows.length > 0 ? toPurchase(rows[0]) : null;
  }

  async findItemsByPurchaseId(purchaseId: string): Promise<readonly PurchaseItem[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM purchase_items WHERE purchase_id = ${purchaseId}` as PurchaseItemRow[];
    return rows.map(toPurchaseItem);
  }

  async create(purchase: CreatePurchase): Promise<Purchase> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO purchases (store_id, purchase_date, payment_method_id, total, notes)
      VALUES (${purchase.storeId ?? null}, ${purchase.purchaseDate}, ${purchase.paymentMethodId ?? null}, ${purchase.total ?? null}, ${purchase.notes ?? null})
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
        total = COALESCE(${purchase.total ?? null}, total),
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

  async addItem(item: CreatePurchaseItem): Promise<PurchaseItem> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, discount, expiration_date, lot)
      VALUES (${item.purchaseId}, ${item.productId}, ${item.quantity}, ${item.unitPrice}, ${item.discount ?? 0}, ${item.expirationDate ?? null}, ${item.lot ?? null})
      RETURNING *
    ` as PurchaseItemRow[];
    return toPurchaseItem(rows[0]);
  }

  async removeItem(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM purchase_items WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
}
