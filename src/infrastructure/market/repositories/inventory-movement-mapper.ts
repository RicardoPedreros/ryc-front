import type { InventoryMovement } from '@/domain/market/entities/inventory-movement';

export interface InventoryMovementRow {
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

export function toInventoryMovement(row: InventoryMovementRow): InventoryMovement {
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
