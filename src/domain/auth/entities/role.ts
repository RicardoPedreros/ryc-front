export interface Role {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date;
}
