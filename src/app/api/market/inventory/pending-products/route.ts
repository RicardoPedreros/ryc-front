import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET() {
  try {
    const pendings = await inventoryUseCases.getPendingTemporalProducts();
    return NextResponse.json(pendings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, temporalProductName, temporalBarcode } = body as {
      productId: string;
      temporalProductName: string | null;
      temporalBarcode: string | null;
    };

    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const linked = await inventoryUseCases.completeTemporalMovements(
      temporalProductName ?? null,
      temporalBarcode ?? null,
      productId,
    );

    return NextResponse.json({ success: true, linked }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}