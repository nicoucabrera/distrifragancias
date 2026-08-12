'use client';

import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export function AdminAuth() {
  const { isAdmin, requireAdmin, logout } = useAdmin();

  const handleClick = () => {
    if (isAdmin) {
      logout();
    } else {
      requireAdmin();
    }
  };

  return (
    <Button
      variant={isAdmin ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className="gap-1.5"
      title={isAdmin ? 'Cerrar sesión admin' : 'Iniciar sesión admin'}
    >
      {isAdmin ? (
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
  );
}
