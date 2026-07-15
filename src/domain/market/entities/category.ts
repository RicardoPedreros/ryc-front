export interface Category {
  readonly id: string;
  readonly parentCategoryId: string | null;
  readonly name: string;
  readonly icon: string | null;
  readonly color: string | null;
  readonly createdAt: Date;
}

export interface CreateCategory {
  readonly parentCategoryId?: string | null;
  readonly name: string;
  readonly icon?: string | null;
  readonly color?: string | null;
}

export interface UpdateCategory {
  readonly parentCategoryId?: string | null;
  readonly name?: string;
  readonly icon?: string | null;
  readonly color?: string | null;
}
