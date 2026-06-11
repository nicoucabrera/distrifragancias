import { NextResponse } from 'next/server';
import { pool, ensurePerfumesTable } from '@/lib/db';

export async function GET() {
  try {
    await ensurePerfumesTable();
    const [rows] = await pool.query('SELECT DISTINCT marca FROM PERFUMES ORDER BY marca');
    const marcas = (rows as Array<{ marca: string }>).map(row => row.marca);
    return NextResponse.json(marcas);
  } catch (error) {
    console.error('Failed to load brands:', error);
    return NextResponse.json({ error: 'No se pudo cargar las marcas.' }, { status: 500 });
  }
}
