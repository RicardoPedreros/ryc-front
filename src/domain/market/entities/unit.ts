export interface Unit {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly parentUnitId: string | null;
  readonly parentMultiplier: number;
  readonly createdBy: string | null;
  readonly createdAt: Date;
}

export interface CreateUnit {
  readonly name: string;
  readonly symbol: string;
  readonly parentUnitId?: string | null;
  readonly parentMultiplier?: number;
  readonly createdBy?: string | null;
}
