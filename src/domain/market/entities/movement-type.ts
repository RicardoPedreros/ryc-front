export interface MovementType {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly stockMultiplier: number;
  readonly createdAt: Date;
}
