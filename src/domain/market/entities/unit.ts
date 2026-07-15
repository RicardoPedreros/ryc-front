export interface Unit {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly createdAt: Date;
}

export interface CreateUnit {
  readonly name: string;
  readonly symbol: string;
}
