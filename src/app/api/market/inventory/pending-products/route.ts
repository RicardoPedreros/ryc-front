import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { apiRoute, badRequest } from '@/shared/route-helpers';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    return inventoryUseCases.getPendingTemporalProducts(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
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
      session?.id ?? null,
      session?.roleCode ?? null,
    );

    return NextResponse.json({ success: true, linked }, { status: 200 });
  });
}