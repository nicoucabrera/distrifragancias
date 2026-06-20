import { AccountingApp, AccountingHeader } from '@/components/accounting/accounting-app';

export const metadata = {
  title: 'DISTRIFRAGANCIAS - Cuentas',
  description: 'Control de costos, ventas por pedidos y stock',
};

export default function CuentasPage() {
  return (
    <div className="min-h-screen bg-background">
      <AccountingHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AccountingApp />
      </main>
    </div>
  );
}
