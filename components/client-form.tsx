'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/lib/cart-context';
import { User, Phone } from 'lucide-react';

export function ClientForm() {
  const { clientInfo, setClientInfo } = useCart();
  const [nombre, setNombre] = useState(clientInfo.nombre);
  const [tel, setTel] = useState(clientInfo.tel);

  const handleNombreChange = (value: string) => {
    setNombre(value);
    setClientInfo({ ...clientInfo, nombre: value });
  };

  const handleTelChange = (value: string) => {
    setTel(value);
    setClientInfo({ ...clientInfo, tel: value });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Datos del Cliente
      </h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre" className="text-sm font-medium text-foreground">
            Nombre
          </Label>
          <Input
            id="nombre"
            placeholder="Ingrese el nombre del cliente"
            value={nombre}
            onChange={(e) => handleNombreChange(e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tel" className="text-sm font-medium text-foreground">
            Teléfono
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="tel"
              type="tel"
              placeholder="Ej: +54 9 11 1234-5678"
              value={tel}
              onChange={(e) => handleTelChange(e.target.value)}
              className="bg-background pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
