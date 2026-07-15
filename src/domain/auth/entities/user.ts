export interface User {
  readonly id: string;
  readonly roleId: string;
  readonly username: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly isActive: boolean;
  readonly lastLogin: Date | null;
  readonly createdAt: Date;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly roleId: string;
  readonly roleCode: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
}
