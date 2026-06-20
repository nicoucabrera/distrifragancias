import { promises as fs } from 'fs';
import path from 'path';
import type { AccountingData, CostoItem, VentaPedido, VentaStock } from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'accounting.json');

async function ensureDataFile(): Promise<AccountingData> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as AccountingData;
  } catch {
    const empty: AccountingData = { costos: [], pedidos: [], stock: [] };
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
    return empty;
  }
}

async function saveData(data: AccountingData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAccountingData(): Promise<AccountingData> {
  return ensureDataFile();
}

export async function replaceAccountingData(
  data: AccountingData,
): Promise<AccountingData> {
  await saveData(data);
  return data;
}

export async function addCosto(
  item: Omit<CostoItem, 'id'>,
): Promise<CostoItem> {
  const data = await ensureDataFile();
  const nuevo: CostoItem = { ...item, id: crypto.randomUUID() };
  data.costos.push(nuevo);
  await saveData(data);
  return nuevo;
}

export async function updateCosto(
  id: string,
  item: Omit<CostoItem, 'id'>,
): Promise<CostoItem | null> {
  const data = await ensureDataFile();
  const index = data.costos.findIndex((c) => c.id === id);
  if (index === -1) return null;
  data.costos[index] = { ...item, id };
  await saveData(data);
  return data.costos[index];
}

export async function deleteCosto(id: string): Promise<boolean> {
  const data = await ensureDataFile();
  const before = data.costos.length;
  data.costos = data.costos.filter((c) => c.id !== id);
  if (data.costos.length === before) return false;
  await saveData(data);
  return true;
}

export async function addPedido(
  item: Omit<VentaPedido, 'id'>,
): Promise<VentaPedido> {
  const data = await ensureDataFile();
  const nuevo: VentaPedido = { ...item, id: crypto.randomUUID() };
  data.pedidos.push(nuevo);
  await saveData(data);
  return nuevo;
}

export async function updatePedido(
  id: string,
  item: Omit<VentaPedido, 'id'>,
): Promise<VentaPedido | null> {
  const data = await ensureDataFile();
  const index = data.pedidos.findIndex((p) => p.id === id);
  if (index === -1) return null;
  data.pedidos[index] = { ...item, id };
  await saveData(data);
  return data.pedidos[index];
}

export async function deletePedido(id: string): Promise<boolean> {
  const data = await ensureDataFile();
  const before = data.pedidos.length;
  data.pedidos = data.pedidos.filter((p) => p.id !== id);
  if (data.pedidos.length === before) return false;
  await saveData(data);
  return true;
}

export async function addStock(
  item: Omit<VentaStock, 'id'>,
): Promise<VentaStock> {
  const data = await ensureDataFile();
  const nuevo: VentaStock = { ...item, id: crypto.randomUUID() };
  data.stock.push(nuevo);
  await saveData(data);
  return nuevo;
}

export async function updateStock(
  id: string,
  item: Omit<VentaStock, 'id'>,
): Promise<VentaStock | null> {
  const data = await ensureDataFile();
  const index = data.stock.findIndex((s) => s.id === id);
  if (index === -1) return null;
  data.stock[index] = { ...item, id };
  await saveData(data);
  return data.stock[index];
}

export async function deleteStock(id: string): Promise<boolean> {
  const data = await ensureDataFile();
  const before = data.stock.length;
  data.stock = data.stock.filter((s) => s.id !== id);
  if (data.stock.length === before) return false;
  await saveData(data);
  return true;
}
