import type { Unit, CreateUnit } from '@/domain/market/entities/unit';
import type { IUnitRepository } from '@/domain/market/repositories/unit-repository';
import { getSql } from '../neon-client';

interface UnitRow {
  id: string;
  name: string;
  symbol: string;
  created_at: Date;
}

function toUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    createdAt: row.created_at,
  };
}

export class NeonUnitRepository implements IUnitRepository {
  async findAll(): Promise<readonly Unit[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM units ORDER BY name` as UnitRow[];
    return rows.map(toUnit);
  }

  async findById(id: string): Promise<Unit | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM units WHERE id = ${id}` as UnitRow[];
    return rows.length > 0 ? toUnit(rows[0]) : null;
  }

  async create(unit: CreateUnit): Promise<Unit> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO units (name, symbol)
      VALUES (${unit.name}, ${unit.symbol})
      RETURNING *
    ` as UnitRow[];
    return toUnit(rows[0]);
  }
}
