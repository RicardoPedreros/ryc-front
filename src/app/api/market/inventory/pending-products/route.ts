import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { apiRoute, badRequest } from '@/shared/route-helpers';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET() {
  return apiRoute(async () => inventoryUseCases.getPendingTemporalProducts());
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const body = await request.json();
    const { productId, temporalProductName, temporalBarcode } = body as {
      productId: string;
      temporalProductName: string | null;
      temporalBarcode: string | null;
    };

    if (!productId) badRequest('Product id is required');

    const linked = await inventoryUseCases.completeTemporalMovements(
      temporalProductName ?? null,
      temporalBarcode ?? null,
      productId,
    );

    return NextResponse.json({ success: true, linked }, { status: 200 });
  });
}