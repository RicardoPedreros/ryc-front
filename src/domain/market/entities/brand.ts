export interface Brand {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}

export interface CreateBrand {
  readonly name: string;
}

export interface UpdateBrand {
  readonly name?: string;
}
