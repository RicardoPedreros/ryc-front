import { NextRequest, NextResponse } from 'next/server';
import { StoreUseCases } from '@/application/market/store-use-cases';
import { NeonStoreRepository } from '@/infrastructure/market/repositories/neon-store-repository';

const storeUseCases = new StoreUseCases(new NeonStoreRepository());

export async function GET() {
  try {
    const stores = await storeUseCases.findAll();
    return NextResponse.json(stores);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await storeUseCases.create(body);
    return NextResponse.json(store, { status: 201 });
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
      return NextResponse.json({ error: 'Store id is required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await storeUseCases.update(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Store id is required' }, { status: 400 });
    }

    const deleted = await storeUseCases.remove(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
