import type { Store, CreateStore, UpdateStore } from '@/domain/market/entities/store';
import type { IStoreRepository } from '@/domain/market/repositories/store-repository';
import { getSql } from '../neon-client';

interface StoreRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  created_at: Date;
}

function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
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
      INSERT INTO stores (name, address, city)
      VALUES (${store.name}, ${store.address ?? null}, ${store.city ?? null})
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
}
