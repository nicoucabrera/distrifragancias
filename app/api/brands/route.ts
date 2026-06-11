import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT DISTINCT MARCA as marca FROM PERFUMES ORDER BY MARCA');
    const marcas = (rows as Array<{ marca: string }>).map(row => row.marca);
    return NextResponse.json(marcas);
  } catch (error) {
    console.error('Failed to load brands:', error);
    return NextResponse.json({ error: 'No se pudo cargar las marcas.' }, { status: 500 });
  }
}
