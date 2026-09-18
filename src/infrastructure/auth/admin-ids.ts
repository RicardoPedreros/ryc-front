import { getSql } from '@/infrastructure/market/neon-client';

let cachedAdminIds: readonly string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

export async function getAdminIds(): Promise<readonly string[]> {
  const now = Date.now();
  if (cachedAdminIds && now - cacheTimestamp < CACHE_TTL) return cachedAdminIds;

  const sql = getSql();
  const rows = await sql`
    SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE LOWER(r.code) = 'admin'
  ` as { id: string }[];

  cachedAdminIds = rows.map((r) => r.id);
  cacheTimestamp = now;
  return cachedAdminIds;
}