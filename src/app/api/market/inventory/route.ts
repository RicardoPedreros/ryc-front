import { NextRequest, NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const movements = await inventoryUseCases.findMovementsByProduct(productId);
      return NextResponse.json(movements);
    }

    const stock = await inventoryUseCases.getStock();
    return NextResponse.json(stock);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const movement = await inventoryUseCases.createMovement(body);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') || message.includes('greater') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
