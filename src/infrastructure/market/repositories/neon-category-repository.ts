import type { Category, CreateCategory, UpdateCategory } from '@/domain/market/entities/category';
import type { ICategoryRepository } from '@/domain/market/repositories/category-repository';
import { getSql } from '../neon-client';

interface CategoryRow {
  id: string;
  parent_category_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: Date;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentCategoryId: row.parent_category_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  };
}

export class NeonCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<readonly Category[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM categories ORDER BY name` as CategoryRow[];
    return rows.map(toCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM categories WHERE id = ${id}` as CategoryRow[];
    return rows.length > 0 ? toCategory(rows[0]) : null;
  }

  async create(category: CreateCategory): Promise<Category> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO categories (name, parent_category_id, icon, color)
      VALUES (${category.name}, ${category.parentCategoryId ?? null}, ${category.icon ?? null}, ${category.color ?? null})
      RETURNING *
    ` as CategoryRow[];
    return toCategory(rows[0]);
  }

  async update(id: string, category: UpdateCategory): Promise<Category | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE categories
      SET
        name = COALESCE(${category.name}, name),
        parent_category_id = COALESCE(${category.parentCategoryId ?? null}, parent_category_id),
        icon = COALESCE(${category.icon ?? null}, icon),
        color = COALESCE(${category.color ?? null}, color)
      WHERE id = ${id}
      RETURNING *
    ` as CategoryRow[];
    return rows.length > 0 ? toCategory(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM categories WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
}
