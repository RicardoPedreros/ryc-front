import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import type { CreateBatchAdjustment } from '@/domain/market/repositories/inventory-repository';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET() {
  try {
    const products = await inventoryUseCases.getAdjustableProducts();
    return NextResponse.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { movements: readonly CreateBatchAdjustment[] };
    if (!body.movements || !Array.isArray(body.movements) || body.movements.length === 0) {
      return NextResponse.json({ error: 'movements array is required' }, { status: 400 });
    }

    const valid = body.movements.filter((m) => m.quantity > 0);
    if (valid.length === 0) {
      return NextResponse.json({ error: 'No adjustments with quantity > 0' }, { status: 400 });
    }

    const movements = await inventoryUseCases.createBatchAdjustments(valid);
    return NextResponse.json({ created: movements.length, movements }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
