import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'discountedProducts.json');

async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

export async function GET() {
  try {
    const fileContents = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(fileContents);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await ensureDataDirectory();
    await fs.writeFile(DATA_FILE, JSON.stringify(body), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving discounted products:', error);
    return NextResponse.json({ ok: false, error: 'Unable to save discounts' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fs.unlink(DATA_FILE);
  } catch {
    // ignore missing file
  }
  return NextResponse.json({ ok: true });
}
