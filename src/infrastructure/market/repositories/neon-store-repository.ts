import type { Store, CreateStore, UpdateStore } from '@/domain/market/entities/store';
import type { IStoreRepository } from '@/domain/market/repositories/store-repository';
import { getSql } from '../neon-client';
import { getAdminIds } from '@/infrastructure/auth/admin-ids';

interface StoreRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  created_by: string | null;
  created_at: Date;
}

function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export class NeonStoreRepository implements IStoreRepository {
  async findAll(): Promise<readonly Store[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM stores ORDER BY name` as StoreRow[];
    return rows.map(toStore);
  }

  async findById(id: string): Promise<Store | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM stores WHERE id = ${id}` as StoreRow[];
    return rows.length > 0 ? toStore(rows[0]) : null;
  }

  async create(store: CreateStore): Promise<Store> {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO stores (name, address, city, created_by)
      VALUES (${store.name}, ${store.address ?? null}, ${store.city ?? null}, ${store.createdBy ?? null})
      RETURNING *
    ` as StoreRow[];
    return toStore(rows[0]);
  }

  async update(id: string, store: UpdateStore): Promise<Store | null> {
    const sql = getSql();
    const rows = await sql`
      UPDATE stores
      SET
        name = COALESCE(${store.name}, name),
        address = COALESCE(${store.address ?? null}, address),
        city = COALESCE(${store.city ?? null}, city)
      WHERE id = ${id}
      RETURNING *
    ` as StoreRow[];
    return rows.length > 0 ? toStore(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`DELETE FROM stores WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  async findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Store[]> {
    const sql = getSql();
    if (roleCode === 'admin') {
      const rows = await sql`SELECT * FROM stores ORDER BY name` as StoreRow[];
      return rows.map(toStore);
    }
    if (!userId) {
      const rows = await sql`SELECT * FROM stores WHERE created_by IS NULL ORDER BY name` as StoreRow[];
      return rows.map(toStore);
    }
    const adminIds = await getAdminIds();
    const rows = await sql`SELECT * FROM stores WHERE created_by IS NULL OR created_by = ${userId} OR created_by = ANY(${adminIds}::uuid[]) ORDER BY name` as StoreRow[];
    return rows.map(toStore);
  }
}
