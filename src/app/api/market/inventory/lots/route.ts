import { NextRequest } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { apiRoute } from '@/shared/route-helpers';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") ?? undefined;
    return inventoryUseCases.getStockLots(productId);
  });
}