'use client';

import { useState } from 'react';
import type { CostoItem } from '@/lib/accounting/types';
import { formatCurrency, formatDate } from '@/lib/accounting/calculations';
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

interface CostosTableProps {
  items: CostoItem[];
  onRefresh: () => void;
}

const emptyForm = { fecha: '', descripcion: '', monto: '' };

export function CostosTable({ items, onRefresh }: CostosTableProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostoItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, c) => sum + c.monto, 0);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, fecha: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  }

  function openEdit(item: CostoItem) {
    setEditing(item);
    setForm({
      fecha: item.fecha,
      descripcion: item.descripcion,
      monto: String(item.monto),
    });
    setOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    const payload = {
      fecha: form.fecha,
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
    };

    try {
      if (editing) {
        await fetch('/api/accounting/costos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        await fetch('/api/accounting/costos', {
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
    if (!confirm('¿Eliminar este costo?')) return;
    await fetch(`/api/accounting/costos?id=${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Costos e Inversiones</h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{formatDate(item.fecha)}</TableCell>
              <TableCell>{item.descripcion}</TableCell>
              <TableCell className="text-right font-mono">
                ${formatCurrency(item.monto, 0)}
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
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-semibold">
              TOTAL
            </TableCell>
            <TableCell className="text-right font-semibold font-mono">
              ${formatCurrency(total, 0)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar costo' : 'Nuevo costo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="PUBLICIDAD, PERFUMEROS..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
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
