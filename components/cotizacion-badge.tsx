'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRate } from '@/lib/rate-context';
import { DollarSign, Pencil, Check } from 'lucide-react';

export function CotizacionBadge() {
  const { rate, setRate } = useRate();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(rate));

  const handleSave = () => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed > 0) {
      setRate(parsed);
      setOpen(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(String(rate));
    }
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary/60 cursor-pointer">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          <span>
            Cotización:{' '}
            <span className="font-bold text-primary">
              ${rate.toLocaleString('es-AR')}
            </span>{' '}
            ARS/USDT
          </span>
          <Pencil className="h-3 w-3 text-muted-foreground ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cotización USDT → ARS</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="Ej: 1560"
              className="flex-1"
              autoFocus
            />
            <Button size="icon" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            1 USDT = ${draft ? parseFloat(draft.replace(',', '.')).toLocaleString('es-AR') : '—'} ARS
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
