import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { getUserIdFromSession } from '@/infrastructure/auth/session';
import { apiRoute } from '@/shared/route-helpers';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      return inventoryUseCases.findMovementsByProduct(productId);
    }

    return inventoryUseCases.getStock();
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const userId = getUserIdFromSession(request);
    const body = await request.json();
    const movement = await inventoryUseCases.createMovement({ ...body, createdBy: userId });
    return NextResponse.json(movement, { status: 201 });
  });
}