import type { PaymentMethod } from '../entities/payment-method';

export interface IPaymentMethodRepository {
  findAll(): Promise<readonly PaymentMethod[]>;
  findByCode(code: string): Promise<PaymentMethod | null>;
}
