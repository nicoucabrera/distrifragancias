import { NextResponse } from 'next/server';
import {
  addPedido,
  deletePedido,
  updatePedido,
} from '@/lib/accounting/store';

export async function POST(request: Request) {
  const body = await request.json();
  const item = await addPedido(body);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  const item = await updatePedido(id, rest);
  if (!item) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }
  const ok = await deletePedido(id);
  if (!ok) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
