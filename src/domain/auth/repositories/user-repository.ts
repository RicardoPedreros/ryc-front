import type { User } from '../entities/user';

export interface AuthResult {
  readonly id: string;
  readonly username: string;
  readonly roleId: string;
  readonly isActive: boolean;
}

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  authenticate(username: string, password: string): Promise<AuthResult | null>;
  updateLastLogin(id: string): Promise<void>;
}
