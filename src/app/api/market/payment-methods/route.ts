import { PaymentMethodUseCases } from '@/application/market/payment-method-use-cases';
import { NeonPaymentMethodRepository } from '@/infrastructure/market/repositories/neon-payment-method-repository';
import { apiRoute } from '@/shared/route-helpers';

const paymentMethodUseCases = new PaymentMethodUseCases(new NeonPaymentMethodRepository());

export async function GET() {
  return apiRoute(async () => paymentMethodUseCases.findAll());
}