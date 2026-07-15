export interface PaymentMethod {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly createdAt: Date;
}
