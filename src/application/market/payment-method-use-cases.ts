import type { IPaymentMethodRepository } from '@/domain/market/repositories/payment-method-repository';

export class PaymentMethodUseCases {
  constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) {}

  async findAll() {
    return this.paymentMethodRepository.findAll();
  }

  async findByCode(code: string) {
    return this.paymentMethodRepository.findByCode(code);
  }
}
