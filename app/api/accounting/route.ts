import { NextResponse } from 'next/server';
import { calcularResumen } from '@/lib/accounting/calculations';
import {
  getAccountingData,
  replaceAccountingData,
} from '@/lib/accounting/store';

export async function GET() {
  const data = await getAccountingData();
  const resumen = calcularResumen(data);
  return NextResponse.json({ data, resumen });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const data = await replaceAccountingData(body);
  const resumen = calcularResumen(data);
  return NextResponse.json({ data, resumen });
}
