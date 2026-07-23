export interface Brand {
  readonly id: string;
  readonly parentBrandId: string | null;
  readonly name: string;
  readonly createdAt: Date;
}

export interface CreateBrand {
  readonly name: string;
  readonly parentBrandId?: string | null;
}

export interface UpdateBrand {
  readonly name?: string;
  readonly parentBrandId?: string | null;
}
