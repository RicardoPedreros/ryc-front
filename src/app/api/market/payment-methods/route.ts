import { NextResponse } from 'next/server';
import { PaymentMethodUseCases } from '@/application/market/payment-method-use-cases';
import { NeonPaymentMethodRepository } from '@/infrastructure/market/repositories/neon-payment-method-repository';

const paymentMethodUseCases = new PaymentMethodUseCases(new NeonPaymentMethodRepository());

export async function GET() {
  try {
    const paymentMethods = await paymentMethodUseCases.findAll();
    return NextResponse.json(paymentMethods);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
