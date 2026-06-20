'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AccountingData } from '@/lib/accounting/types';
import { DashboardSummary } from '@/components/accounting/dashboard-summary';
import { CostosTable } from '@/components/accounting/costos-table';
import { PedidosTable } from '@/components/accounting/pedidos-table';
import { StockTable } from '@/components/accounting/stock-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';

export function AccountingApp() {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting');
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <DashboardSummary data={data} />

      <Tabs defaultValue="costos" className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="costos">Costos e Inversiones</TabsTrigger>
            <TabsTrigger value="pedidos">Ventas Pedidos</TabsTrigger>
            <TabsTrigger value="stock">Ventas Stock</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>

        <TabsContent value="costos" className="mt-6">
          <CostosTable items={data.costos} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="pedidos" className="mt-6">
          <PedidosTable items={data.pedidos} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <StockTable items={data.stock} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AccountingHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                DISTRIFRAGANCIAS — Cuentas
              </h1>
              <p className="text-muted-foreground text-sm">
                Control de costos, ventas y utilidades
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Catálogo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
