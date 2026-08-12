'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  Button,
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Unlock } from 'lucide-react';
import {
  hasAdminAuth,
  setAdminPassword,
  clearAdminPassword,
} from '@/lib/auth-client';

interface AdminContextValue {
  isAdmin: boolean;
  /** Returns true if admin, or after successful login. Opens login dialog if not admin. */
  requireAdmin: () => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(hasAdminAuth());
  const [loginOpen, setLoginOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // promise resolve function stored in state
  const [resolveLogin, setResolveLogin] = useState<((v: boolean) => void) | null>(null);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setPassword('');
    setError(null);
    setLoading(false);
    setResolveLogin(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!password.trim()) {
      setError('Ingresá la contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

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

      if (res.status === 401) {
        setError('Contraseña incorrecta.');
        setLoading(false);
        return;
      }

      if (res.status === 503) {
        setError('La contraseña no está configurada en el servidor.');
        setLoading(false);
        return;
      }

      setAdminPassword(password);
      setIsAdmin(true);
      closeLogin();
      resolveLogin?.(true);
    } catch {
      setError('No se pudo verificar la contraseña.');
      setLoading(false);
    }
  }, [password, closeLogin, resolveLogin]);

  const requireAdmin = useCallback((): Promise<boolean> => {
    if (isAdmin) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      setResolveLogin(() => resolve);
      setLoginOpen(true);
      setPassword('');
      setError(null);
    });
  }, [isAdmin]);

  const logout = useCallback(() => {
    clearAdminPassword();
    setIsAdmin(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, requireAdmin, logout }}>
      {children}

      {/* Global login dialog — opens when requireAdmin() is called and user is not admin */}
      <Dialog
        open={loginOpen}
        onOpenChange={(open) => {
          if (!open) {
            resolveLogin?.(false);
            closeLogin();
          }
        }}
      >
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
              <Label htmlFor="admin-password-global">Contraseña</Label>
              <Input
                id="admin-password-global"
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
            <Button
              variant="outline"
              onClick={() => {
                resolveLogin?.(false);
                closeLogin();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
