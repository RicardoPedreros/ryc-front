import { NextRequest, NextResponse } from 'next/server';
import { ProductUseCases } from '@/application/market/product-use-cases';
import { NeonProductRepository } from '@/infrastructure/market/repositories/neon-product-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const productUseCases = new ProductUseCases(new NeonProductRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const q = searchParams.get('q');

    if (barcode) {
      const product = await productUseCases.findByBarcode(barcode, session?.id ?? null, session?.roleCode ?? null);
      if (!product) notFound('Product not found');
      return product;
    }

    if (q && q.trim().length > 0) {
      return productUseCases.searchByName(q.trim(), session?.id ?? null, session?.roleCode ?? null);
    }

    if (searchParams.get('details') === 'true') {
      return productUseCases.findManyWithDetailsWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    }

    return productUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const product = await productUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(product, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Product id is required');

    const existing = await productUseCases.findById(id);
    if (!existing) notFound('Product not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return productUseCases.update(id, body);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Product id is required');

    const existing = await productUseCases.findById(id);
    if (!existing) notFound('Product not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only delete records you created');
    }

    const deleted = await productUseCases.remove(id);
    return { success: deleted };
  });
}