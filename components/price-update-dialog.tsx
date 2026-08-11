'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { parseUsdt } from '@/lib/price-utils';
import { authFetch } from '@/lib/auth-client';

interface PriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRate: number;
  onUpdated: () => void;
}

export function PriceUpdateDialog({
  open,
  onOpenChange,
  currentRate,
  onUpdated,
}: PriceUpdateDialogProps) {
  const [factor, setFactor] = useState(String(currentRate));
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async () => {
    const parsed = parseUsdt(factor);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('Ingresa un monto válido mayor a 0.');
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch('/api/perfumes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor: parsed }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Error al actualizar los precios.');
      }

      const result = await response.json();
      setSuccess(`Se actualizaron ${result.updated} precios (USDT x ${parsed}).`);
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'No se pudieron actualizar los precios.');
    } finally {
      setUpdating(false);
    }
  };

  const exampleFactor = parseUsdt(factor);
  const example = !Number.isNaN(exampleFactor) && exampleFactor > 0
    ? Math.round(26.5 * exampleFactor)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Actualizar precios en pesos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Ingresa el valor del dólar/USDT. El precio en pesos de cada producto se
            calculará multiplicando su columna USDT por este monto.
          </p>
          <div className="space-y-2">
            <Label htmlFor="priceFactor">Monto por USDT</Label>
            <Input
              id="priceFactor"
              inputMode="decimal"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
              placeholder="Ej: 1550"
            />
          </div>

          {example !== null && (
            <p className="text-sm text-muted-foreground">
              Ejemplo: USDT 26,50 x {exampleFactor} = ${example.toLocaleString('es-AR')}
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleUpdate} disabled={updating} className="gap-2">
            {updating ? 'Actualizando...' : 'Actualizar precios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
