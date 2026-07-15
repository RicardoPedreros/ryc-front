import { NextRequest, NextResponse } from 'next/server';
import { CategoryUseCases } from '@/application/market/category-use-cases';
import { NeonCategoryRepository } from '@/infrastructure/market/repositories/neon-category-repository';

const categoryUseCases = new CategoryUseCases(new NeonCategoryRepository());

export async function GET() {
  try {
    const categories = await categoryUseCases.findAll();
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await categoryUseCases.create(body);
    return NextResponse.json(category, { status: 201 });
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
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await categoryUseCases.update(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const deleted = await categoryUseCases.remove(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
