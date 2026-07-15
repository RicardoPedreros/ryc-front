import type { Role } from '../entities/role';

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  findAll(): Promise<readonly Role[]>;
}
