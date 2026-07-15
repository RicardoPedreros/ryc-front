import type { MovementType } from '@/domain/market/entities/movement-type';
import type { IMovementTypeRepository } from '@/domain/market/repositories/movement-type-repository';
import { getSql } from '../neon-client';

interface MovementTypeRow {
  id: string;
  code: string;
  name: string;
  stock_multiplier: number;
  created_at: Date;
}

function toMovementType(row: MovementTypeRow): MovementType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    stockMultiplier: row.stock_multiplier,
    createdAt: row.created_at,
  };
}

export class NeonMovementTypeRepository implements IMovementTypeRepository {
  async findAll(): Promise<readonly MovementType[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM movement_types ORDER BY name` as MovementTypeRow[];
    return rows.map(toMovementType);
  }

  async findByCode(code: string): Promise<MovementType | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM movement_types WHERE code = ${code}` as MovementTypeRow[];
    return rows.length > 0 ? toMovementType(rows[0]) : null;
  }
}
