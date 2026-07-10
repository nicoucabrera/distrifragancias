import { NextResponse } from 'next/server';
import { pool, ensureSavedQuotesTable } from '@/lib/db';

export async function GET() {
  try {
    await ensureSavedQuotesTable();

    const [rows] = await pool.query(`
      SELECT
        id,
        client_name as clientName,
        client_tel as clientTel,
        items,
        created_at as createdAt
      FROM saved_quotes
      ORDER BY created_at DESC
    `);

    // Parse items JSON for each row
    const quotes = (rows as any[]).map((row) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('GET saved-quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to load saved quotes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSavedQuotesTable();

    const body = await req.json();
    const { clientName, clientTel, items } = body;

    if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'clientName and items array are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO saved_quotes (client_name, client_tel, items) VALUES (?, ?, ?)`,
      [clientName, clientTel || '', JSON.stringify(items)]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error('POST saved-quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to save quote' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSavedQuotesTable();

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query param is required' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM saved_quotes WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE saved-quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved quote' },
      { status: 500 }
    );
  }
}
