import { NextRequest, NextResponse } from 'next/server';
import { PurchaseUseCases } from '@/application/market/purchase-use-cases';
import { NeonPurchaseRepository } from '@/infrastructure/market/repositories/neon-purchase-repository';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { NeonProductRepository } from '@/infrastructure/market/repositories/neon-product-repository';

const purchaseUseCases = new PurchaseUseCases(
  new NeonPurchaseRepository(),
  new NeonInventoryRepository(),
  new NeonProductRepository(),
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const purchase = await purchaseUseCases.findById(id);
      if (!purchase) {
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
      }

      const items = await purchaseUseCases.findItems(id);
      return NextResponse.json({ ...purchase, items });
    }

    const purchases = await purchaseUseCases.findAll();
    return NextResponse.json(purchases);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...purchaseData } = body;
    const purchase = await purchaseUseCases.create(purchaseData, items);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase id is required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await purchaseUseCases.update(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase id is required' }, { status: 400 });
    }

    const deleted = await purchaseUseCases.remove(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
