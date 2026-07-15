import type { PaymentMethod } from '@/domain/market/entities/payment-method';
import type { IPaymentMethodRepository } from '@/domain/market/repositories/payment-method-repository';
import { getSql } from '../neon-client';

interface PaymentMethodRow {
  id: string;
  code: string;
  name: string;
  created_at: Date;
}

function toPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
  };
}

export class NeonPaymentMethodRepository implements IPaymentMethodRepository {
  async findAll(): Promise<readonly PaymentMethod[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM payment_methods ORDER BY name` as PaymentMethodRow[];
    return rows.map(toPaymentMethod);
  }

  async findByCode(code: string): Promise<PaymentMethod | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM payment_methods WHERE code = ${code}` as PaymentMethodRow[];
    return rows.length > 0 ? toPaymentMethod(rows[0]) : null;
  }
}
