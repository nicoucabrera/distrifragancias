'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Perfume } from '@/lib/types';
import { validateProductForm, normalizeUsdt, ProductFormData } from '@/lib/price-utils';
import { authFetch } from '@/lib/auth-client';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  perfume?: Perfume | null;
  onSaved: () => void;
}

const EMPTY_FORM: ProductFormData & { saveToDb: boolean; id?: string | number } = {
  marca: '',
  nombre: '',
  usdt: '',
  pesos: '',
  saveToDb: true,
};

export function ProductFormDialog({
  open,
  onOpenChange,
  isEditing,
  perfume,
  onSaved,
}: ProductFormDialogProps) {
  const [form, setForm] = useState(() => {
    if (isEditing && perfume) {
      return {
        id: perfume.id,
        marca: perfume.marca,
        nombre: perfume.nombre,
        usdt: perfume.usdt,
        pesos: String(perfume.pesos),
        saveToDb: true,
      };
    }
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && perfume) {
      setForm({
        id: perfume.id,
        marca: perfume.marca,
        nombre: perfume.nombre,
        usdt: perfume.usdt,
        pesos: String(perfume.pesos),
        saveToDb: true,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrorMessage(null);
  }, [isEditing, perfume]);

  const handleFormChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const validationError = validateProductForm(form);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      marca: form.marca.trim(),
      nombre: form.nombre.trim(),
      usdt: normalizeUsdt(form.usdt),
      pesos: parseInt(form.pesos, 10),
    };

    setSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing) {
        const response = await authFetch('/api/perfumes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: form.id, ...payload }),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error || 'Error al actualizar el producto.');
        }
      } else if (form.saveToDb) {
        const response = await authFetch('/api/perfumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error || 'Error al guardar el producto.');
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      setErrorMessage(error?.message || 'No se pudo procesar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setErrorMessage(null);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar producto' : 'Agregar perfume nuevo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={form.marca}
                onChange={(e) => handleFormChange('marca', e.target.value)}
                placeholder="Ej: Chanel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => handleFormChange('nombre', e.target.value)}
                placeholder="Ej: Bleu de Chanel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usdt">USDT</Label>
              <Input
                id="usdt"
                value={form.usdt}
                onChange={(e) => handleFormChange('usdt', e.target.value)}
                placeholder="Ej: 65,50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pesos">Pesos</Label>
              <Input
                id="pesos"
                type="number"
                step="1"
                min="0"
                value={form.pesos}
                onChange={(e) => handleFormChange('pesos', e.target.value)}
                placeholder="Ej: 130000"
              />
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="saveToDb"
                checked={form.saveToDb}
                onCheckedChange={(checked) => handleFormChange('saveToDb', Boolean(checked))}
              />
              <Label htmlFor="saveToDb" className="text-sm">
                Guardar tambien en la base de datos
              </Label>
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar al carrito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
