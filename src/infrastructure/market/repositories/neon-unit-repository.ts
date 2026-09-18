import type { Unit, CreateUnit } from '@/domain/market/entities/unit';
import type { IUnitRepository } from '@/domain/market/repositories/unit-repository';
import { getSql } from '../neon-client';
import { getAdminIds } from '@/infrastructure/auth/admin-ids';

interface UnitRow {
  id: string;
  name: string;
  symbol: string;
  parent_unit_id: string | null;
  parent_multiplier: number;
  created_by: string | null;
  created_at: Date;
}

function toUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    parentUnitId: row.parent_unit_id,
    parentMultiplier: row.parent_multiplier,
    createdBy: row.created_by,
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
      INSERT INTO units (name, symbol, parent_unit_id, parent_multiplier, created_by)
      VALUES (${unit.name}, ${unit.symbol}, ${unit.parentUnitId ?? null}, ${unit.parentMultiplier ?? 1}, ${unit.createdBy ?? null})
      RETURNING *
    ` as UnitRow[];
    return toUnit(rows[0]);
  }

  async findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Unit[]> {
    const sql = getSql();
    if (roleCode === 'admin') {
      const rows = await sql`SELECT * FROM units ORDER BY name` as UnitRow[];
      return rows.map(toUnit);
    }
    if (!userId) {
      const rows = await sql`SELECT * FROM units WHERE created_by IS NULL ORDER BY name` as UnitRow[];
      return rows.map(toUnit);
    }
    const adminIds = await getAdminIds();
    const rows = await sql`SELECT * FROM units WHERE created_by IS NULL OR created_by = ${userId} OR created_by = ANY(${adminIds}::uuid[]) ORDER BY name` as UnitRow[];
    return rows.map(toUnit);
  }
}
