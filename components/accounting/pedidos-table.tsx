'use client';

import { useState } from 'react';
import type { VentaPedido } from '@/lib/accounting/types';
import {
  calcularVentaPedido,
  formatCurrency,
  formatDate,
} from '@/lib/accounting/calculations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosTableProps {
  items: VentaPedido[];
  onRefresh: () => void;
}

const emptyForm = {
  fecha: '',
  cliente: '',
  montoVenta: '',
  tipoCambio: '',
  prodUsdt: '',
  envio: '0',
};

export function PedidosTable({ items, onRefresh }: PedidosTableProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VentaPedido | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const calculados = items.map(calcularVentaPedido);
  const totalDife = calculados.reduce((sum, c) => sum + c.difePesos, 0);

  function openNew() {
    setEditing(null);
    setForm({
      ...emptyForm,
      fecha: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  function openEdit(item: VentaPedido) {
    setEditing(item);
    setForm({
      fecha: item.fecha,
      cliente: item.cliente,
      montoVenta: String(item.montoVenta),
      tipoCambio: String(item.tipoCambio),
      prodUsdt: String(item.prodUsdt),
      envio: String(item.envio),
    });
    setOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    const payload = {
      fecha: form.fecha,
      cliente: form.cliente,
      montoVenta: parseFloat(form.montoVenta),
      tipoCambio: parseFloat(form.tipoCambio),
      prodUsdt: parseFloat(form.prodUsdt),
      envio: parseFloat(form.envio) || 0,
    };

    try {
      if (editing) {
        await fetch('/api/accounting/pedidos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        await fetch('/api/accounting/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta venta?')) return;
    await fetch(`/api/accounting/pedidos?id=${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Ventas por Pedidos</h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">TC</TableHead>
              <TableHead className="text-right">USDT</TableHead>
              <TableHead className="text-right">Prod USDT</TableHead>
              <TableHead className="text-right">Victor 10%</TableHead>
              <TableHead className="text-right">Victor $</TableHead>
              <TableHead className="text-right">Prod $</TableHead>
              <TableHead className="text-right">Envío</TableHead>
              <TableHead className="text-right">Dife USDT</TableHead>
              <TableHead className="text-right">Dife $</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const c = calculados[i];
              return (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(item.fecha)}
                  </TableCell>
                  <TableCell>{item.cliente}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatCurrency(item.montoVenta, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.tipoCambio, 1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(c.ventaUsdt)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.prodUsdt)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(c.victor10)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatCurrency(c.victorPesos, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatCurrency(c.productosPesos)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatCurrency(item.envio, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(c.difeUsdt)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono font-medium',
                      c.difePesos >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    ${formatCurrency(c.difePesos)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={11} className="font-semibold">
                TOTAL PESOS
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold font-mono',
                  totalDife >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                ${formatCurrency(totalDife)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar venta' : 'Nueva venta por pedido'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2 col-span-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Cliente</Label>
              <Input
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Monto Venta ($)</Label>
              <Input
                type="number"
                value={form.montoVenta}
                onChange={(e) =>
                  setForm({ ...form, montoVenta: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cambio</Label>
              <Input
                type="number"
                step="0.1"
                value={form.tipoCambio}
                onChange={(e) =>
                  setForm({ ...form, tipoCambio: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Prod. USDT</Label>
              <Input
                type="number"
                step="0.01"
                value={form.prodUsdt}
                onChange={(e) => setForm({ ...form, prodUsdt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Envío ($)</Label>
              <Input
                type="number"
                value={form.envio}
                onChange={(e) => setForm({ ...form, envio: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
