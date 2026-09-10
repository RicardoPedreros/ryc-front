export interface Brand {
  readonly id: string;
  readonly parentBrandId: string | null;
  readonly name: string;
  readonly icon: string | null;
  readonly color: string | null;
  readonly createdBy: string | null;
  readonly createdAt: Date;
}

export interface CreateBrand {
  readonly name: string;
  readonly parentBrandId?: string | null;
  readonly icon?: string | null;
  readonly color?: string | null;
  readonly createdBy?: string | null;
}

export interface UpdateBrand {
  readonly name?: string;
  readonly parentBrandId?: string | null;
  readonly icon?: string | null;
  readonly color?: string | null;
}
