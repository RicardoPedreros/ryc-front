import { NextRequest, NextResponse } from 'next/server';
import { BrandUseCases } from '@/application/market/brand-use-cases';
import { NeonBrandRepository } from '@/infrastructure/market/repositories/neon-brand-repository';

const brandUseCases = new BrandUseCases(new NeonBrandRepository());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hierarchy = searchParams.get('hierarchy');

    if (hierarchy === 'true') {
      const tree = await brandUseCases.findHierarchy();
      return NextResponse.json(tree);
    }

    const brands = await brandUseCases.findAll();
    return NextResponse.json(brands);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brand = await brandUseCases.create(body);
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') || message.includes('not found') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand id is required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await brandUseCases.update(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Brand id is required' }, { status: 400 });
    }

    const deleted = await brandUseCases.remove(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
