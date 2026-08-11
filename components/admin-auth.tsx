'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Unlock, LogOut } from 'lucide-react';
import {
  setAdminPassword,
  clearAdminPassword,
  hasAdminAuth,
} from '@/lib/auth-client';

export function AdminAuth() {
  const [authenticated, setAuthenticated] = useState(hasAdminAuth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Ingresá la contraseña.');
      return;
    }

    // Test the password against the API
    try {
      const encoded = btoa(`admin:${password}`);
      const res = await fetch('/api/perfumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${encoded}`,
        },
        body: JSON.stringify({
          marca: '__test__',
          nombre: '__test__',
          usdt: '0,00',
          pesos: 0,
        }),
      });

      // 409 = product exists (password is correct), 400 = validation (password correct),
      // 401 = wrong password, 500 = server error (still means password was checked)
      if (res.status === 401) {
        setError('Contraseña incorrecta.');
        return;
      }

      // Any non-401 means auth passed
      setAdminPassword(password);
      setAuthenticated(true);
      setDialogOpen(false);
      setPassword('');
      setError(null);
    } catch {
      setError('No se pudo verificar la contraseña.');
    }
  };

  const handleLogout = () => {
    clearAdminPassword();
    setAuthenticated(false);
  };

  return (
    <>
      <Button
        variant={authenticated ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          if (authenticated) {
            handleLogout();
          } else {
            setDialogOpen(true);
          }
        }}
        className="gap-1.5"
        title={authenticated ? 'Cerrar sesión admin' : 'Iniciar sesión admin'}
      >
        {authenticated ? (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Acceso Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Necesitás la contraseña para agregar, editar o eliminar productos.
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                placeholder="Ingresá la contraseña"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin}>Ingresar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
