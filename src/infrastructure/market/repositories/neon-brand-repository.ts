import type { Brand, CreateBrand, UpdateBrand } from '@/domain/market/entities/brand';
import type { IBrandRepository } from '@/domain/market/repositories/brand-repository';
import { getSql } from '../neon-client';

interface BrandRow {
  id: string;
  name: string;
  created_at: Date;
}

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export class NeonBrandRepository implements IBrandRepository {
  async findAll(): Promise<readonly Brand[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM brands ORDER BY name` as BrandRow[];
    return rows.map(toBrand);
  }

  async findById(id: string): Promise<Brand | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM brands WHERE id = ${id}` as BrandRow[];
    return rows.length > 0 ? toBrand(rows[0]) : null;
  }

  async create(brand: CreateBrand): Promise<Brand> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO brands (name)
      VALUES (${brand.name})
      RETURNING *
    ` as BrandRow[];
    return toBrand(rows[0]);
  }

  async update(id: string, brand: UpdateBrand): Promise<Brand | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE brands
      SET name = COALESCE(${brand.name}, name)
      WHERE id = ${id}
      RETURNING *
    ` as BrandRow[];
    return rows.length > 0 ? toBrand(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM brands WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
}
