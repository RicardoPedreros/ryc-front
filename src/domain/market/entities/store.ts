export interface Store {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly city: string | null;
  readonly createdAt: Date;
}

export interface CreateStore {
  readonly name: string;
  readonly address?: string | null;
  readonly city?: string | null;
}

export interface UpdateStore {
  readonly name?: string;
  readonly address?: string | null;
  readonly city?: string | null;
}
