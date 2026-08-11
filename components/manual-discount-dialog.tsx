'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tag } from 'lucide-react';
import { Perfume } from '@/lib/types';
import { parseUsdt, formatUsdt, calculateDiscount, validateDiscount } from '@/lib/price-utils';
import { authFetch } from '@/lib/auth-client';

interface ManualDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfume: Perfume | null;
  exchangeRate: number;
  onSaved: () => void;
}

export function ManualDiscountDialog({
  open,
  onOpenChange,
  perfume,
  exchangeRate,
  onSaved,
}: ManualDiscountDialogProps) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = perfume && amount
    ? calculateDiscount(perfume.usdt, perfume.pesos, parseUsdt(amount), exchangeRate)
    : null;

  const handleSave = async () => {
    if (!perfume) return;

    const validationError = validateDiscount(amount, perfume.usdt);
    if (validationError) {
      setError(validationError);
      return;
    }

    const parsedAmount = parseUsdt(amount);
    const discount = calculateDiscount(perfume.usdt, perfume.pesos, parsedAmount, exchangeRate);

    setSaving(true);
    setError(null);

    try {
      const response = await authFetch('/api/discounted-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: true,
          product: {
            id: perfume.id,
            marca: perfume.marca,
            nombre: perfume.nombre,
            usdt: perfume.usdt,
            pesos: perfume.pesos,
            discountUsdt: parsedAmount,
            discountPesos: discount.discountPesos,
            finalUsdt: discount.finalUsdt,
            finalPesos: discount.finalPesos,
            quantity: 1,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'No se pudo agregar el descuento.');
      }

      onSaved();
      onOpenChange(false);
      setAmount('');
    } catch (err: any) {
      setError(err?.message || 'No se pudo agregar el descuento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setAmount('');
          setError(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-600" />
            Agregar descuento manual
          </DialogTitle>
        </DialogHeader>
        {perfume && (
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="font-medium text-foreground">{perfume.nombre}</p>
              <p className="text-sm text-muted-foreground">{perfume.marca}</p>
              <p className="text-sm font-semibold text-primary mt-1">
                Precio: USDT {perfume.usdt} / ${perfume.pesos.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Monto del descuento (USDT)</Label>
              <Input
                id="discountAmount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Ej: 3,50"
              />
            </div>
            {preview && (
              <p className="text-sm text-muted-foreground">
                Precio final: USDT {preview.finalUsdt}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? 'Agregando...' : 'Agregar descuento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
