import { NextRequest, NextResponse } from 'next/server';
import { ProductUseCases } from '@/application/market/product-use-cases';
import { NeonProductRepository } from '@/infrastructure/market/repositories/neon-product-repository';
import { getSessionFromRequest, canModifyRecord } from '@/shared/auth';

const productUseCases = new ProductUseCases(new NeonProductRepository());

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const q = searchParams.get('q');

    if (barcode) {
      const product = await productUseCases.findByBarcode(barcode, session?.id ?? null, session?.roleCode ?? null);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    if (q && q.trim().length > 0) {
      const products = await productUseCases.searchByName(q.trim(), session?.id ?? null, session?.roleCode ?? null);
      return NextResponse.json(products);
    }

    const details = searchParams.get('details');
    if (details === 'true') {
      const products = await productUseCases.findManyWithDetailsWithVisibility(session?.id ?? null, session?.roleCode ?? null);
      return NextResponse.json(products);
    }

    const products = await productUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    return NextResponse.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const product = await productUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const existing = await productUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only edit records you created' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await productUseCases.update(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const existing = await productUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only delete records you created' }, { status: 403 });
    }

    const deleted = await productUseCases.remove(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
