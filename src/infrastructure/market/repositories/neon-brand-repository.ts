import type { Brand, CreateBrand, UpdateBrand } from '@/domain/market/entities/brand';
import type { IBrandRepository, BrandWithChildren } from '@/domain/market/repositories/brand-repository';
import { getSql } from '../neon-client';

interface BrandRow {
  id: string;
  parent_brand_id: string | null;
  name: string;
  created_at: Date;
}

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    parentBrandId: row.parent_brand_id,
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

  async findChildren(parentId: string): Promise<readonly Brand[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM brands WHERE parent_brand_id = ${parentId} ORDER BY name` as BrandRow[];
    return rows.map(toBrand);
  }

  async findHierarchy(): Promise<readonly BrandWithChildren[]> {
    const sql = getSql();
    const allRows = await sql`SELECT * FROM brands ORDER BY name` as BrandRow[];
    const allBrands = allRows.map(toBrand);

    function buildTree(parentId: string | null): BrandWithChildren[] {
      const brands = allBrands.filter((b) => b.parentBrandId === parentId);
      return brands.map((b) => ({
        ...b,
        children: buildTree(b.id),
      }));
    }

    return buildTree(null);
  }

  async create(brand: CreateBrand): Promise<Brand> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO brands (name, parent_brand_id)
      VALUES (${brand.name}, ${brand.parentBrandId ?? null})
      RETURNING *
    ` as BrandRow[];
    return toBrand(rows[0]);
  }

  async update(id: string, brand: UpdateBrand): Promise<Brand | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE brands
      SET
        name = COALESCE(${brand.name}, name),
        parent_brand_id = COALESCE(${brand.parentBrandId ?? null}, parent_brand_id)
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
