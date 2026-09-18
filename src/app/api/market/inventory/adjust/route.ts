import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import type { CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';
import { getUserIdFromSession } from '@/infrastructure/auth/session';
import { apiRoute, badRequest } from '@/shared/route-helpers';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET() {
  return apiRoute(async () => inventoryUseCases.getAdjustableProducts());
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const userId = getUserIdFromSession(request);
    const body = (await request.json()) as { movements: readonly CreateBatchAdjustment[] };

    if (!body.movements || !Array.isArray(body.movements) || body.movements.length === 0) {
      badRequest('movements array is required');
    }

    const valid = body.movements.filter((m) => m.quantity > 0);
    if (valid.length === 0) {
      badRequest('No adjustments with quantity > 0');
    }

    const withUser = valid.map((m) => ({ ...m, createdBy: userId }));
    const movements = await inventoryUseCases.createBatchAdjustments(withUser);
    return NextResponse.json({ created: movements.length, movements }, { status: 201 });
  });
}