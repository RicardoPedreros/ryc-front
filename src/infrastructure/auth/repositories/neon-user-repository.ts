import type { IUserRepository, AuthResult } from '@/domain/auth/repositories/user-repository';
import type { User } from '@/domain/auth/entities/user';
import { getSql } from '@/infrastructure/market/neon-client';

interface UserRow {
  id: string;
  role_id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    roleId: row.role_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    isActive: row.is_active,
    lastLogin: row.last_login,
    createdAt: row.created_at,
  };
}

interface AuthenticateRow {
  id: string;
  username: string;
  role_id: string;
  is_active: boolean;
}

export class NeonUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE username = ${username}` as unknown as UserRow[];
    return rows.length > 0 ? toUser(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE id = ${id}` as unknown as UserRow[];
    return rows.length > 0 ? toUser(rows[0]) : null;
  }

  async authenticate(username: string, password: string): Promise<AuthResult | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT id, username, role_id, is_active
      FROM users
      WHERE username = ${username}
        AND password_hash = crypt(${password}, password_hash)
    ` as unknown as AuthenticateRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      roleId: row.role_id,
      isActive: row.is_active,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    const sql = getSql();
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${id}`;
  }
}
