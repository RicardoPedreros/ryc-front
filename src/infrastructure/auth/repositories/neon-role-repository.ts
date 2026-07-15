import type { Role } from '@/domain/auth/entities/role';
import type { IRoleRepository } from '@/domain/auth/repositories/role-repository';
import { getSql } from '@/infrastructure/market/neon-client';

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: Date;
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export class NeonRoleRepository implements IRoleRepository {
  async findById(id: string): Promise<Role | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM roles WHERE id = ${id}` as RoleRow[];
    return rows.length > 0 ? toRole(rows[0]) : null;
  }

  async findByCode(code: string): Promise<Role | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM roles WHERE code = ${code}` as RoleRow[];
    return rows.length > 0 ? toRole(rows[0]) : null;
  }

  async findAll(): Promise<readonly Role[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM roles ORDER BY name` as RoleRow[];
    return rows.map(toRole);
  }
}
