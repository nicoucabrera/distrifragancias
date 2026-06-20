'use client';

import {
  calcularResumen,
  formatCurrency,
} from '@/lib/accounting/calculations';
import type { AccountingData } from '@/lib/accounting/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSummaryProps {
  data: AccountingData;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'positive' | 'negative';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            'h-4 w-4',
            variant === 'positive' && 'text-green-600',
            variant === 'negative' && 'text-red-600',
            variant === 'default' && 'text-muted-foreground',
          )}
        />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold',
            variant === 'positive' && 'text-green-600',
            variant === 'negative' && 'text-red-600',
          )}
        >
          ${value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const resumen = calcularResumen(data);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Costos e Inversiones"
          value={formatCurrency(resumen.totalCostos, 0)}
          icon={ArrowDownCircle}
          variant="negative"
        />
        <SummaryCard
          title="Retorno (Dife Pesos)"
          value={formatCurrency(resumen.retorno)}
          subtitle={`Pedidos: $${formatCurrency(resumen.totalPedidos)} · Stock: $${formatCurrency(resumen.totalStock)}`}
          icon={ArrowUpCircle}
          variant="positive"
        />
        <SummaryCard
          title="Diferencia"
          value={formatCurrency(resumen.diferencia)}
          subtitle="Retorno − Costos"
          icon={DollarSign}
          variant={resumen.diferencia >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Utilidad Bruta"
          value={formatCurrency(resumen.utilidadBruta)}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Utilidad Operativa"
          value={formatCurrency(resumen.utilidadOperativa)}
          subtitle={`Victor: $${formatCurrency(resumen.victorPesosPedidos, 0)} · Envío: $${formatCurrency(resumen.envioPedidos, 0)}`}
          icon={PiggyBank}
        />
        <SummaryCard
          title="Utilidad Neta"
          value={formatCurrency(resumen.utilidadNeta)}
          subtitle="Operativa − Costos"
          icon={TrendingDown}
          variant={resumen.utilidadNeta >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reparto Stock — NICO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(resumen.nicoStock)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reparto Stock — GABI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(resumen.gabiStock)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
